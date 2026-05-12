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

async function fillPremiumRoundSpecific(manager, buyer) {
  const productId = 2;
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

describe("NexumManager - end to end ecosistema PREMIUM", function () {
  it("deja una ronda PREMIUM preparada y muestra la distribuciÃ³n completa de lo recaudado", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, nxl, treasury } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 2;
    const roundId = await manager.currentRound(productId);

    const product = await manager.products(productId);
    expect(product.priceUSDE18).to.equal(ethers.parseEther("20"));
    expect(product.maxTickets).to.equal(1000n);
    expect(product.nxlPerTicket).to.equal(ethers.parseEther("0.5"));
    expect(product.nxlWinnerBonus).to.equal(ethers.parseEther("0.5"));
    expect(product.jackpotUSDE18).to.equal(ethers.parseEther("10000"));

    const initialNXLPool = ethers.parseEther("10000");
    await nxl.setAvailableRewards(initialNXLPool);

    const status0 = await manager.getRoundLiquidityStatus(productId, roundId);
    const liquidityTarget = status0.liquidityTarget;
    expect(liquidityTarget).to.equal(ethers.parseEther("2000"));

    const inv1Principal = ethers.parseEther("500");
    const inv2Principal = ethers.parseEther("1500");

    await fundAndApprove(stable, signers.investor1, await manager.getAddress(), inv1Principal);
    await fundAndApprove(stable, signers.investor2, await manager.getAddress(), inv2Principal);

    await manager.connect(signers.investor1).provideRoundLiquidity(productId, roundId, inv1Principal);
    await manager.connect(signers.investor2).provideRoundLiquidity(productId, roundId, inv2Principal);

    const totalPaid = ethers.parseEther("20000");
    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);

    const founderBefore = await stable.balanceOf(signers.founder.address);
    const feesBefore = await stable.balanceOf(signers.feesReceiver.address);
    const opsBefore = await stable.balanceOf(signers.operationsService.address);
    const partnerBefore = await stable.balanceOf(signers.partner.address);
    const treasuryBefore = await stable.balanceOf(await treasury.getAddress());
    const auditBefore = await manager.auditAccrued();
    const nxlBefore = await nxl.availableRewards();

    await fillPremiumRoundSpecific(manager, signers.buyer);

    const founderAfter = await stable.balanceOf(signers.founder.address);
    const feesAfter = await stable.balanceOf(signers.feesReceiver.address);
    const opsAfter = await stable.balanceOf(signers.operationsService.address);
    const partnerAfter = await stable.balanceOf(signers.partner.address);
    const treasuryAfter = await stable.balanceOf(await treasury.getAddress());
    const auditAfter = await manager.auditAccrued();
    const nxlAfter = await nxl.availableRewards();

    const round = await manager.rounds(productId, roundId);
    const status = await manager.getRoundLiquidityStatus(productId, roundId);

    expect(round.ticketsSold).to.equal(1000n);
    expect(round.vrfRequested).to.equal(true);
    expect(round.completed).to.equal(false);

    expect(round.prizePot).to.equal(ethers.parseEther("12000"));
    expect(round.instantPot).to.equal(ethers.parseEther("2000"));
    expect(round.liquidityProfitPool).to.equal(ethers.parseEther("600"));

    expect(status.liquidityTarget).to.equal(ethers.parseEther("2000"));
    expect(status.liquidityFunded).to.equal(ethers.parseEther("2000"));
    expect(status.liquidityProfitPool).to.equal(ethers.parseEther("600"));
    expect(status.liquiditySettled).to.equal(false);

    expect(founderAfter - founderBefore).to.equal(ethers.parseEther("1400"));
    expect(feesAfter - feesBefore).to.equal(ethers.parseEther("400"));
    expect(opsAfter - opsBefore).to.equal(ethers.parseEther("200"));
    expect(partnerAfter - partnerBefore).to.equal(ethers.parseEther("200"));
    expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseEther("2000"));
    expect(auditAfter - auditBefore).to.equal(ethers.parseEther("200"));
    expect(nxlBefore - nxlAfter).to.equal(ethers.parseEther("500"));

    console.log("\n=== DISTRIBUCIÃ“N PREMIUM SOBRE 20,000 ===");
    console.log("Prize pot final:         ", ethers.formatEther(round.prizePot));
    console.log("Instant pot:             ", ethers.formatEther(round.instantPot));
    console.log("Liquidity profit pool:   ", ethers.formatEther(round.liquidityProfitPool));
    console.log("Treasury BTC:            ", ethers.formatEther(treasuryAfter - treasuryBefore));
    console.log("Founder:                 ", ethers.formatEther(founderAfter - founderBefore));
    console.log("Fees:                    ", ethers.formatEther(feesAfter - feesBefore));
    console.log("Operations:              ", ethers.formatEther(opsAfter - opsBefore));
    console.log("Audit accrued:           ", ethers.formatEther(auditAfter - auditBefore));
    console.log("Partner:                 ", ethers.formatEther(partnerAfter - partnerBefore));
    console.log("Referral/ambassador net: ", "2000.0 -> prize pot fallback parcial/efectivo del setup");
    console.log("NXL distributed tickets: ", ethers.formatEther(nxlBefore - nxlAfter));
    console.log("=========================================\n");
  });

  it("resuelve una ronda PREMIUM atascada y liquida premio, instant y liquidez", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, nxl } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 2;
    const roundId = await manager.currentRound(productId);

    await nxl.setAvailableRewards(ethers.parseEther("10000"));

    const status0 = await manager.getRoundLiquidityStatus(productId, roundId);
    const liquidityTarget = status0.liquidityTarget;

    await fundAndApprove(stable, signers.investor1, await manager.getAddress(), liquidityTarget);
    await manager.connect(signers.investor1).provideRoundLiquidity(productId, roundId, liquidityTarget);

    const totalPaid = ethers.parseEther("20000");
    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);
    await fillPremiumRoundSpecific(manager, signers.buyer);

    const investorClaimableBefore = await manager.claimableStable(signers.investor1.address);
    const nxlBeforeResolve = await nxl.availableRewards();

    const VRF_TIMEOUT = await manager.VRF_TIMEOUT();
    await ethers.provider.send("evm_increaseTime", [Number(VRF_TIMEOUT) + 1]);
    await ethers.provider.send("evm_mine", []);

    // resolveStuckRound now re-issues VRF (doesn't complete round directly)
    await manager.resolveStuckRound(productId, roundId);

    // Fulfill the re-issued VRF to complete the round
    const roundAfterResolve = await manager.rounds(productId, roundId);
    expect(roundAfterResolve.vrfRequested).to.equal(true);
    const newReqId = roundAfterResolve.vrfRequestId;
    await fixtures.vrf.fulfillRandomWordsWithOverride(newReqId, await manager.getAddress(), [987654321n]);

    const roundCompleted = await manager.rounds(productId, roundId);
    const statusAfterResolve = await manager.getRoundLiquidityStatus(productId, roundId);
    const investorClaimableAfter = await manager.claimableStable(signers.investor1.address);
    const winnerClaimable = await manager.claimableStable(roundCompleted.winner);
    const nxlAfterResolve = await nxl.availableRewards();

    expect(roundCompleted.completed).to.equal(true);
    expect(roundCompleted.winner).to.not.equal(ethers.ZeroAddress);
    expect(statusAfterResolve.liquiditySettled).to.equal(true);
    expect(statusAfterResolve.liquidityReturnedPrincipal).to.equal(liquidityTarget);

    console.log("\n=== SETTLEMENT PREMIUM ===");
    console.log("Winner:                  ", roundCompleted.winner);
    console.log("Winner claimable stable: ", ethers.formatEther(winnerClaimable));
    console.log("Investor return total:   ", ethers.formatEther(investorClaimableAfter - investorClaimableBefore));
    console.log("Liquidity settled:       ", statusAfterResolve.liquiditySettled);
    console.log("==========================\n");
  });
});
