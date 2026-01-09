const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NEXALO - Auditor Suite (accounting invariants + long fuzz)", function () {
  this.timeout(0);

  const PRODUCT_ID = 0;
  const KEYHASH =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";

  async function mine(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function deployEcosystem() {
    const [deployer, founder, partner, fees, ops, audit, ...users] =
      await ethers.getSigners();

    const oneUSDT = ethers.parseUnits("1", 18);

    // MockERC20 fully qualified
    const MockERC20 = await ethers.getContractFactory(
      "contracts/mocks/MockERC20.sol:MockERC20"
    );

    const usdt = await MockERC20.deploy("Mock USDT", "USDT", 18);
    await usdt.waitForDeployment();

    const wbtc = await MockERC20.deploy("Mock WBTC", "WBTC", 8);
    await wbtc.waitForDeployment();

    // Track minted (auditor invariant)
    let mintedTotal = 0n;

    // fund users
    const perUser = oneUSDT * 800000n;
    for (let i = 0; i < users.length; i++) {
      await (await usdt.mint(users[i].address, perUser)).wait();
      mintedTotal += perUser;
    }

    // NXL
    const NXLToken = await ethers.getContractFactory("NXLToken");
    const nxl = await NXLToken.deploy(founder.address, partner.address);
    await nxl.waitForDeployment();

    // Referral
    const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
    const referral = await ReferralNetwork.deploy(await usdt.getAddress());
    await referral.waitForDeployment();

    // Ambassadors
    const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
    const ambassadors = await AmbassadorRegistry.deploy(await usdt.getAddress());
    await ambassadors.waitForDeployment();

    // VRF mock
    const VRFMock = await ethers.getContractFactory(
      "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol:VRFCoordinatorV2Mock"
    );
    const vrf = await VRFMock.deploy(ethers.parseEther("0.1"), 1_000_000_000);
    await vrf.waitForDeployment();

    // subscription
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
    if (subId === undefined) throw new Error("No pude leer subId");
    await (await vrf.fundSubscription(subId, ethers.parseEther("10"))).wait();

    // Manager
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

    // Wire
    await (await nxl.setNexumManager(managerAddr)).wait();
    await (await referral.setNexumManager(managerAddr)).wait();

    // Treasury
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

    // register a couple ambassadors
    await (await ambassadors.connect(users[0]).selfRegister("A")).wait();
    await (await ambassadors.connect(users[1]).selfRegister("B")).wait();

    if (manager.finalizeAutonomy) {
      await (await manager.finalizeAutonomy()).wait();
    }

    // approvals
    for (let i = 0; i < users.length; i++) {
      await (await usdt.connect(users[i]).approve(managerAddr, oneUSDT * 700000n)).wait();
    }

    return {
      deployer, founder, partner, fees, ops, audit,
      users,
      usdt, wbtc, nxl, referral, ambassadors, vrf,
      manager, treasury, oneUSDT,
      mintedTotal,
    };
  }

  async function sumUSDT(usdt, addrs) {
    let s = 0n;
    for (const a of addrs) {
      s += await usdt.balanceOf(a);
    }
    return s;
  }

  async function assertUSDTAccounting(env) {
    const { usdt, mintedTotal, manager, treasury, referral, ambassadors, founder, partner, fees, ops, audit, users } = env;

    const addrs = [
      await manager.getAddress(),
      await treasury.getAddress(),
      await referral.getAddress(),
      await ambassadors.getAddress(),
      founder.address,
      partner.address,
      fees.address,
      ops.address,
      audit.address,
      ...users.map(u => u.address),
    ];

    const total = await sumUSDT(usdt, addrs);

    // Auditor invariant: since MockERC20 mint is only done by us in deploy,
    // and no burn, the sum must match mintedTotal exactly.
    expect(total).to.equal(mintedTotal);
  }

  async function maybeResolveStuck(env) {
    const { manager } = env;
    const rid = await manager.currentRound(PRODUCT_ID);
    const r = await manager.rounds(PRODUCT_ID, rid);

    if (r.vrfRequested && !r.completed) {
      await mine(8 * 24 * 3600);
      try {
        await (await manager.resolveStuckRound(PRODUCT_ID, rid)).wait();
      } catch {}
    }
  }

  async function fuzz(env, steps, seed = 1337) {
    const { manager, users } = env;
    const rng = mulberry32(seed);
    const qtys = [1, 3, 5, 10];

    for (let i = 0; i < steps; i++) {
      const buyer = users[Math.floor(rng() * users.length)];
      const qty = qtys[Math.floor(rng() * qtys.length)];

      // attempt buy
      try {
        const tx = await manager.connect(buyer).buyTickets(PRODUCT_ID, qty, ethers.ZeroAddress);
        await tx.wait();
      } catch {}

      // sometimes resolve if stuck
      if (i % 25 === 0) {
        await maybeResolveStuck(env);
      }

      // accounting invariant frequently
      if (i % 50 === 0) {
        await assertUSDTAccounting(env);
      }

      // liveness: current round should exist
      const rid = await manager.currentRound(PRODUCT_ID);
      const r = await manager.rounds(PRODUCT_ID, rid);
      expect(r.roundId).to.equal(rid);
    }

    // final checks
    await maybeResolveStuck(env);
    await assertUSDTAccounting(env);
  }

  it("AUDIT: accounting invariant + fuzz 5000 actions", async function () {
    const env = await deployEcosystem();
    await fuzz(env, 5000, 1337);
  });

  it("AUDIT: accounting invariant + fuzz 10000 actions", async function () {
    const env = await deployEcosystem();
    await fuzz(env, 10000, 1337);
  });

  it("AUDIT: accounting invariant + fuzz 20000 actions", async function () {
    const env = await deployEcosystem();
    await fuzz(env, 20000, 1337);
  });
});
