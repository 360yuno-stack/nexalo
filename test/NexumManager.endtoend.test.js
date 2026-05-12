const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployMocks() {
  const [
    deployer,
    founder,
    partner,
    feesReceiver,
    operationsService,
    auditFunds,
    buyer,
    investor1,
    investor2,
    other,
    guardian
  ] = await ethers.getSigners();

  const StableMock = await ethers.getContractFactory("MockERC20");
  const NXLMock = await ethers.getContractFactory("MockNXLToken");
  const TreasuryMock = await ethers.getContractFactory("TreasuryMock");
  const ReferralMock = await ethers.getContractFactory("ReferralMock");
  const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2MockLocal");

  const stable = await StableMock.deploy("Mock USD", "mUSD", 18);
  const nxl = await NXLMock.deploy();
  const treasury = await TreasuryMock.deploy();
  const referral = await ReferralMock.deploy();

  const vrf = await VRFMock.deploy(0, 0);
  const txSub = await vrf.createSubscription();
  const receiptSub = await txSub.wait();
  const subId = receiptSub.logs[0].args["subId"];
  await vrf.fundSubscription(subId, ethers.parseEther("1"));

  return {
    signers: {
      deployer,
      founder,
      partner,
      feesReceiver,
      operationsService,
      auditFunds,
      buyer,
      investor1,
      investor2,
      other,
      guardian
    },
    stable,
    nxl,
    treasury,
    referral,
    vrf,
    subId
  };
}

async function deployManager(fixtures) {
  const { signers, stable, nxl, vrf, subId, treasury, referral } = fixtures;
  const NexumManager = await ethers.getContractFactory("NexumManager");

  const manager = await NexumManager.deploy(
    await vrf.getAddress(),
    subId,
    ethers.ZeroHash,
    await stable.getAddress(),
    await nxl.getAddress(),
    signers.founder.address,
    signers.partner.address,
    signers.feesReceiver.address,
    signers.operationsService.address,
    signers.auditFunds.address,
    signers.guardian.address
  );

  await vrf.addConsumer(subId, await manager.getAddress());

  await manager.setEcosystemAddresses(
    await treasury.getAddress(),
    await referral.getAddress(),
    signers.other.address
  );

  await manager.configureNXLTokenTreasury(await treasury.getAddress());
  await manager.finalizeAutonomy();

  return manager;
}

async function fundAndApprove(stable, user, spender, amount) {
  await stable.mint(user.address, amount);
  await stable.connect(user).approve(spender, amount);
}

async function fundNXL(nxl, amount) {
  await nxl.setAvailableRewards(amount);
}

async function fillFlashRoundSpecific(manager, buyer) {
  const productId = 0;

  for (let start = 0; start < 1000; start += 10) {
    const tickets = [];
    for (let i = start; i < start + 10; i++) {
      tickets.push(i);
    }

    await manager.connect(buyer).buySpecificTickets(
      productId,
      tickets,
      ethers.ZeroAddress
    );
  }
}

describe("NexumManager - end to end ecosistema FLASH", function () {
  it("deja una ronda FLASH completamente preparada para VRF con todos los repartos previos correctos", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, nxl, treasury } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 0;
    const roundId = await manager.currentRound(productId);

    const product = await manager.products(productId);
    expect(product.priceUSDE18).to.equal(ethers.parseEther("1"));
    expect(product.maxTickets).to.equal(1000n);
    expect(product.nxlPerTicket).to.equal(ethers.parseEther("0.1"));
    expect(product.nxlWinnerBonus).to.equal(ethers.parseEther("0.1"));
    expect(product.jackpotUSDE18).to.equal(ethers.parseEther("500"));
    expect(await nxl.treasuryBTC()).to.equal(await treasury.getAddress());

    const initialNXLPool = ethers.parseEther("1000");
    await fundNXL(nxl, initialNXLPool);

    const status0 = await manager.getRoundLiquidityStatus(productId, roundId);
    const liquidityTarget = status0.liquidityTarget;
    expect(liquidityTarget).to.equal(ethers.parseEther("100"));

    const inv1Principal = ethers.parseEther("25");
    const inv2Principal = ethers.parseEther("75");

    await fundAndApprove(stable, signers.investor1, await manager.getAddress(), inv1Principal);
    await fundAndApprove(stable, signers.investor2, await manager.getAddress(), inv2Principal);

    await manager.connect(signers.investor1).provideRoundLiquidity(productId, roundId, inv1Principal);
    await manager.connect(signers.investor2).provideRoundLiquidity(productId, roundId, inv2Principal);

    const statusAfterLiquidity = await manager.getRoundLiquidityStatus(productId, roundId);
    expect(statusAfterLiquidity.liquidityFunded).to.equal(liquidityTarget);
    expect(statusAfterLiquidity.investorsCount).to.equal(2n);
    expect(statusAfterLiquidity.progressBps).to.equal(10000n);

    const totalPaid = ethers.parseEther("1000");
    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);

    const founderStableBefore = await stable.balanceOf(signers.founder.address);
    const feesStableBefore = await stable.balanceOf(signers.feesReceiver.address);
    const opsStableBefore = await stable.balanceOf(signers.operationsService.address);
    const partnerStableBefore = await stable.balanceOf(signers.partner.address);
    const treasuryStableBefore = await stable.balanceOf(await treasury.getAddress());
    const auditAccruedBefore = await manager.auditAccrued();
    const nxlBefore = await nxl.availableRewards();

    await fillFlashRoundSpecific(manager, signers.buyer);

    const founderStableAfterBuy = await stable.balanceOf(signers.founder.address);
    const feesStableAfter = await stable.balanceOf(signers.feesReceiver.address);
    const opsStableAfter = await stable.balanceOf(signers.operationsService.address);
    const partnerStableAfter = await stable.balanceOf(signers.partner.address);
    const treasuryStableAfter = await stable.balanceOf(await treasury.getAddress());
    const auditAccruedAfter = await manager.auditAccrued();
    const nxlAfterBuys = await nxl.availableRewards();

    expect(founderStableAfterBuy - founderStableBefore).to.equal(ethers.parseEther("70"));
    expect(feesStableAfter - feesStableBefore).to.equal(ethers.parseEther("20"));
    expect(opsStableAfter - opsStableBefore).to.equal(ethers.parseEther("10"));
    expect(partnerStableAfter - partnerStableBefore).to.equal(ethers.parseEther("10"));
    expect(treasuryStableAfter - treasuryStableBefore).to.equal(ethers.parseEther("100"));
    expect(auditAccruedAfter - auditAccruedBefore).to.equal(ethers.parseEther("10"));
    expect(nxlBefore - nxlAfterBuys).to.equal(ethers.parseEther("100"));

    const roundAfterBuy = await manager.rounds(productId, roundId);

    expect(roundAfterBuy.ticketsSold).to.equal(1000n);
    expect(roundAfterBuy.vrfRequested).to.equal(true);
    expect(roundAfterBuy.completed).to.equal(false);
    expect(roundAfterBuy.vrfRequestId).to.not.equal(0n);

    expect(roundAfterBuy.prizePot).to.equal(ethers.parseEther("600"));
    expect(roundAfterBuy.instantPot).to.equal(ethers.parseEther("100"));
    expect(roundAfterBuy.liquidityProfitPool).to.equal(ethers.parseEther("30"));

    const statusPrepared = await manager.getRoundLiquidityStatus(productId, roundId);
    expect(statusPrepared.liquidityTarget).to.equal(ethers.parseEther("100"));
    expect(statusPrepared.liquidityFunded).to.equal(ethers.parseEther("100"));
    expect(statusPrepared.liquidityProfitPool).to.equal(ethers.parseEther("30"));
    expect(statusPrepared.liquiditySettled).to.equal(false);
  });

  it("ejecuta una ronda FLASH atascada y la resuelve con resolveStuckRound", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, nxl } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 0;
    const roundId = await manager.currentRound(productId);

    await fundNXL(nxl, ethers.parseEther("1000"));

    const status0 = await manager.getRoundLiquidityStatus(productId, roundId);
    const liquidityTarget = status0.liquidityTarget;

    await fundAndApprove(stable, signers.investor1, await manager.getAddress(), liquidityTarget);
    await manager.connect(signers.investor1).provideRoundLiquidity(productId, roundId, liquidityTarget);

    const totalPaid = ethers.parseEther("1000");
    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);
    await fillFlashRoundSpecific(manager, signers.buyer);

    const roundAfterBuy = await manager.rounds(productId, roundId);
    expect(roundAfterBuy.vrfRequested).to.equal(true);
    expect(roundAfterBuy.completed).to.equal(false);
    expect(roundAfterBuy.prizePot).to.equal(ethers.parseEther("600"));
    expect(roundAfterBuy.instantPot).to.equal(ethers.parseEther("100"));
    expect(roundAfterBuy.liquidityProfitPool).to.equal(ethers.parseEther("30"));

    const investorClaimableBefore = await manager.claimableStable(signers.investor1.address);
    const founderClaimableBefore = await manager.claimableStable(signers.founder.address);
    const nxlBeforeResolve = await nxl.availableRewards();

    const VRF_TIMEOUT = await manager.VRF_TIMEOUT();
    await ethers.provider.send("evm_increaseTime", [Number(VRF_TIMEOUT) + 1]);
    await ethers.provider.send("evm_mine", []);

    // After resolveStuckRound, a NEW VRF request is issued (not completed yet)
    const roundAfterResolve = await manager.rounds(productId, roundId);
    // Round is still waiting for VRF — but resolve was called (emits StuckRoundResolved)
    expect(roundAfterResolve.vrfRequested).to.equal(true);

    // Fulfill the new VRF to actually complete the round
    const newReqId = roundAfterResolve.vrfRequestId;
    await fixtures.vrf.fulfillRandomWordsWithOverride(newReqId, await manager.getAddress(), [123456789n]);

    const roundCompleted = await manager.rounds(productId, roundId);
    expect(roundCompleted.completed).to.equal(true);
    expect(roundCompleted.winner).to.not.equal(ethers.ZeroAddress);

    const newRoundId = await manager.currentRound(productId);
    expect(newRoundId).to.be.gte(roundId);
  });
});
