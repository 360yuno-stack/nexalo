const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("NexumManager BLACKBLOK stress", function () {
  this.timeout(300_000);

  it("llena BLACKBLOK y reporta gas + distribución", async () => {
    const [deployer, founder, partner, fees, ops, audit, guardian, buyer] =
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
    await nxl.setAvailableRewards(ethers.parseUnits("1000000000", 18));

    // 3) Deploy real VRF Mock
    const VRFMock = await ethers.getContractFactory("VRFCoordinatorV2MockLocal");
    const vrf = await VRFMock.deploy(0, 0);
    await vrf.waitForDeployment();
    const txSub = await vrf.createSubscription();
    const receipt = await txSub.wait();
    const subId = receipt.logs[0].args["subId"];
    await vrf.fundSubscription(subId, ethers.parseEther("1"));

    // 4) Mock ecosystem contracts
    const TreasuryMock = await ethers.getContractFactory("TreasuryMock");
    const treasury = await TreasuryMock.deploy();
    const ReferralMock = await ethers.getContractFactory("ReferralMock");
    const referral = await ReferralMock.deploy();
    const MockAmbassador = await ethers.getContractFactory("MockAmbassadorRegistry");
    const ambassador = await MockAmbassador.deploy();

    // 5) Deploy Manager
    const Manager = await ethers.getContractFactory("NexumManager");
    const manager = await Manager.deploy(
      await vrf.getAddress(),
      subId,
      ethers.ZeroHash,
      stableAddr,
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
    console.log("NexumManager local:", managerAddr);

    await vrf.addConsumer(subId, managerAddr);

    // 6) Ecosystem + finalizeAutonomy
    await manager.setEcosystemAddresses(
      await treasury.getAddress(),
      await referral.getAddress(),
      await ambassador.getAddress()
    );
    await manager.configureNXLTokenTreasury(await treasury.getAddress());
    await manager.finalizeAutonomy();
    console.log("Ecosystem configured + autonomy finalized");

    // 7) Fund buyer
    await stable.mint(buyer.address, ethers.parseUnits("10000000", 18));
    await stable.connect(buyer).approve(managerAddr, ethers.MaxUint256);
    console.log("Stable minted + approved");

    // 8) Parámetros de BLACKBLOK (productId = 5)
    const productId = 5n;
    const product = await manager.products(productId);
    const maxTickets = product.maxTickets;
    const priceUsd = product.priceUSDE18;

    console.log("BLACKBLOK maxTickets:", maxTickets.toString());
    console.log("BLACKBLOK priceUSDE18:", priceUsd.toString());

    // 9) Partial stress: buy 100 tickets in batches of 10
    const gasSamples = [];
    const quantity = 10n;
    let ticketsSold = 0n;
    const targetTickets = 100n;

    while (ticketsSold < targetTickets) {
      const tx = await manager.connect(buyer).buyTickets(productId, quantity, ethers.ZeroAddress);
      const rec = await tx.wait();
      gasSamples.push(rec.gasUsed);
      ticketsSold += quantity;
    }

    console.log("Compras realizadas:", gasSamples.length);
    const gasMin = gasSamples.reduce((a, b) => (b < a ? b : a), gasSamples[0]);
    const gasMax = gasSamples.reduce((a, b) => (b > a ? b : a), gasSamples[0]);
    console.log("Gas min por compra (10 tickets):", gasMin.toString());
    console.log("Gas max por compra (10 tickets):", gasMax.toString());

    const roundId = await manager.currentRound(productId);
    const round = await manager.rounds(productId, roundId);

    console.log("=== Estado parcial BLACKBLOK (100 tickets) ===");
    console.log("ticketsSold:", round.ticketsSold.toString());
    console.log("prizePot:", ethers.formatEther(round.prizePot), "USDT");
    console.log("instantPot:", ethers.formatEther(round.instantPot), "USDT");

    // Gas must be < 2M per 10-ticket purchase
    expect(gasMax).to.be.lt(2_000_000n);
    console.log("✅ Gas usage within BSC limits");
  });
});
