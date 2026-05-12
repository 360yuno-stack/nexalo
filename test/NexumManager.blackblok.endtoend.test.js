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

async function fillBlackblokRoundSpecific(manager, buyer) {
  const productId = 5;

  for (let start = 0; start < 10000; start += 10) {
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

describe("NexumManager - BLACKBLOK distribución real", function () {
  it("deja una ronda BLACKBLOK preparada y muestra toda la distribución recaudada", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, nxl, treasury } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 5;
    const roundId = await manager.currentRound(productId);

    const product = await manager.products(productId);
    expect(product.priceUSDE18).to.equal(ethers.parseEther("200"));
    expect(product.maxTickets).to.equal(10000n);
    expect(product.nxlPerTicket).to.equal(ethers.parseEther("1"));
    expect(product.nxlWinnerBonus).to.equal(ethers.parseEther("1"));
    expect(product.jackpotUSDE18).to.equal(ethers.parseEther("1000000"));

    expect(await nxl.treasuryBTC()).to.equal(await treasury.getAddress());

    const initialNXLPool = ethers.parseEther("50000");
    await nxl.setAvailableRewards(initialNXLPool);

    const status0 = await manager.getRoundLiquidityStatus(productId, roundId);
    const liquidityTarget = status0.liquidityTarget;
    expect(liquidityTarget).to.equal(ethers.parseEther("200000"));

    await fundAndApprove(
      stable,
      signers.investor1,
      await manager.getAddress(),
      liquidityTarget
    );
    await manager
      .connect(signers.investor1)
      .provideRoundLiquidity(productId, roundId, liquidityTarget);

    const totalPaid = ethers.parseEther("2000000");
    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);

    const founderBefore = await stable.balanceOf(signers.founder.address);
    const feesBefore = await stable.balanceOf(signers.feesReceiver.address);
    const opsBefore = await stable.balanceOf(signers.operationsService.address);
    const partnerBefore = await stable.balanceOf(signers.partner.address);
    const treasuryBefore = await stable.balanceOf(await treasury.getAddress());
    const auditBefore = await manager.auditAccrued();
    const nxlBefore = await nxl.availableRewards();

    await fillBlackblokRoundSpecific(manager, signers.buyer);

    const founderAfter = await stable.balanceOf(signers.founder.address);
    const feesAfter = await stable.balanceOf(signers.feesReceiver.address);
    const opsAfter = await stable.balanceOf(signers.operationsService.address);
    const partnerAfter = await stable.balanceOf(signers.partner.address);
    const treasuryAfter = await stable.balanceOf(await treasury.getAddress());
    const auditAfter = await manager.auditAccrued();
    const nxlAfter = await nxl.availableRewards();

    const round = await manager.rounds(productId, roundId);
    const status = await manager.getRoundLiquidityStatus(productId, roundId);

    expect(round.ticketsSold).to.equal(10000n);
    expect(round.vrfRequested).to.equal(true);
    expect(round.completed).to.equal(false);

    expect(round.prizePot).to.equal(ethers.parseEther("1200000"));
    expect(round.instantPot).to.equal(ethers.parseEther("200000"));
    expect(round.liquidityProfitPool).to.equal(ethers.parseEther("60000"));

    expect(status.liquidityTarget).to.equal(ethers.parseEther("200000"));
    expect(status.liquidityFunded).to.equal(ethers.parseEther("200000"));
    expect(status.liquidityProfitPool).to.equal(ethers.parseEther("60000"));
    expect(status.liquiditySettled).to.equal(false);

    expect(founderAfter - founderBefore).to.equal(ethers.parseEther("140000"));
    expect(feesAfter - feesBefore).to.equal(ethers.parseEther("40000"));
    expect(opsAfter - opsBefore).to.equal(ethers.parseEther("20000"));
    expect(partnerAfter - partnerBefore).to.equal(ethers.parseEther("20000"));
    expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseEther("200000"));
    expect(auditAfter - auditBefore).to.equal(ethers.parseEther("20000"));
    expect(nxlBefore - nxlAfter).to.equal(ethers.parseEther("10000"));

    const investorPosition = await manager.getInvestorPosition(
      productId,
      roundId,
      signers.investor1.address
    );

    expect(investorPosition.principal).to.equal(ethers.parseEther("200000"));
    expect(investorPosition.estimatedProfit).to.equal(ethers.parseEther("60000"));
    expect(investorPosition.estimatedTotalReturn).to.equal(ethers.parseEther("260000"));
    expect(investorPosition.settled).to.equal(false);

    console.log("\n=== BLACKBLOK DISTRIBUCIÓN SOBRE 2,000,000 ===");
    console.log("Prize pot final:           ", ethers.formatEther(round.prizePot));
    console.log("Instant pot:               ", ethers.formatEther(round.instantPot));
    console.log("Liquidity profit pool:     ", ethers.formatEther(round.liquidityProfitPool));
    console.log("Treasury BTC:              ", ethers.formatEther(treasuryAfter - treasuryBefore));
    console.log("Founder:                   ", ethers.formatEther(founderAfter - founderBefore));
    console.log("Fees:                      ", ethers.formatEther(feesAfter - feesBefore));
    console.log("Operations:                ", ethers.formatEther(opsAfter - opsBefore));
    console.log("Audit accrued:             ", ethers.formatEther(auditAfter - auditBefore));
    console.log("Partner:                   ", ethers.formatEther(partnerAfter - partnerBefore));
    console.log("NXL distributed tickets:   ", ethers.formatEther(nxlBefore - nxlAfter));
    console.log("Investor principal:        ", ethers.formatEther(investorPosition.principal));
    console.log("Investor estimated profit: ", ethers.formatEther(investorPosition.estimatedProfit));
    console.log("Investor total return:     ", ethers.formatEther(investorPosition.estimatedTotalReturn));
    console.log("================================================\n");
  });
});