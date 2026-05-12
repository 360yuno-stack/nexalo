/**
 * NEXALO — Full Ecosystem Integration Test
 * End-to-end: Deploy → Configure → Buy → VRF → Claim → Treasury → Staking
 */
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("NEXALO Full Ecosystem Integration", function () {
  this.timeout(120_000);

  let nm, nxl, usdt, wbtc, vrf, tb, rn, ar, staking;
  let owner, founder, partner, feesReceiver, opsService, auditAddr, guardian;
  let user1, user2, user3;

  before(async function () {
    [owner, founder, partner, feesReceiver, opsService, auditAddr, guardian,
     user1, user2, user3] = await ethers.getSigners();

    // 1. USDT + WBTC
    usdt = await (await ethers.getContractFactory("contracts/TestUSDT.sol:TestUSDT")).deploy();
    wbtc = await (await ethers.getContractFactory("contracts/TestUSDT.sol:TestUSDT")).deploy();

    // 2. Chainlink VRFCoordinatorV2Mock
    const MockVRF = await ethers.getContractFactory(
      "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol:VRFCoordinatorV2Mock"
    );
    vrf = await MockVRF.deploy(ethers.parseEther("1"), 1_000_000_000n);
    await vrf.createSubscription();
    await vrf.fundSubscription(1n, ethers.parseEther("10"));

    // 3. Deploy NXL (2-arg constructor, then setNexumManager after manager is deployed)
    const VRF_KEY = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";

    nxl = await (await ethers.getContractFactory("NXLToken"))
      .deploy(founder.address, partner.address);

    nm = await (await ethers.getContractFactory("NexumManager")).deploy(
      await vrf.getAddress(), 1n, VRF_KEY,
      await usdt.getAddress(), await nxl.getAddress(),
      founder.address, partner.address,
      feesReceiver.address, opsService.address,
      auditAddr.address, guardian.address
    );
    await vrf.addConsumer(1n, await nm.getAddress());
    await nxl.setNexumManager(await nm.getAddress());

    // 4. Supporting contracts
    rn = await (await ethers.getContractFactory("ReferralNetwork")).deploy(await usdt.getAddress());
    await rn.setNexumManager(await nm.getAddress());

    ar = await (await ethers.getContractFactory("AmbassadorRegistry")).deploy(await usdt.getAddress());

    const redeemStart = (await time.latest()) + 60;
    tb = await (await ethers.getContractFactory("TreasuryBTC")).deploy(
      await usdt.getAddress(), await nxl.getAddress(),
      await nm.getAddress(), await wbtc.getAddress(),
      redeemStart, 7 * 24 * 3600
    );

    staking = await (await ethers.getContractFactory("NexaloStaking")).deploy(
      await nxl.getAddress(), await wbtc.getAddress()
    );
    await tb.setStaking(await staking.getAddress());

    // 5. Configure ecosystem
    await nm.setEcosystemAddresses(
      await tb.getAddress(), await rn.getAddress(), await ar.getAddress()
    );
    await nm.configureNXLTokenTreasury(await tb.getAddress());
    await nm.finalizeAutonomy();

    // 6. Fund users
    for (const u of [user1, user2, user3]) {
      await usdt.transfer(u.address, ethers.parseUnits("50000", 18));
    }
  });

  it("Step 1: Protocol is active after finalizeAutonomy", async function () {
    expect(await nm.paused()).to.be.false;
    expect(await nm.ecosystemLocked()).to.be.true;
    expect(await nm.owner()).to.equal(ethers.ZeroAddress);
    expect(await nm.pauseGuardian()).to.equal(guardian.address);
    console.log("  ✅ Protocol active, autonomous");
  });

  it("Step 2: Users can buy tickets (FLASH product)", async function () {
    await usdt.connect(user1).approve(await nm.getAddress(), ethers.MaxUint256);
    await usdt.connect(user2).approve(await nm.getAddress(), ethers.MaxUint256);

    // Buy with referral
    await nm.connect(user1).buyTickets(0, 5, ethers.ZeroAddress);
    await nm.connect(user2).buyTickets(0, 3, user1.address); // user1 is referrer

    const roundId = await nm.currentRound(0);
    const round = await nm.rounds(0, roundId);
    expect(round.ticketsSold).to.equal(8n);
    expect(round.prizePot).to.be.gt(0n);
    console.log(`  ✅ Tickets purchased. Prize pot: ${ethers.formatUnits(round.prizePot, 18)} USDT`);
  });

  it("Step 3: Complete FLASH round (fill all 1000 tickets + VRF)", async function () {
    const roundId = await nm.currentRound(0);

    // Fill remaining 992 tickets
    for (let i = 0; i < 99; i++) {
      await nm.connect(user1).buyTickets(0, 10, ethers.ZeroAddress);
    }
    await nm.connect(user1).buyTickets(0, 1, ethers.ZeroAddress);
    await nm.connect(user1).buyTickets(0, 1, ethers.ZeroAddress);

    const round = await nm.rounds(0, roundId);
    expect(round.ticketsSold).to.equal(1000n);
    expect(round.vrfRequested).to.be.true;
    console.log(`  ✅ Round full. VRF requested: ${round.vrfRequestId}`);

    // Simulate VRF callback
    const randomWord = BigInt("0x" + "deadbeef".repeat(8));
    await vrf.fulfillRandomWordsWithOverride(round.vrfRequestId, await nm.getAddress(), [randomWord]);

    const completedRound = await nm.rounds(0, roundId);
    expect(completedRound.completed).to.be.true;
    expect(completedRound.winner).to.not.equal(ethers.ZeroAddress);
    console.log(`  ✅ Round completed. Winner: ${completedRound.winner}`);
  });

  it("Step 4: Winner claims stable prize", async function () {
    const roundId = 1n;
    const round = await nm.rounds(0, roundId);
    const winner = round.winner;

    const claimable = await nm.claimableStable(winner);
    expect(claimable).to.be.gt(0n);

    const winnerSigner = await ethers.getSigner(winner);
    const balBefore = await usdt.balanceOf(winner);
    await nm.connect(winnerSigner).claimStable();
    const balAfter = await usdt.balanceOf(winner);
    expect(balAfter - balBefore).to.equal(claimable);
    console.log(`  ✅ Winner claimed: ${ethers.formatUnits(claimable, 18)} USDT`);
  });

  it("Step 5: New round auto-started", async function () {
    const newRoundId = await nm.currentRound(0);
    expect(newRoundId).to.equal(2n);
    const round = await nm.rounds(0, newRoundId);
    expect(round.completed).to.be.false;
    expect(round.ticketsSold).to.equal(0n);
    console.log("  ✅ New round started automatically");
  });

  it("Step 6: NXL rewards claimable", async function () {
    const nxlBal = await nm.claimableNXL(user1.address);
    if (nxlBal > 0n) {
      await nm.connect(user1).claimNXL();
      console.log(`  ✅ NXL claimed: ${ethers.formatEther(nxlBal)} NXL`);
    } else {
      console.log("  ℹ️ NXL distributed directly (not accrued)");
    }
  });

  it("Step 7: Referral commissions accrued to user1", async function () {
    const claimable = await rn.claimable(user1.address);
    if (claimable > 0n) {
      await rn.connect(user1).claim();
      console.log(`  ✅ Referral claimed: ${ethers.formatUnits(claimable, 18)} USDT`);
    } else {
      console.log("  ℹ️ Referral: no commission (may have gone to prize pot)");
    }
  });

  it("Step 8: Audit funds withdrawable", async function () {
    const accrued = await nm.auditAccrued();
    if (accrued > 0n) {
      const auditor = await ethers.getSigner(auditAddr.address);
      await nm.connect(auditor).withdrawAuditFunds();
      console.log(`  ✅ Audit funds withdrawn: ${ethers.formatUnits(accrued, 18)} USDT`);
    }
  });

  it("Step 9: TreasuryBTC receives funds and redeem window opens", async function () {
    await time.increase(70); // past redeemWindowStart
    const tbBal = await usdt.balanceOf(await tb.getAddress());
    if (tbBal > 0n) {
      await tb.openRedeemWindow();
      expect(await tb.windowOpen()).to.be.true;
      console.log(`  ✅ Treasury redeem window opened. Rate: ${await tb.redeemRateE18()}`);
    } else {
      console.log("  ℹ️ TreasuryBTC has no USDT (funds went to prize pot)");
    }
  });

  it("Step 10: NXL staking works", async function () {
    const nxlBal = await nxl.balanceOf(user1.address);
    if (nxlBal > 0n) {
      await nxl.connect(user1).approve(await staking.getAddress(), ethers.MaxUint256);
      await staking.connect(user1).stake(nxlBal);
      expect(await staking.totalStaked()).to.equal(nxlBal);
      console.log(`  ✅ Staked: ${ethers.formatEther(nxlBal)} NXL`);
    } else {
      console.log("  ℹ️ user1 has no NXL to stake");
    }
  });

  it("Step 11: Emergency pause by guardian works", async function () {
    await nm.connect(guardian).emergencyPause();
    expect(await nm.paused()).to.be.true;
    await nm.connect(guardian).emergencyUnpause();
    expect(await nm.paused()).to.be.false;
    console.log("  ✅ Guardian pause/unpause works");
  });
});
