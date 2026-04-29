import { ethers } from "hardhat";
import { expect } from "chai";

describe("NexumManager BLACKBLOK stress", function () {
  it("llena BLACKBLOK y reporta gas + distribución", async () => {
    const [deployer, treasuryBTC, referralNet, ambassador, founder, partner, fees, ops, audit] =
      await ethers.getSigners();

    // 1) Mock stable (18 dec)
    const Stable = await ethers.getContractFactory("MockUSDT"); // o un ERC20 simple de test
    const stable = await Stable.deploy();
    await stable.waitForDeployment();

    // 2) Mock NXL con rewards infinitos
    const MockNxl = await ethers.getContractFactory("MockNXLToken");
    const nxl = await MockNxl.deploy();
    await nxl.waitForDeployment();
    await nxl.setAvailableRewards(ethers.parseUnits("1000000000", 18)); // 1e9 NXL

    // 3) Deploy Manager
    const Manager = await ethers.getContractFactory("NexumManager");
    const manager = await Manager.deploy(
      "0x0000000000000000000000000000000000000000", // VRF mock en local
      1n,
      ethers.ZeroHash,
      await stable.getAddress(),
      await nxl.getAddress(),
      founder.address,
      partner.address,
      fees.address,
      ops.address,
      audit.address
    );
    await manager.waitForDeployment();

    // 4) Ecosistema + unpause
    await manager.setEcosystemAddresses(
      treasuryBTC.address,
      referralNet.address,
      ambassador.address
    );
    await manager.emergencyUnpause();

    // 5) Fondos al usuario y approve
    await stable.mint(deployer.address, ethers.parseUnits("100000000", 18)); // 100M
    await stable.approve(await manager.getAddress(), ethers.parseUnits("100000000", 18));

    // 6) Parámetros de BLACKBLOK
    const productId = 5;
    const product = await manager.products(productId);
    const maxTickets = product.maxTickets;     // 10000
    const priceUsd = product.priceUSDE18;      // 200

    console.log("BLACKBLOK maxTickets:", maxTickets.toString());
    console.log("BLACKBLOK priceUSDE18:", priceUsd.toString());

    // 7) Llenar BLACKBLOK con compras de 10 tickets (hasta 10000)
    const quantity = 10n;
    let ticketsSold = 0n;
    const gasSamples: bigint[] = [];

    while (ticketsSold < maxTickets) {
      const remaining = maxTickets - ticketsSold;
      const qty = remaining >= quantity ? quantity : remaining;

      const tx = await manager.buyTickets(productId, qty, ethers.ZeroAddress, {
        gasLimit: 20_000_000n,
      });
      const receipt = await tx.wait();
      gasSamples.push(receipt.gasUsed);

      ticketsSold += qty;
    }

    console.log("Compras realizadas:", gasSamples.length);
    console.log("Gas min:", gasSamples.reduce((a, b) => (b < a ? b : a)));
    console.log("Gas max:", gasSamples.reduce((a, b) => (b > a ? b : a)));

    // 8) Estado final de la ronda
    const roundId = await manager.currentRound(productId);
    const round = await manager.rounds(productId, roundId);

    console.log("ticketsSold:", round.ticketsSold.toString());
    console.log("prizePot:", round.prizePot.toString());
    console.log("instantPot:", round.instantPot.toString());

    // 9) Distribución total esperada de fondos
    const totalTickets = maxTickets;
    const usdPerTicket = priceUsd; // en 1e18
    const usdTotal = totalTickets * usdPerTicket;

    // Pcts en basis points
    const PCT_PRIZE_POOL   = 5000n;
    const PCT_FOUNDER      = 1000n;
    const PCT_TREASURY_BTC = 1000n;
    const PCT_INSTANT      = 1000n;
    const PCT_REFERRALS    = 1000n;
    const PCT_AMBASSADORS  = 500n;
    const PCT_FEES         = 200n;
    const PCT_OPS_SERVICE  = 100n;
    const PCT_AUDIT        = 100n;
    const PCT_PARTNER      = 100n;

    const div = 10_000n;

    const prizePoolTotal   = (usdTotal * PCT_PRIZE_POOL)   / div;
    const instantTotal     = (usdTotal * PCT_INSTANT)      / div;
    const founderTotal     = (usdTotal * PCT_FOUNDER)      / div;
    const treasuryTotal    = (usdTotal * PCT_TREASURY_BTC) / div;
    const referralsTotal   = (usdTotal * PCT_REFERRALS)    / div;
    const ambassadorsTotal = (usdTotal * PCT_AMBASSADORS)  / div;
    const feesTotal        = (usdTotal * PCT_FEES)         / div;
    const opsTotal         = (usdTotal * PCT_OPS_SERVICE)  / div;
    const auditTotal       = (usdTotal * PCT_AUDIT)        / div;
    const partnerTotal     = (usdTotal * PCT_PARTNER)      / div;

    console.log("=== Distribución teórica BLACKBLOK (en 1e18) ===");
    console.log("Total recaudado USD*1e18:", usdTotal.toString());
    console.log("PrizePool (50%):", prizePoolTotal.toString());
    console.log("Instant rewards (10%):", instantTotal.toString());
    console.log("Founder (10%):", founderTotal.toString());
    console.log("Treasury BTC (10%):", treasuryTotal.toString());
    console.log("Referrals (10%):", referralsTotal.toString());
    console.log("Ambassadors (5%):", ambassadorsTotal.toString());
    console.log("Fees (2%):", feesTotal.toString());
    console.log("Ops (1%):", opsTotal.toString());
    console.log("Audit (1%):", auditTotal.toString());
    console.log("Partner (1%):", partnerTotal.toString());

    // checks básicos
    expect(round.ticketsSold).to.equal(maxTickets);
    expect(round.prizePot).to.equal(prizePoolTotal + treasuryTotal + ambassadorsTotal + referralsTotal - instantTotal /* segun tu lógica exacta */);
  });
});
