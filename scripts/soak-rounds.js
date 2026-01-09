const hre = require("hardhat");
const { ethers } = hre;

async function mine(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

async function main() {
  const args = process.argv.slice(2);
  const roundsArg = args.find(a => a.startsWith("--rounds="));
  const rounds = roundsArg ? Number(roundsArg.split("=")[1]) : 100;

  const PRODUCT_ID = 0;
  const KEYHASH =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";

  const [deployer, founder, partner, fees, ops, audit, ...users] =
    await ethers.getSigners();

  const oneUSDT = ethers.parseUnits("1", 18);

  const MockERC20 = await ethers.getContractFactory(
    "contracts/mocks/MockERC20.sol:MockERC20"
  );
  const usdt = await MockERC20.deploy("Mock USDT", "USDT", 18);
  await usdt.waitForDeployment();

  const wbtc = await MockERC20.deploy("Mock WBTC", "WBTC", 8);
  await wbtc.waitForDeployment();

  // mint lots
  for (const u of users) {
    await (await usdt.mint(u.address, oneUSDT * 2_000_000n)).wait();
  }

  const NXLToken = await ethers.getContractFactory("NXLToken");
  const nxl = await NXLToken.deploy(founder.address, partner.address);
  await nxl.waitForDeployment();

  const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
  const referral = await ReferralNetwork.deploy(await usdt.getAddress());
  await referral.waitForDeployment();

  const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
  const ambassadors = await AmbassadorRegistry.deploy(await usdt.getAddress());
  await ambassadors.waitForDeployment();

  const VRFMock = await ethers.getContractFactory(
    "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol:VRFCoordinatorV2Mock"
  );
  const vrf = await VRFMock.deploy(ethers.parseEther("0.1"), 1_000_000_000);
  await vrf.waitForDeployment();

  const rc = await (await vrf.createSubscription()).wait();
  let subId;
  for (const log of rc.logs) {
    try {
      const parsed = vrf.interface.parseLog(log);
      if (parsed?.name === "SubscriptionCreated") {
        subId = parsed.args.subId;
        break;
      }
    } catch {}
  }
  if (subId === undefined) throw new Error("No subId");
  await (await vrf.fundSubscription(subId, ethers.parseEther("10"))).wait();

  const NexumManager = await ethers.getContractFactory("NexumManager");
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
    audit.address
  );
  await manager.waitForDeployment();

  const managerAddr = await manager.getAddress();
  await (await vrf.addConsumer(subId, managerAddr)).wait();

  await (await nxl.setNexumManager(managerAddr)).wait();
  await (await referral.setNexumManager(managerAddr)).wait();

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

  if (manager.configureNXLTokenTreasury) {
    await (await manager.configureNXLTokenTreasury(await treasury.getAddress())).wait();
  }

  if (manager.finalizeAutonomy) {
    await (await manager.finalizeAutonomy()).wait();
  }

  for (const u of users) {
    await (await usdt.connect(u).approve(managerAddr, oneUSDT * 1_500_000n)).wait();
  }

  const qtys = [10, 5, 3, 1];

  const product = await manager.products(PRODUCT_ID);
  const maxTickets = product.maxTickets;

  for (let r = 1; r <= rounds; r++) {
    const roundId = await manager.currentRound(PRODUCT_ID);
    let sold = (await manager.rounds(PRODUCT_ID, roundId)).ticketsSold;

    let idx = 0;
    while (sold < maxTickets) {
      const rem = maxTickets - sold;
      const q = qtys[idx % qtys.length];
      const qty = rem >= BigInt(q) ? q : 1;
      const buyer = users[idx % users.length];

      await (await manager.connect(buyer).buyTickets(PRODUCT_ID, qty, ethers.ZeroAddress)).wait();
      sold = (await manager.rounds(PRODUCT_ID, roundId)).ticketsSold;
      idx++;
    }

    // resolve stuck
    await mine(8 * 24 * 3600);
    await (await manager.resolveStuckRound(PRODUCT_ID, roundId)).wait();

    if (r % 10 === 0) {
      console.log(`✅ Completed rounds: ${r}/${rounds}`);
    }
  }

  console.log("✅ SOAK DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
