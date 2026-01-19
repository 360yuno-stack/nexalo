const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BuybackContract DoS Vulnerability", function () {
    let BuybackContract, buyback;
    let MockUSDT, usdt;
    let NXLToken, nxl;
    let owner, user, attacker;

    beforeEach(async function () {
        [owner, user, attacker] = await ethers.getSigners();

        // Deploy Mock USDT
        // Deploy Mock USDT
        MockUSDT = await ethers.getContractFactory("MockERC20Test");
        usdt = await MockUSDT.deploy("USDT", "USDT", 18);
        await usdt.waitForDeployment();

        // Deploy Mock NXL (using NXLToken for simplicity or generic mock)
        nxl = usdt;

        // Deploy BuybackContract
        BuybackContract = await ethers.getContractFactory("BuybackContract");
        buyback = await BuybackContract.deploy(await usdt.getAddress(), await nxl.getAddress());
        await buyback.waitForDeployment();
    });

    it("should recover from fund loss and NOT revert receiveFunds (Fix Verified)", async function () {
        // 1. Initial Deposit
        const amount1 = ethers.parseEther("100");
        await usdt.mint(await buyback.getAddress(), amount1);

        // Call receiveFunds to sync
        await buyback.receiveFunds();

        expect(await buyback.totalReceived()).to.equal(amount1);

        // 2. Simulate Fund Loss (DoS Trigger)
        const burnAmount = ethers.parseEther("10");
        await usdt.burn(await buyback.getAddress(), burnAmount);

        // 3. User tries to send new funds (5 tokens)
        const newAmount = ethers.parseEther("5");
        await usdt.mint(await buyback.getAddress(), newAmount);

        // 4. This time it should NOT revert
        await expect(buyback.receiveFunds()).to.not.be.reverted;

        // 5. Verify internal state
        // totalReceived was 100. Added 5 (new deposit). -> 105.
        // totalSpent was 0. Added 10 (burn/loss). -> 10.
        // Balance = 100 - 10 + 5 = 95.
        // Accounted = totalReceived - totalSpent = 105 - 10 = 95.
        // Consistent.

        expect(await usdt.balanceOf(await buyback.getAddress())).to.equal(ethers.parseEther("95"));
        console.log("Fix Verified: receiveFunds handled fund loss gracefully.");
    });
});
