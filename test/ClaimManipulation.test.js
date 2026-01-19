const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Issue #8: TreasuryBTC Claim Manipulation", function () {
    let NXLToken, nxl;
    let TreasuryBTC, treasury;
    let MockERC20, usdt, wbtc;
    let owner, manager, user;

    beforeEach(async function () {
        [owner, manager, user] = await ethers.getSigners();

        // Proven setup from IdleNXLDilution.test.js
        MockERC20 = await ethers.getContractFactory("MockERC20Test");
        usdt = await MockERC20.deploy("USDT", "USDT", 18);
        wbtc = await MockERC20.deploy("WBTC", "WBTC", 8);
        await usdt.waitForDeployment();
        await wbtc.waitForDeployment();

        NXLToken = await ethers.getContractFactory("NXLToken");
        nxl = await NXLToken.deploy(owner.address, owner.address); // Adjusted if necessary
        await nxl.waitForDeployment();

        // NXL Setup
        await nxl.setNexumManager(manager.address);

        TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
        const redeemStart = (await time.latest()) + 86400;
        treasury = await TreasuryBTC.deploy(
            await usdt.getAddress(),
            await nxl.getAddress(),
            manager.address,
            await wbtc.getAddress(),
            redeemStart,
            7 * 86400
        );
        await treasury.waitForDeployment();

        await nxl.connect(manager).setTreasuryBTC(await treasury.getAddress());

        // 4. Setup Initial State for Issue 8
        // Distribute NXL to User
        const nxlAmount = ethers.parseEther("1000");
        await nxl.connect(manager).distributeReward(user.address, nxlAmount);

        // Fund Treasury with WBTC
        const wbtcAmount = ethers.parseUnits("10", 8);
        await wbtc.mint(await treasury.getAddress(), wbtcAmount);

        // Create Snapshot & Allocate
        // This reserves 10 WBTC.
        await treasury.snapshotAndAllocateHolderRewards(wbtcAmount);
    });

    it("should REVERT when balance is insufficient (Fix Verified)", async function () {
        const snapshotId = 1;

        // ATTACK: Simulate manipulation of balance (Burn/Loss).
        await wbtc.burn(await treasury.getAddress(), ethers.parseUnits("10", 8));
        expect(await wbtc.balanceOf(await treasury.getAddress())).to.equal(0);

        // Action: User Claims
        // Expect Revert due to fix
        await expect(treasury.connect(user).claimHolderRewards(snapshotId))
            .to.be.revertedWith("Insufficient Treasury Balance");

        console.log("Fix Verified: Transaction reverted when safe liquidity was missing.");
    });
});
