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
    other
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
    signers: { deployer, founder, partner, feesReceiver, operationsService, auditFunds, buyer, investor1, other },
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
    signers.auditFunds.address
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
    for (let i = start; i < start + 10; i++) tickets.push(i);
    await manager.connect(buyer).buySpecificTickets(productId, tickets, ethers.ZeroAddress);
  }
}

describe("NexumManager - PREMIUM claims", function () {
  it("permite claimStable, withdrawAuditFunds y muestra claimNXL solo si existe accrual", async function () {
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

    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), ethers.parseEther("20000"));
    await fillPremiumRoundSpecific(manager, signers.buyer);

    const VRF_TIMEOUT = await manager.VRF_TIMEOUT();
    await ethers.provider.send("evm_increaseTime", [Number(VRF_TIMEOUT) + 1]);
    await ethers.provider.send("evm_mine", []);

    await manager.resolveStuckRound(productId, roundId);

    const round = await manager.rounds(productId, roundId);
    const winner = round.winner;

    const investorClaimable = await manager.claimableStable(signers.investor1.address);
    const winnerClaimable = await manager.claimableStable(winner);

    expect(investorClaimable).to.equal(ethers.parseEther("2600"));
    expect(winnerClaimable).to.be.gte(ethers.parseEther("12000"));
    expect(winnerClaimable).to.be.lte(ethers.parseEther("14000"));

    const investorStableBefore = await stable.balanceOf(signers.investor1.address);
    await manager.connect(signers.investor1).claimStable();
    const investorStableAfter = await stable.balanceOf(signers.investor1.address);
    expect(investorStableAfter - investorStableBefore).to.equal(investorClaimable);
    expect(await manager.claimableStable(signers.investor1.address)).to.equal(0n);

    const winnerStableBefore = await stable.balanceOf(winner);
    await manager.connect(await ethers.getSigner(winner)).claimStable();
    const winnerStableAfter = await stable.balanceOf(winner);
    expect(winnerStableAfter - winnerStableBefore).to.equal(winnerClaimable);
    expect(await manager.claimableStable(winner)).to.equal(0n);

    const auditBefore = await stable.balanceOf(signers.auditFunds.address);
    await manager.connect(signers.auditFunds).withdrawAuditFunds();
    const auditAfter = await stable.balanceOf(signers.auditFunds.address);
    expect(auditAfter - auditBefore).to.equal(ethers.parseEther("200"));
    expect(await manager.auditAccrued()).to.equal(0n);

    const buyerClaimableNXL = await manager.claimableNXL(signers.buyer.address);
    if (buyerClaimableNXL > 0n) {
      const nxlBeforeClaim = await nxl.availableRewards();
      await manager.connect(signers.buyer).claimNXL();
      const nxlAfterClaim = await nxl.availableRewards();
      expect(nxlBeforeClaim - nxlAfterClaim).to.equal(buyerClaimableNXL);
      expect(await manager.claimableNXL(signers.buyer.address)).to.equal(0n);
    }

    console.log("\n=== PREMIUM CLAIMS ===");
    console.log("Investor claimed stable: ", ethers.formatEther(investorClaimable));
    console.log("Winner claimed stable:   ", ethers.formatEther(winnerClaimable));
    console.log("Audit claimed stable:    ", "200.0");
    console.log("Buyer claimable NXL:     ", ethers.formatEther(buyerClaimableNXL));
    console.log("=======================\n");
  });
});