const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Idle NXL Dilution Vulnerability", function () {
    let NXLToken, nxl;
    let TreasuryBTC, treasury;
    let MockERC20, usdt, wbtc;
    let owner, manager, user, founder, partner;

    beforeEach(async function () {
        [owner, manager, user, founder, partner] = await ethers.getSigners();

        // Deploy Mock Tokens
        MockERC20 = await ethers.getContractFactory("MockERC20Test");
        usdt = await MockERC20.deploy("USDT", "USDT", 18);
        wbtc = await MockERC20.deploy("WBTC", "WBTC", 8);
        await usdt.waitForDeployment();
        await wbtc.waitForDeployment();

        // Deploy NXLToken
        NXLToken = await ethers.getContractFactory("NXLToken");
        nxl = await NXLToken.deploy(founder.address, partner.address);
        await nxl.waitForDeployment();

        // Deploy NXL Manager (simplified setup, just set EOA as manager for NXL)
        await nxl.setNexumManager(manager.address);

        // Deploy TreasuryBTC
        TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
        // Params: stable, nxl, manager, wbtc, redeemStart, redeemDuration
        const redeemStart = (await time.latest()) + 86400;
        treasury = await TreasuryBTC.deploy(
            await usdt.getAddress(),
            await nxl.getAddress(),
            manager.address,
            await wbtc.getAddress(),
            redeemStart,
            7 * 86400 // 7 days
        );
        await treasury.waitForDeployment();

        // Connect Treasury to NXL
        await nxl.connect(manager).setTreasuryBTC(await treasury.getAddress());
    });

    it("should dilute rewards when Treasury holds NXL", async function () {
        // 1. Setup Token Distribution
        // NXL Total Supply: 100,000,000
        // We want:
        // - 1000 NXL to User (Circulating)
        // - 1000 NXL to Treasury (Idle/Non-circulating but currently counted)
        // - Rest remains in NXL contract (Correctly excluded by current logic)

        const amount = ethers.parseEther("1000");

        // Distribute to User
        await nxl.connect(manager).distributeReward(user.address, amount);

        // Distribute to Treasury (simulating buyback accumulation)
        await nxl.connect(manager).distributeReward(await treasury.getAddress(), amount);

        // Verify balances
        expect(await nxl.balanceOf(user.address)).to.equal(amount);
        expect(await nxl.balanceOf(await treasury.getAddress())).to.equal(amount);

        // 2. Fund Treasury with WBTC rewards
        const rewardAmount = ethers.parseUnits("1", 8); // 1 WBTC
        await wbtc.mint(await treasury.getAddress(), rewardAmount);

        // 3. Trigger Snapshot and Allocation
        // Only owner can call snapshotAndAllocateHolderRewards
        await treasury.connect(owner).snapshotAndAllocateHolderRewards(rewardAmount);

        // 4. Check User Rewards
        // Snapshot ID should be 1
        const snapshotId = 1;
        const pending = await treasury.pendingHolderRewards(snapshotId, user.address);

        // Calculation:
        // Total Supply: 100M
        // Held by NXL: 100M - 2000
        // Held by Treasury: 1000
        // Held by User: 1000

        // Current Logic (Vulnerable):
        // Circulating = Total - HeldByNXL = 2000.
        // Treasury's 1000 is counted as calculating.
        // User share = 1000 / 2000 = 50%.
        // Expected Reward = 1 WBTC * 50% = 0.5 WBTC.

        // Correct Logic (Fix):
        // Circulating = Total - HeldByNXL - HeldByTreasury = 1000.
        // User share = 1000 / 1000 = 100%.
        // Expected Reward = 1 WBTC * 100% = 1 WBTC.

        console.log("Pending Reward:", ethers.formatUnits(pending, 8));

        // If we fixed it, we would expect 1.0 WBTC.
        const expectedDiluted = ethers.parseUnits("1.0", 8);
        expect(pending).to.equal(expectedDiluted);

        console.log("Fix verified: User received 100% share (1.0 WBTC)");
    });
});
