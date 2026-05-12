const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NEXALO - Ecosystem full cycle (Nexum + Treasury + Referral + Staking)", function () {
  this.timeout(0);

  const PRODUCT_ID = 0; // FLASH (1000 tickets)
  const BUY_QTY = 10;

  async function mine(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  it("Deploys and runs a complete cycle (NO VRF, uses resolveStuckRound)", async function () {
    const [deployer, founder, partner, fees, ops, audit, buyerA, buyerB, buyerC, ref1, ref2, guardian] =
      await ethers.getSigners();

    // 1) Mocks
    const MockERC20 = await ethers.getContractFactory("contracts/mocks/MockERC20.sol:MockERC20");
    const usdt = await MockERC20.deploy("Mock USDT", "USDT", 18);
    await usdt.waitForDeployment();

    const wbtc = await MockERC20.deploy("Mock WBTC", "WBTC", 8);
    await wbtc.waitForDeployment();

    const oneUSDT = ethers.parseUnits("1", 18);

    // Mint USDT
    await (await usdt.mint(buyerA.address, oneUSDT * 300000n)).wait();
    await (await usdt.mint(buyerB.address, oneUSDT * 300000n)).wait();
    await (await usdt.mint(buyerC.address, oneUSDT * 300000n)).wait();
    await (await usdt.mint(ref1.address,  oneUSDT * 300000n)).wait();

    // 2) NXL — deploy with 2 args, then setNexumManager after manager is deployed
    const NXLToken = await ethers.getContractFactory("NXLToken");
    const nxl = await NXLToken.deploy(founder.address, partner.address);
    await nxl.waitForDeployment();

    // 3) Referral + Ambassadors
    const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
    const referral = await ReferralNetwork.deploy(await usdt.getAddress());
    await referral.waitForDeployment();

    const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
    const ambassadors = await AmbassadorRegistry.deploy(await usdt.getAddress());
    await ambassadors.waitForDeployment();

    // 4) VRFCoordinator mock + subscription
    const VRFMock = await ethers.getContractFactory(
      "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol:VRFCoordinatorV2Mock"
    );
    const vrf = await VRFMock.deploy(ethers.parseEther("0.1"), 1_000_000_000);
    await vrf.waitForDeployment();

    const rc = await (await vrf.createSubscription()).wait();

    // robust parse SubscriptionCreated
    let subId;
    for (const log of rc.logs) {
      try {
        const parsed = vrf.interface.parseLog(log);
        if (parsed?.name === "SubscriptionCreated") {
          subId = parsed.args.subId;
          break;
        }
      } catch (e) {}
    }
    if (subId === undefined) throw new Error("No pude leer subId del evento SubscriptionCreated");

    await (await vrf.fundSubscription(subId, ethers.parseEther("10"))).wait();

    // 5) NexumManager
    const NexumManager = await ethers.getContractFactory("NexumManager");
    const KEYHASH = "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";

    const manager = await NexumManager.deploy(
      await vrf.getAddress(),
      subId,
      KEYHASH,
      await usdt.getAddress(),
      await nxl.getAddress(),
      founder.address,
      partner.address,
      fees.address,
      ops.address,
      audit.address,
      guardian.address
    );
    await manager.waitForDeployment();

    const managerAddr = await manager.getAddress();

    // Add consumer to VRF
    await (await vrf.addConsumer(subId, managerAddr)).wait();
    // Set NXL manager (one-time setter)
    await (await nxl.setNexumManager(managerAddr)).wait();
    await (await referral.setNexumManager(managerAddr)).wait();

    // 6) Treasury + set ecosystem (IMPORTANT: Treasury needs WBTC param)
    const TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
    const now = (await ethers.provider.getBlock("latest")).timestamp;

    const treasury = await TreasuryBTC.deploy(
      await usdt.getAddress(),
      await nxl.getAddress(),
      managerAddr,
      await wbtc.getAddress(),
      now,
      2 * 24 * 3600
    );
    await treasury.waitForDeployment();

    await (await manager.setEcosystemAddresses(
      await treasury.getAddress(),
      await referral.getAddress(),
      await ambassadors.getAddress()
    )).wait();

    // IMPORTANT: configure NXL treasury BEFORE autonomy (owner still exists)
    await (await manager.configureNXLTokenTreasury(await treasury.getAddress())).wait();

    // IMPORTANT: approve ambassadors before selfRegister (requires owner approval)
    await (await ambassadors.approveForRegistration(buyerA.address)).wait();
    await (await ambassadors.approveForRegistration(buyerB.address)).wait();
    await (await ambassadors.connect(buyerA).selfRegister("A")).wait();
    await (await ambassadors.connect(buyerB).selfRegister("B")).wait();

    // Now autonomy (renounce ownership)
    await (await manager.finalizeAutonomy()).wait();

    // 7) approvals + referral chain
    await (await usdt.connect(ref1).approve(managerAddr, oneUSDT * 100000n)).wait();
    await (await usdt.connect(buyerA).approve(managerAddr, oneUSDT * 100000n)).wait();
    await (await usdt.connect(buyerB).approve(managerAddr, oneUSDT * 100000n)).wait();
    await (await usdt.connect(buyerC).approve(managerAddr, oneUSDT * 100000n)).wait();

    // referral chain: ref1 -> ref2, buyerA -> ref1
    await (await manager.connect(ref1).buyTickets(PRODUCT_ID, 1, ref2.address)).wait();
    await (await manager.connect(buyerA).buyTickets(PRODUCT_ID, 1, ref1.address)).wait();

    // 8) Fill round to 1000
    const product = await manager.products(PRODUCT_ID);
    expect(product.maxTickets).to.equal(1000n);

    const roundId = await manager.currentRound(PRODUCT_ID);
    let sold = (await manager.rounds(PRODUCT_ID, roundId)).ticketsSold;

    while (sold < 1000n) {
      const remaining = 1000n - sold;
      const qty = remaining >= BigInt(BUY_QTY) ? BUY_QTY : 1;

      const turn = Number((sold / BigInt(BUY_QTY)) % 3n);
      const who = turn === 0 ? buyerA : (turn === 1 ? buyerB : buyerC);

      await (await manager.connect(who).buyTickets(PRODUCT_ID, qty, ethers.ZeroAddress)).wait();
      sold = (await manager.rounds(PRODUCT_ID, roundId)).ticketsSold;
    }

    const rAfterFill = await manager.rounds(PRODUCT_ID, roundId);
    expect(rAfterFill.ticketsSold).to.equal(1000n);
    expect(rAfterFill.vrfRequested).to.equal(true);

    // 9) NO VRF fulfill: force stuck resolution
    await mine(8 * 24 * 3600); // > VRF_TIMEOUT (7 days)
    const resolveTx = await manager.resolveStuckRound(PRODUCT_ID, roundId);
    const resolveReceipt = await resolveTx.wait();

    // resolveStuckRound re-issues VRF — find new requestId from event
    let newRequestId;
    for (const log of resolveReceipt.logs) {
      try {
        const parsed = manager.interface.parseLog(log);
        if (parsed?.name === "StuckRoundResolved") { newRequestId = parsed.args[2]; break; }
      } catch (e) {}
    }
    if (!newRequestId) throw new Error("StuckRoundResolved event not found");

    // Fulfill the new VRF to complete the round
    await (await vrf.fulfillRandomWordsWithOverride(newRequestId, managerAddr, [42n])).wait();

    const rDone = await manager.rounds(PRODUCT_ID, roundId);
    expect(rDone.completed).to.equal(true);
    expect(rDone.winner).to.not.equal(ethers.ZeroAddress);

    // 10) Winner claims stable
    const winner = rDone.winner;
    const claim = await manager.claimableStable(winner);
    expect(claim).to.be.gt(0);

    const winnerSigner = await ethers.getSigner(winner);
    const u0 = await usdt.balanceOf(winner);
    await (await manager.connect(winnerSigner).claimStable()).wait();
    const u1 = await usdt.balanceOf(winner);
    expect(u1 - u0).to.equal(claim);

    // 11) Treasury redeem window
    await (await treasury.receiveFunds()).wait();
    const tBal = await usdt.balanceOf(await treasury.getAddress());
    expect(tBal).to.be.gt(0);

    await (await treasury.openRedeemWindow()).wait();
    expect(await treasury.windowOpen()).to.equal(true);

    // 12) Referral claim
    const refClaim = await referral.claimable(ref1.address);
    expect(refClaim).to.be.gt(0);

    const refBal0 = await usdt.balanceOf(ref1.address);
    await (await referral.connect(ref1).claim()).wait();
    const refBal1 = await usdt.balanceOf(ref1.address);
    expect(refBal1).to.be.gt(refBal0);

    // 13) Staking - stake first, then fundRewards
    const NexaloStaking = await ethers.getContractFactory("NexaloStaking");
    const staking = await NexaloStaking.deploy(await nxl.getAddress(), await wbtc.getAddress());
    await staking.waitForDeployment();

    const buyerBNxl = await nxl.balanceOf(buyerB.address);
    if (buyerBNxl > 0n) {
      const stakeAmt = buyerBNxl / 5n;
      if (stakeAmt > 0n) {
        await (await nxl.connect(buyerB).approve(await staking.getAddress(), stakeAmt)).wait();
        await (await staking.connect(buyerB).stake(stakeAmt)).wait();

        await (await wbtc.mint(deployer.address, 100000000n)).wait();
        await (await wbtc.approve(await staking.getAddress(), 50000000n)).wait();
        await (await staking.fundRewards(50000000n)).wait();

        await ethers.provider.send("evm_mine", []);
        await ethers.provider.send("evm_mine", []);

        const pending = await staking.pendingRewards(buyerB.address);
        if (pending > 0n) {
          const wb0 = await wbtc.balanceOf(buyerB.address);
          await (await staking.connect(buyerB).claimRewards()).wait();
          const wb1 = await wbtc.balanceOf(buyerB.address);
          expect(wb1).to.be.gt(wb0);
        }
      }
    }

    // 14) Holders rewards snapshot (TreasuryBTC + NXLToken snapshot-lite)
    // Deposit WBTC into Treasury
    await (await wbtc.mint(deployer.address, 200000000n)).wait(); // 2 WBTC-ish in 8 decimals (depends your mock)
    await (await wbtc.approve(await treasury.getAddress(), 100000000n)).wait();
    await (await treasury.depositWBTC(100000000n)).wait();

    // Create snapshot allocation (owner is deployer on treasury)
    const tx = await treasury.snapshotAndAllocateHolderRewards(50000000n);
    const receipt = await tx.wait();

    // read snapshotId from event
    let snapshotId;
    for (const log of receipt.logs) {
      try {
        const parsed = treasury.interface.parseLog(log);
        if (parsed?.name === "HolderRewardsSnapshotted") {
          snapshotId = parsed.args.snapshotId;
          break;
        }
      } catch (e) {}
    }
    if (snapshotId === undefined) throw new Error("No pude leer snapshotId de HolderRewardsSnapshotted");

    // BuyerA claims (should have NXL)
    const owedA = await treasury.pendingHolderRewards(snapshotId, buyerA.address);
    if (owedA > 0n) {
      const w0 = await wbtc.balanceOf(buyerA.address);
      await (await treasury.connect(buyerA).claimHolderRewards(snapshotId)).wait();
      const w1 = await wbtc.balanceOf(buyerA.address);
      expect(w1).to.be.gt(w0);
    }
  });
});
