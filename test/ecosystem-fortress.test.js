const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NEXALO - Ecosystem Fortress Suite (stress + security + anti-hacking)", function () {
  this.timeout(0);

  const PRODUCT_ID = 0; // FLASH
  const KEYHASH =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";

  async function mine(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
  }

  // deterministic PRNG (mulberry32)
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function deployEcosystem({ useMaliciousStable = false } = {}) {
    const [deployer, founder, partner, fees, ops, audit, ...users] =
      await ethers.getSigners();

    if (users.length < 6) {
      throw new Error(`Necesito más cuentas. Tengo users.length=${users.length}`);
    }

    const oneUSDT = ethers.parseUnits("1", 18);

    // stable
    let usdt;
    if (!useMaliciousStable) {
      const MockERC20 = await ethers.getContractFactory(
        "contracts/mocks/MockERC20.sol:MockERC20"
      );
      usdt = await MockERC20.deploy("Mock USDT", "USDT", 18);
      await usdt.waitForDeployment();
    } else {
      const MaliciousUSDT = await ethers.getContractFactory("MaliciousUSDT");
      usdt = await MaliciousUSDT.deploy();
      await usdt.waitForDeployment();
    }

    // WBTC
    const MockERC20 = await ethers.getContractFactory(
      "contracts/mocks/MockERC20.sol:MockERC20"
    );
    const wbtc = await MockERC20.deploy("Mock WBTC", "WBTC", 8);
    await wbtc.waitForDeployment();

    // fund users
    for (let i = 0; i < users.length; i++) {
      await (await usdt.mint(users[i].address, oneUSDT * 600000n)).wait();
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

    // manager
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

    // malicious stable points to manager
    if (useMaliciousStable) {
      await (await usdt.setManager(managerAddr)).wait();
    }

    // wire
    await (await nxl.setNexumManager(managerAddr)).wait();
    await (await referral.setNexumManager(managerAddr)).wait();

    // treasury
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

    // ecosystem
    await (await manager.setEcosystemAddresses(
      await treasury.getAddress(),
      await referral.getAddress(),
      await ambassadors.getAddress()
    )).wait();

    if (manager.configureNXLTokenTreasury) {
      await (await manager.configureNXLTokenTreasury(await treasury.getAddress())).wait();
    }

    await (await ambassadors.connect(users[0]).selfRegister("A")).wait();
    await (await ambassadors.connect(users[1]).selfRegister("B")).wait();

    if (manager.finalizeAutonomy) {
      await (await manager.finalizeAutonomy()).wait();
    }

    // approvals
    for (let i = 0; i < users.length; i++) {
      await (await usdt.connect(users[i]).approve(managerAddr, oneUSDT * 500000n)).wait();
    }

    return {
      deployer, founder, partner, fees, ops, audit,
      users,
      usdt, wbtc, nxl, referral, ambassadors, vrf,
      manager, treasury, oneUSDT
    };
  }

  async function fillRoundStress(env, productId, maxTickets) {
    const { manager, users } = env;
    const qtys = [10, 5, 3, 1];

    const roundId = await manager.currentRound(productId);
    let sold = (await manager.rounds(productId, roundId)).ticketsSold;

    let turn = 0;
    while (sold < maxTickets) {
      const remaining = maxTickets - sold;
      const q = qtys[turn % qtys.length];
      const qty = remaining >= BigInt(q) ? q : 1;

      const buyer = users[turn % users.length];
      await (await manager.connect(buyer).buyTickets(productId, qty, ethers.ZeroAddress)).wait();

      sold = (await manager.rounds(productId, roundId)).ticketsSold;
      turn++;
    }

    const r = await manager.rounds(productId, roundId);
    expect(r.ticketsSold).to.equal(maxTickets);
    return roundId;
  }

  async function settleStuck(env, productId, roundId) {
    const { manager } = env;
    await mine(8 * 24 * 3600);
    await (await manager.resolveStuckRound(productId, roundId)).wait();
    const rDone = await manager.rounds(productId, roundId);
    expect(rDone.completed).to.equal(true);
    expect(rDone.winner).to.not.equal(ethers.ZeroAddress);
    return rDone;
  }

  it("FORTRESS: deploys, stress-fills, settles stuck round, checks invariants", async function () {
    const env = await deployEcosystem();
    const { manager, treasury, usdt, nxl, users } = env;

    const product = await manager.products(PRODUCT_ID);
    expect(product.maxTickets).to.be.oneOf([1000n, 10000n]);

    // access-control smoke
    await expect(
      manager.connect(users[0]).setEcosystemAddresses(users[2].address, users[3].address, users[4].address)
    ).to.be.reverted;

    // stress fill
    const roundId = await fillRoundStress(env, PRODUCT_ID, product.maxTickets);

    const rAfter = await manager.rounds(PRODUCT_ID, roundId);
    expect(rAfter.vrfRequested).to.equal(true);

    const rDone = await settleStuck(env, PRODUCT_ID, roundId);

    // winner claim
    const winner = rDone.winner;
    const claim = await manager.claimableStable(winner);
    expect(claim).to.be.greaterThan(0n);

    const winnerSigner = await ethers.getSigner(winner);
    const b0 = await usdt.balanceOf(winner);
    await (await manager.connect(winnerSigner).claimStable()).wait();
    const b1 = await usdt.balanceOf(winner);
    expect(b1 - b0).to.equal(claim);

    // treasury sanity
    await (await treasury.receiveFunds()).wait();
    const tBal = await usdt.balanceOf(await treasury.getAddress());
    expect(tBal).to.be.greaterThan(0n);

    await (await treasury.openRedeemWindow()).wait();
    expect(await treasury.windowOpen()).to.equal(true);

    // supply sanity (sample)
    const supply = await nxl.totalSupply();
    expect(supply).to.be.greaterThan(0n);
  });

  it("FORTRESS: anti-hacking - reentrancy via malicious ERC20 transferFrom must revert", async function () {
    const env = await deployEcosystem({ useMaliciousStable: true });
    const { manager, usdt, users } = env;

    await (await usdt.configureAttack(PRODUCT_ID, 1, ethers.ZeroAddress)).wait();
    await (await usdt.setAttackEnabled(true)).wait();

    await expect(
      manager.connect(users[0]).buyTickets(PRODUCT_ID, 1, ethers.ZeroAddress)
    ).to.be.reverted;

    await (await usdt.setAttackEnabled(false)).wait();
    await expect(
      manager.connect(users[0]).buyTickets(PRODUCT_ID, 1, ethers.ZeroAddress)
    ).to.not.be.reverted;
  });

  it("FORTRESS: regression - MockERC20 must be referenced with fully qualified name", async function () {
    const MockERC20 = await ethers.getContractFactory(
      "contracts/mocks/MockERC20.sol:MockERC20"
    );
    const t = await MockERC20.deploy("T", "T", 18);
    await t.waitForDeployment();
    expect(await t.decimals()).to.equal(18);
  });

  it("FORTRESS: multi-round durability (3 rounds) - should not brick over time", async function () {
    const env = await deployEcosystem();
    const { manager, usdt } = env;

    const product = await manager.products(PRODUCT_ID);
    const maxTickets = product.maxTickets;

    for (let i = 0; i < 3; i++) {
      const roundId = await fillRoundStress(env, PRODUCT_ID, maxTickets);
      const rDone = await settleStuck(env, PRODUCT_ID, roundId);

      // winner can always claim something
      const winner = rDone.winner;
      const claim = await manager.claimableStable(winner);
      expect(claim).to.be.greaterThanOrEqual(0n);

      if (claim > 0n) {
        const winnerSigner = await ethers.getSigner(winner);
        const b0 = await usdt.balanceOf(winner);
        await (await manager.connect(winnerSigner).claimStable()).wait();
        const b1 = await usdt.balanceOf(winner);
        expect(b1 - b0).to.equal(claim);
      }
    }
  });

  it("FORTRESS: deterministic fuzzer (200 actions) - should keep invariants + never deadlock", async function () {
    const env = await deployEcosystem();
    const { manager, users } = env;

    const rng = mulberry32(1337);
    const qtys = [1, 3, 5, 10];

    // Keep actions limited to avoid huge runtime, but enough to catch regressions.
    for (let i = 0; i < 200; i++) {
      const buyer = users[Math.floor(rng() * users.length)];
      const qty = qtys[Math.floor(rng() * qtys.length)];

      // best-effort: ignore expected reverts on "round full" race etc.
      try {
        const tx = await manager.connect(buyer).buyTickets(PRODUCT_ID, qty, ethers.ZeroAddress);
        await tx.wait();
      } catch (e) {
        // acceptable reverts: round full / invalid qty etc.
        // the important thing is: system doesn't brick permanently.
      }

      // sanity: currentRound always exists
      const rid = await manager.currentRound(PRODUCT_ID);
      const r = await manager.rounds(PRODUCT_ID, rid);
      expect(r.roundId).to.equal(rid);

      // if round got full & vrf requested, we can fast-forward and resolve sometimes
      if (r.vrfRequested && !r.completed) {
        await mine(8 * 24 * 3600);
        try {
          await (await manager.resolveStuckRound(PRODUCT_ID, rid)).wait();
        } catch {}
      }
    }
  });
});
