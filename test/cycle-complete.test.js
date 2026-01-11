const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Audit test: VRF gating (no full round)", function () {
  const PRODUCT_ID = 1n;

  let deployer, founder, partner, user1, user2;
  let usdt, nxl, referralNetwork, ambassadorRegistry, vrf, nexumManager, treasuryBTC;

  before(async function () {
    [deployer, founder, partner, user1, user2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    usdt = await MockERC20.deploy("Test USDT", "USDT", 18);
    await usdt.waitForDeployment();
    await usdt.mint(deployer.address, ethers.parseEther("10000000"));

    const NXLToken = await ethers.getContractFactory("NXLToken");
    nxl = await NXLToken.deploy(founder.address, partner.address);
    await nxl.waitForDeployment();

    const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
    referralNetwork = await ReferralNetwork.deploy(await usdt.getAddress());
    await referralNetwork.waitForDeployment();

    const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
    ambassadorRegistry = await AmbassadorRegistry.deploy(await usdt.getAddress());
    await ambassadorRegistry.waitForDeployment();

    const VRFCoordinatorStub = await ethers.getContractFactory("VRFCoordinatorStub");
    vrf = await VRFCoordinatorStub.deploy();
    await vrf.waitForDeployment();

    const NexumManager = await ethers.getContractFactory("NexumManager");
    nexumManager = await NexumManager.deploy(
      await vrf.getAddress(),
      1,
      "0x" + "00".repeat(32),
      await usdt.getAddress(),
      await nxl.getAddress(),
      founder.address,
      partner.address,
      deployer.address,
      deployer.address,
      deployer.address
    );
    await nexumManager.waitForDeployment();

    const wbtc = await MockERC20.deploy("Wrapped BTC", "WBTC", 8);
    await wbtc.waitForDeployment();

    const TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
    treasuryBTC = await TreasuryBTC.deploy(
      await usdt.getAddress(),
      await nxl.getAddress(),
      await nexumManager.getAddress(),
      await wbtc.getAddress(),
      0,
      30 * 24 * 60 * 60
    );
    await treasuryBTC.waitForDeployment();

    await nxl.setNexumManager(await nexumManager.getAddress());
    await referralNetwork.setNexumManager(await nexumManager.getAddress());

    await nexumManager.setEcosystemAddresses(
      await treasuryBTC.getAddress(),
      await referralNetwork.getAddress(),
      await ambassadorRegistry.getAddress()
    );

    await nexumManager.configureNXLTokenTreasury(await treasuryBTC.getAddress());
    await nexumManager.finalizeAutonomy();

    await usdt.transfer(user1.address, ethers.parseEther("100000"));
    await usdt.transfer(user2.address, ethers.parseEther("100000"));
    await usdt.connect(user1).approve(await nexumManager.getAddress(), ethers.parseEther("100000"));
    await usdt.connect(user2).approve(await nexumManager.getAddress(), ethers.parseEther("100000"));
  });

  it("Buys tickets; VRF is NOT requested until round is full (maxTickets=10000)", async function () {
    const prod = await nexumManager.products(PRODUCT_ID);

    // Tu config real:
    expect(prod.maxTickets).to.equal(10000n);

    const roundId = await nexumManager.currentRound(PRODUCT_ID);

    // Compras válidas (no completan 10000)
    await nexumManager.connect(user1).buyTickets(PRODUCT_ID, 3, ethers.ZeroAddress);
    await nexumManager.connect(user2).buyTickets(PRODUCT_ID, 5, ethers.ZeroAddress);
    await nexumManager.connect(user1).buyTickets(PRODUCT_ID, 1, ethers.ZeroAddress);
    await nexumManager.connect(user1).buyTickets(PRODUCT_ID, 1, ethers.ZeroAddress);

    // Leer round struct: indices según tu struct Round
    const r = await nexumManager.rounds(PRODUCT_ID, roundId);

    // 0 productId, 1 roundId, 2 ticketsSold, 3 nextTicketCursor, 4 completed,
    // 5 vrfRequested, 6 vrfRequestId, 7 vrfRandomWord, 8 winner, 9 winningTicket, 10 prizePot, 11 instantPot
    expect(r[2]).to.equal(10n);      // ticketsSold
    expect(r[4]).to.equal(false);    // completed
    expect(r[5]).to.equal(false);    // vrfRequested
    expect(r[6]).to.equal(0n);       // vrfRequestId

    const t = await nexumManager.roundVRFRequestTime(PRODUCT_ID, roundId);
    expect(t).to.equal(0n);

    // coordinator stub no fue llamado
    expect(await vrf.lastRequestId()).to.equal(0n);
  });
});
