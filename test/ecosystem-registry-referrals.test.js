const { expect } = require("chai");
const { ethers } = require("hardhat");

function bn(x) { return BigInt(x.toString()); }

describe("NEXALO - Registry + Referrals (M-02, H-03)", function () {
  let owner, founder, partner, fees, ops, audit, buyer, ref1, ref2, ref3, amb1, amb2;

  beforeEach(async () => {
    [owner, founder, partner, fees, ops, audit, buyer, ref1, ref2, ref3, amb1, amb2] = await ethers.getSigners();
  });

  it("M-02: AmbassadorRegistry is NOT DoS'd by blacklist (pull claim isolates failure)", async function () {
    const BlacklistUSDT = await ethers.getContractFactory("BlacklistUSDT");
    const usdt = await BlacklistUSDT.deploy();
    await usdt.waitForDeployment();

    // Fund registry
    await usdt.mint(owner.address, 1_000_000_000); // 1000 USDT (6 decimals)

    const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
    const reg = await AmbassadorRegistry.deploy(await usdt.getAddress());
    await reg.waitForDeployment();

    // Register 2 ambassadors
    await reg.connect(amb1).selfRegister("AMB_ONE");
    await reg.connect(amb2).selfRegister("AMB_TWO");

    // Fund registry with 100 USDT and distribute
    await usdt.connect(owner).transfer(await reg.getAddress(), 100_000_000); // 100 USDT
    await reg.connect(owner).distributeFunds();

    // Blacklist amb1 => only their claim should fail
    await usdt.connect(owner).setBlacklisted(amb1.address, true);

    // amb2 can claim OK
    const p2 = await reg.pendingRewards(amb2.address);
    expect(p2).to.be.gt(0n);
    await expect(reg.connect(amb2).claim()).to.not.be.reverted;

    // amb1 claim reverts (blacklisted recipient)
    const p1 = await reg.pendingRewards(amb1.address);
    expect(p1).to.be.gt(0n);
    await expect(reg.connect(amb1).claim()).to.be.reverted;

    // No global DoS: distribute again still works
    await usdt.connect(owner).transfer(await reg.getAddress(), 50_000_000); // +50 USDT
    await expect(reg.connect(owner).distributeFunds()).to.not.be.reverted;

    // amb2 can claim again
    const p2b = await reg.pendingRewards(amb2.address);
    expect(p2b).to.be.gt(0n);
    await expect(reg.connect(amb2).claim()).to.not.be.reverted;
  });

  it("H-03: Referral leftover is NOT locked in ReferralNetwork (leftover returns to prizePot)", async function () {
    const BlacklistUSDT = await ethers.getContractFactory("BlacklistUSDT");
    const usdt = await BlacklistUSDT.deploy();
    await usdt.waitForDeployment();

    // Buyer has funds
    await usdt.mint(buyer.address, ethers.parseUnits("10000", 6));

    const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
    const refNet = await ReferralNetwork.deploy(await usdt.getAddress());
    await refNet.waitForDeployment();

    const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
    const reg = await AmbassadorRegistry.deploy(await usdt.getAddress());
    await reg.waitForDeployment();

    const TreasuryMock = await ethers.getContractFactory("TreasuryMockNotify");
    const treasury = await TreasuryMock.deploy();
    await treasury.waitForDeployment();

    const NXLTokenMock = await ethers.getContractFactory("NXLTokenMockRewards");
    const nxl = await NXLTokenMock.deploy();
    await nxl.waitForDeployment();

    // ✅ BLINDADO: NO necesitamos VRF mock en este test
    const vrfCoordinatorAddr = owner.address; // cualquier address sirve, porque no se pide VRF

    const keyHash = "0x" + "11".repeat(32);
    const subId = 1;

    const NexumManager = await ethers.getContractFactory("NexumManager");
    const mgr = await NexumManager.deploy(
      vrfCoordinatorAddr,
      subId,
      keyHash,
      await usdt.getAddress(),
      await nxl.getAddress(),
      founder.address,
      partner.address,
      fees.address,
      ops.address,
      audit.address
    );
    await mgr.waitForDeployment();

    // Wire ecosystem
    await mgr.connect(owner).setEcosystemAddresses(
      await treasury.getAddress(),
      await refNet.getAddress(),
      await reg.getAddress()
    );
    await refNet.connect(owner).setNexumManager(await mgr.getAddress());

    // Configure + unpause
    await mgr.connect(owner).configureNXLTokenTreasury(await treasury.getAddress());
    await mgr.connect(owner).finalizeAutonomy();

    // Buy 1 ticket, only level1 referrer exists => only 0.05 USDT goes to ReferralNetwork
    await usdt.connect(buyer).approve(await mgr.getAddress(), 10_000_000);
    await mgr.connect(buyer).buyTickets(0, 1, ref1.address);

    const refBal = await usdt.balanceOf(await refNet.getAddress());
    expect(bn(refBal)).to.equal(50_000n); // 0.05 USDT

    // leftover returns to prizePot (assert minimal, robust)
    const roundId = await mgr.currentRound(0);
    const round = await mgr.rounds(0, roundId);
    expect(bn(round.prizePot)).to.be.gte(50_000n);

    const claimable = await refNet.claimable(ref1.address);
    expect(bn(claimable)).to.equal(50_000n);

    await expect(refNet.connect(ref1).claim()).to.not.be.reverted;

    const refBalAfter = await usdt.balanceOf(await refNet.getAddress());
    expect(bn(refBalAfter)).to.equal(0n);
  });
});
