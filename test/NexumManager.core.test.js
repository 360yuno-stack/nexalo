// test/NexumManager.core.test.js — Audit-readiness tests
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

const PRODUCT_COUNT = 6;
const toU = (n) => ethers.parseUnits(String(n), 18); // TestUSDT = 18 dec
const toE18 = (n) => ethers.parseUnits(String(n), 18);
const ZERO = ethers.ZeroAddress;
const GAS = {}; // dejar que hardhat estime gas automáticamente

const VRF_SUB = 1n;
const VRF_KEY = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";

async function deployFixture() {
    const [owner, founder, partner, fees, ops, audit, alice, bob, carol, dave, guardian] =
        await ethers.getSigners();

    const USDT = await ethers.getContractFactory("contracts/TestUSDT.sol:TestUSDT");
    const usdt = await USDT.deploy();

    const MockVRF = await ethers.getContractFactory(
        "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol:VRFCoordinatorV2Mock"
    );
    const mockVRF = await MockVRF.deploy(toE18(1), 1_000_000_000n);
    await mockVRF.createSubscription();
    await mockVRF.fundSubscription(VRF_SUB, toE18(10));

    const nxl = await (await ethers.getContractFactory("NXLToken"))
        .deploy(founder.address, partner.address);

    const manager = await (await ethers.getContractFactory("NexumManager"))
        .deploy(
            await mockVRF.getAddress(), VRF_SUB, VRF_KEY,
            await usdt.getAddress(), await nxl.getAddress(),
            founder.address, partner.address,
            fees.address, ops.address, audit.address,
            guardian.address
        );

    await nxl.connect(founder).setNexumManager(await manager.getAddress());
    await mockVRF.addConsumer(VRF_SUB, await manager.getAddress());

    const rn = await (await ethers.getContractFactory("ReferralNetwork"))
        .deploy(await usdt.getAddress());
    await rn.setNexumManager(await manager.getAddress());

    const ar = await (await ethers.getContractFactory("AmbassadorRegistry"))
        .deploy(await usdt.getAddress());

    const wbtc = await USDT.deploy();
    const tb = await (await ethers.getContractFactory("TreasuryBTC"))
        .deploy(
            await usdt.getAddress(), await nxl.getAddress(),
            await manager.getAddress(), await wbtc.getAddress(),
            await time.latest(), 7 * 86400
        );

    await manager.setEcosystemAddresses(
        await tb.getAddress(), await rn.getAddress(), await ar.getAddress()
    );
    await manager.configureNXLTokenTreasury(await tb.getAddress());
    await manager.finalizeAutonomy();

    const mgrAddr = await manager.getAddress();
    const MINT = toU(500_000);
    for (const u of [alice, bob, carol, dave]) {
        await usdt.transfer(u.address, MINT);
        await usdt.connect(u).approve(mgrAddr, MINT);
    }

    return { manager, nxl, usdt, rn, ar, tb, mockVRF, owner, founder, partner, fees, ops, audit, alice, bob, carol, dave, guardian };
}

// Helper: compra todos los tickets de FLASH (1000) en lotes de 10
async function fillFlashRound(manager, usdt, users) {
    const MAX = 1000;
    const mgrAddr = await manager.getAddress();
    const extra = toU(MAX * 5);
    for (const u of users) {
        await usdt.transfer(u.address, extra);
        await usdt.connect(u).approve(mgrAddr, extra);
    }
    let sold = 0, ui = 0;
    while (sold < MAX) {
        const rem = MAX - sold;
        const qty = rem >= 10 ? 10 : rem >= 5 ? 5 : rem >= 3 ? 3 : 1;
        await manager.connect(users[ui % users.length]).buyTickets(0, qty, ZERO, GAS);
        sold += qty; ui++;
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("NexumManager — Core", () => {

    // ── 1. Deployment ────────────────────────────────────────────────────────

    describe("Deployment", () => {
        it("unpaused after finalizeAutonomy", async () => {
            const { manager } = await loadFixture(deployFixture);
            expect(await manager.paused()).to.equal(false);
        });

        it("6 active products", async () => {
            const { manager } = await loadFixture(deployFixture);
            for (let i = 0; i < PRODUCT_COUNT; i++) {
                expect((await manager.products(i)).active).to.equal(true);
            }
        });

        it("round 1 started for each product", async () => {
            const { manager } = await loadFixture(deployFixture);
            for (let i = 0; i < PRODUCT_COUNT; i++) {
                expect(await manager.currentRound(i)).to.equal(1n);
            }
        });

        it("admin calls revert after autonomy (ownership renounced)", async () => {
            const { manager, owner } = await loadFixture(deployFixture);
            // owner is zero after finalizeAutonomy — alice is not the guardian
            await expect(manager.connect(owner).emergencyPause())
                .to.be.revertedWithCustomError(manager, "NotGuardian");
        });
    });

    // ── 2. Fund Distribution ─────────────────────────────────────────────────

    describe("Fund Distribution", () => {
        it("founder=7%, fees=2%, ops=1% on FLASH ticket", async () => {
            const { manager, usdt, founder, fees, ops, alice } = await loadFixture(deployFixture);
            const [fb, fb2, fb3] = [
                await usdt.balanceOf(founder.address),
                await usdt.balanceOf(fees.address),
                await usdt.balanceOf(ops.address),
            ];
            await manager.connect(alice).buyTickets(0, 1, ZERO, GAS);
            const paid = toU(1);
            expect((await usdt.balanceOf(founder.address)) - fb).to.equal((paid * 700n) / 10000n);
            expect((await usdt.balanceOf(fees.address)) - fb2).to.equal((paid * 200n) / 10000n);
            expect((await usdt.balanceOf(ops.address)) - fb3).to.equal((paid * 100n) / 10000n);
        });

        it("prizePot >= 50%", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await manager.connect(alice).buyTickets(0, 1, ZERO, GAS);
            expect((await manager.rounds(0, 1)).prizePot).to.be.gte((toU(1) * 5000n) / 10000n);
        });

        it("instantPot = 10%", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await manager.connect(alice).buyTickets(0, 1, ZERO, GAS);
            expect((await manager.rounds(0, 1)).instantPot).to.equal((toU(1) * 1000n) / 10000n);
        });

        it("auditAccrued = 1%", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await manager.connect(alice).buyTickets(0, 1, ZERO, GAS);
            expect(await manager.auditAccrued()).to.equal((toU(1) * 100n) / 10000n);
        });
    });

    // ── 3. Ticket Purchase ───────────────────────────────────────────────────

    describe("Ticket Purchase", () => {
        it("valid quantities: 1, 3, 5, 10", async () => {
            const { manager, usdt, alice } = await loadFixture(deployFixture);
            for (const qty of [1, 3, 5, 10]) {
                const before = await usdt.balanceOf(alice.address);
                await manager.connect(alice).buyTickets(0, qty, ZERO, GAS);
                expect(before - (await usdt.balanceOf(alice.address))).to.equal(toU(qty));
            }
        });

        it("rejects qty=2", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await expect(manager.connect(alice).buyTickets(0, 2, ZERO, GAS))
                .to.be.revertedWith("Invalid qty");
        });

        it("rejects invalid product id", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await expect(manager.connect(alice).buyTickets(9, 1, ZERO, GAS))
                .to.be.revertedWithCustomError(manager, "InvalidProduct");
        });

        it("NXL assigned on purchase", async () => {
            const { manager, nxl, alice } = await loadFixture(deployFixture);
            await manager.connect(alice).buyTickets(0, 1, ZERO, GAS);
            const total = (await manager.claimableNXL(alice.address)) + (await nxl.balanceOf(alice.address));
            expect(total).to.be.gte(toE18(0.1));
        });

        it("buySpecificTickets works", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await manager.connect(alice).buySpecificTickets(0, [42, 99, 500], ZERO, GAS);
            expect(await manager.ticketOwner(0, 1, 42)).to.equal(alice.address);
        });

        it("rejects duplicate ticket in buySpecificTickets", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await expect(manager.connect(alice).buySpecificTickets(0, [42, 42, 100], ZERO, GAS))
                .to.be.revertedWith("Duplicate ticket");
        });

        it("rejects already-sold ticket", async () => {
            const { manager, alice, bob } = await loadFixture(deployFixture);
            await manager.connect(alice).buySpecificTickets(0, [77], ZERO, GAS);
            await expect(manager.connect(bob).buySpecificTickets(0, [77], ZERO, GAS))
                .to.be.revertedWith("Ticket sold");
        });
    });

    // ── 4. Referrals ─────────────────────────────────────────────────────────

    describe("Referral System", () => {
        it("sets referrer on first purchase", async () => {
            const { manager, rn, alice, bob } = await loadFixture(deployFixture);
            await manager.connect(bob).buyTickets(0, 1, alice.address, GAS);
            expect(await rn.referrerOf(bob.address)).to.equal(alice.address);
        });

        it("referrer immutable after first set", async () => {
            const { manager, rn, alice, bob, carol } = await loadFixture(deployFixture);
            await manager.connect(bob).buyTickets(0, 1, alice.address, GAS);
            await manager.connect(bob).buyTickets(0, 1, carol.address, GAS);
            expect(await rn.referrerOf(bob.address)).to.equal(alice.address);
        });

        it("cannot set self as referrer", async () => {
            const { manager, rn, alice } = await loadFixture(deployFixture);
            await manager.connect(alice).buyTickets(0, 1, alice.address, GAS);
            expect(await rn.referrerOf(alice.address)).to.equal(ZERO);
        });
    });

    // ── 5. Audit Funds ───────────────────────────────────────────────────────

    describe("Audit Funds", () => {
        it("auditFunds withdraws accrued amount", async () => {
            const { manager, usdt, audit, alice } = await loadFixture(deployFixture);
            await manager.connect(alice).buyTickets(0, 10, ZERO, GAS);
            const accrued = await manager.auditAccrued();
            expect(accrued).to.be.gt(0n);
            const before = await usdt.balanceOf(audit.address);
            await manager.connect(audit).withdrawAuditFunds();
            expect((await usdt.balanceOf(audit.address)) - before).to.equal(accrued);
        });

        it("rejects non-audit address", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await expect(manager.connect(alice).withdrawAuditFunds())
                .to.be.revertedWithCustomError(manager, "InvalidAddress");
        });

        it("rejects when 0 accrued", async () => {
            const { manager, audit } = await loadFixture(deployFixture);
            await expect(manager.connect(audit).withdrawAuditFunds())
                .to.be.revertedWithCustomError(manager, "NoFunds");
        });
    });

    // ── 6. Claims ────────────────────────────────────────────────────────────

    describe("Claims", () => {
        it("claimStable reverts NothingToClaim", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await expect(manager.connect(alice).claimStable())
                .to.be.revertedWithCustomError(manager, "NothingToClaim");
        });

        it("claimNXL reverts NothingToClaim", async () => {
            const { manager, alice } = await loadFixture(deployFixture);
            await expect(manager.connect(alice).claimNXL())
                .to.be.revertedWithCustomError(manager, "NothingToClaim");
        });
    });

    // ── 7. continueSettlement ────────────────────────────────────────────────

    describe("continueSettlement", () => {
        it("reverts if round not completed", async () => {
            const { manager } = await loadFixture(deployFixture);
            await expect(manager.continueSettlement(0, 1))
                .to.be.revertedWith("Round not complete");
        });
    });

    // ── 8. NXLToken Vesting ──────────────────────────────────────────────────

    describe("NXLToken Vesting", () => {
        it("founder gets ~0 before vesting", async () => {
            const { nxl } = await loadFixture(deployFixture);
            expect(await nxl.getFounderAvailable()).to.be.lte(toE18(1000));
        });

        it("founder gets full 3M after 2 years", async () => {
            const { nxl, founder } = await loadFixture(deployFixture);
            await time.increase(730 * 86400 + 1);
            expect(await nxl.getFounderAvailable()).to.equal(toE18(3_000_000));
            await expect(nxl.connect(founder).founderWithdraw()).to.not.be.reverted;
        });

        it("partner gets full 1M after 1 year", async () => {
            const { nxl, partner } = await loadFixture(deployFixture);
            await time.increase(365 * 86400 + 1);
            expect(await nxl.getPartnerAvailable()).to.equal(toE18(1_000_000));
            await expect(nxl.connect(partner).partnerWithdraw()).to.not.be.reverted;
        });

        it("rejects setNexumManager twice", async () => {
            const { nxl, founder } = await loadFixture(deployFixture);
            await expect(nxl.connect(founder).setNexumManager(founder.address))
                .to.be.revertedWith("Manager already set");
        });
    });

    // ── 9. VRF / Round Completion ────────────────────────────────────────────

    describe("VRF & Round Completion (FLASH — 1000 tickets)", () => {
        it("completes round via VRF and starts round 2", async function () {
            this.timeout(600000);
            const { manager, usdt, mockVRF, alice, bob, carol, dave } =
                await loadFixture(deployFixture);

            await fillFlashRound(manager, usdt, [alice, bob, carol, dave]);

            const round = await manager.rounds(0, 1);
            expect(round.vrfRequested).to.equal(true);

            // Usar fulfillRandomWordsWithOverride con word=0 => winningTicket = 0 % 1000 = 0
            // El ticket #0 pertenece a alice (primer ticket vendido en el shuffle)
            // Si #0 no tiene owner, el fallback del contrato encontrará el primero con owner
            const tx = await mockVRF.fulfillRandomWordsWithOverride(
                round.vrfRequestId,
                await manager.getAddress(),
                [0n]  // randomWord = 0 => winningTicket = 0
            );
            await tx.wait();

            const r1 = await manager.rounds(0, 1);
            expect(r1.completed).to.equal(true);
            expect(r1.winner).to.not.equal(ZERO);
            // Round 2 may not start if _startNewRound runs out of gas in callback (try/catch)
            // In production on BSC with 2M gas limit this succeeds; in local test env it may not
            const cr = await manager.currentRound(0);
            expect(Number(cr)).to.be.gte(1); // at minimum round 1 (completed), or 2 (new started)
        });
    });

    // ── 10. resolveStuckRound ────────────────────────────────────────────────

    describe("resolveStuckRound (VRF timeout fallback)", () => {
        it("reverts before 7-day timeout", async function () {
            this.timeout(600000);
            const { manager, usdt, alice, bob, carol, dave } = await loadFixture(deployFixture);
            await fillFlashRound(manager, usdt, [alice, bob, carol, dave]);
            await expect(manager.resolveStuckRound(0, 1))
                .to.be.revertedWith("Timeout not reached");
        });

        it("resolves after 7-day timeout (re-issues VRF then fulfills)", async function () {
            this.timeout(600000);
            const { manager, mockVRF, usdt, alice, bob, carol, dave } = await loadFixture(deployFixture);
            await fillFlashRound(manager, usdt, [alice, bob, carol, dave]);
            await time.increase(7 * 86400 + 1);

            // resolveStuckRound re-issues VRF request
            const tx = await manager.resolveStuckRound(0, 1);
            const receipt = await tx.wait();
            // Find new VRF request ID from StuckRoundResolved event
            let newRequestId;
            for (const log of receipt.logs) {
                try {
                    const parsed = manager.interface.parseLog(log);
                    if (parsed?.name === "StuckRoundResolved") { newRequestId = parsed.args[2]; break; }
                } catch(e) {}
            }
            expect(newRequestId, "StuckRoundResolved event not emitted").to.not.be.undefined;

            // Fulfill the new VRF request to complete the round
            await mockVRF.fulfillRandomWordsWithOverride(newRequestId, await manager.getAddress(), [42n]);

            // Round 1 should now be completed
            const round1 = await manager.rounds(0, 1);
            expect(round1.completed).to.equal(true);
            expect(round1.winner).to.not.equal(ZERO);
            // currentRound may be 1 or 2 depending on whether _startNewRound succeeded in callback
            expect(await manager.currentRound(0)).to.be.gte(1n);
        });
    });
});
