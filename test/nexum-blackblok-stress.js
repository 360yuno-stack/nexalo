const { ethers } = require("hardhat");

describe("NexumManager BLACKBLOK stress", function () {
  it("llena BLACKBLOK y reporta gas + distribución", async () => {
    const [deployer, treasuryBTC, referralNet, ambassador, founder, partner, fees, ops, audit] =
      await ethers.getSigners();

    console.log("Deployer local:", deployer.address);

    // 1) Mock stable ERC20 (18 dec)
    const Stable = await ethers.getContractFactory("contracts/TestUSDT.sol:TestUSDT");
    const stable = await Stable.deploy();
    await stable.waitForDeployment();
    const stableAddr = await stable.getAddress();
    console.log("MockUSDT:", stableAddr);

    // 2) Mock NXL con rewards grandes
    const MockNxl = await ethers.getContractFactory("MockNXLToken");
    const nxl = await MockNxl.deploy();
    await nxl.waitForDeployment();
    const nxlAddr = await nxl.getAddress();
    console.log("MockNXLToken:", nxlAddr);

    await nxl.setAvailableRewards(ethers.parseUnits("1000000000", 18)); // 1e9 NXL

    // 3) Deploy Manager (VRF dummy en local)
    const Manager = await ethers.getContractFactory("NexumManager");
const manager = await Manager.deploy(
  deployer.address,     // vrfCoordinator dummy válido
  1n,                   // subscriptionId dummy
  ethers.ZeroHash,      // keyHash dummy
  stableAddr,
  nxlAddr,
  founder.address,
  partner.address,
  fees.address,
  ops.address,
  audit.address
);
    await manager.waitForDeployment();
    const managerAddr = await manager.getAddress();
    console.log("NexumManager local:", managerAddr);

    // 4) Ecosistema + unpause
    await (await manager.setEcosystemAddresses(
      treasuryBTC.address,
      referralNet.address,
      ambassador.address
    )).wait();
    console.log("Ecosystem addresses set");

    await (await manager.emergencyUnpause()).wait();
    console.log("Manager unpaused");

    // 5) Fondos al deployer y approve
    await (await stable.mint(deployer.address, ethers.parseUnits("100000000", 18))).wait(); // 100M
    await (await stable.approve(managerAddr, ethers.parseUnits("100000000", 18))).wait();
    console.log("Stable minted + approved");

    // 6) Parámetros de BLACKBLOK
    const productId = 5;
    const product = await manager.products(productId);
    const maxTickets = product.maxTickets;     // 10000
    const priceUsd = product.priceUSDE18;      // 200e18

    console.log("BLACKBLOK maxTickets:", maxTickets.toString());
    console.log("BLACKBLOK priceUSDE18:", priceUsd.toString());

    // 7) Llenar BLACKBLOK con compras de 10 tickets
   const quantity = 3n;          // 3 tickets por compra
let ticketsSold = 0n;

while (ticketsSold < maxTickets) {
  const remaining = maxTickets - ticketsSold;
  const qty = remaining >= quantity ? quantity : remaining;

  const tx = await manager.buyTickets(productId, qty, ethers.ZeroAddress, {
    gasLimit: 15_000_000n,   // < 16_777_216, por debajo del cap
  });
  const receipt = await tx.wait();
  gasSamples.push(receipt.gasUsed);

  ticketsSold += qty;

  if (ticketsSold % 1000n === 0n) {
    console.log(
      `Tickets vendidos: ${ticketsSold.toString()} (última tx gasUsed: ${receipt.gasUsed.toString()})`
    );
  }
}


    console.log("Compras realizadas:", gasSamples.length);
    const gasMin = gasSamples.reduce((a, b) => (b < a ? b : a), gasSamples[0]);
    const gasMax = gasSamples.reduce((a, b) => (b > a ? b : a), gasSamples[0]);
    console.log("Gas min por compra:", gasMin.toString());
    console.log("Gas max por compra:", gasMax.toString());

    // 8) Estado final de la ronda
    const roundId = await manager.currentRound(productId);
    const round = await manager.rounds(productId, roundId);

    console.log("=== Estado final BLACKBLOK ===");
    console.log("roundId:", roundId.toString());
    console.log("ticketsSold:", round.ticketsSold.toString());
    console.log("prizePot:", round.prizePot.toString());
    console.log("instantPot:", round.instantPot.toString());

    // 9) Distribución teórica total (USD*1e18)
    const totalTickets = maxTickets;
    const usdPerTicket = priceUsd;
    const usdTotal = totalTickets * usdPerTicket;

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

    console.log("=== Distribución teórica BLACKBLOK (USD*1e18) ===");
    console.log("Total recaudado:", usdTotal.toString());
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
  });
});
