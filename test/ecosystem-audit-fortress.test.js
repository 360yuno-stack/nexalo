const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * NEXALO - AUDIT FORTRESS SUITE
 * Covers:
 * - stress + multi-round
 * - access control exhaustive
 * - invalid qty
 * - ticket duplicates / ticket sold
 * - front-running style contention
 * - DoS patterns (ensure no deadlock)
 * - reentrancy attempt via malicious ERC20 transferFrom
 * - claims random (stable + NXL) during 20k actions
 * - economic report at end
 *
 * Run:
 *   npx hardhat clean
 *   npx hardhat test test/ecosystem-audit-fortress.test.js
 */

describe("NEXALO - Ecosystem Audit Fortress Suite (full audit coverage)", function () {
  this.timeout(0);

  const PRODUCT_ID = 0; // FLASH = 1000 tickets
  const KEYHASH =
    "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4";

  // ------- utils -------
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

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function pickInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function toBig(n) {
    return BigInt(n);
  }

  // ------- deploy full ecosystem (USDT mock + WBTC mock + NXL + Referral + Ambassadors + VRF + NexumManager + TreasuryBTC) -------
  async function deployEcosystem({ useMaliciousUSDT = false } = {}) {
    const [deployer, founder, partner, fees, ops, audit, ...users] =
      await ethers.getSigners();

    const oneUSDT = ethers.parseUnits("1", 18);

    // USDT:
    let usdt;
    if (!useMaliciousUSDT) {
      const MockERC20 = await ethers.getContractFactory(
        "contracts/mocks/MockERC20.sol:MockERC20"
      );
      usdt = await MockERC20.deploy("Mock USDT", "USDT", 18);
      await usdt.waitForDeployment();
    } else {
      const Mal = await ethers.getContractFactory("MaliciousERC20Reenter");
      usdt = await Mal.deploy("Mal USDT", "mUSDT");
      await usdt.waitForDeployment();
    }

    // WBTC (always safe mock)
    const MockERC20 = await ethers.getContractFactory(
      "contracts/mocks/MockERC20.sol:MockERC20"
    );
    const wbtc = await MockERC20.deploy("Mock WBTC", "WBTC", 8);
    await wbtc.waitForDeployment();

    // track minted totals for economic invariant (USDT)
    let mintedTotal = 0n;

    // Mint USDT to users
    const perUser = oneUSDT * 2_000_000n;
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

    // VRF mock + subscription
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
    if (subId === undefined) throw new Error("No subId from SubscriptionCreated");
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

    // if malicious usdt, point it to manager for reentrancy attempt
    if (useMaliciousUSDT) {
      await (await usdt.setManager(managerAddr)).wait();
    }

    await (await vrf.addConsumer(subId, managerAddr)).wait();

    // Wire
    await (await nxl.setNexumManager(managerAddr)).wait();
    await (await referral.setNexumManager(managerAddr)).wait();

    // TreasuryBTC
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

    // ecosystem addresses
    await (await manager.setEcosystemAddresses(
      await treasury.getAddress(),
      await referral.getAddress(),
      await ambassadors.getAddress()
    )).wait();

    // configure NXL treasury (required by finalizeAutonomy)
    await (await manager.configureNXLTokenTreasury(await treasury.getAddress())).wait();

    // register a couple ambassadors
    await (await ambassadors.connect(users[0]).selfRegister("A")).wait();
    await (await ambassadors.connect(users[1]).selfRegister("B")).wait();

    // finalize autonomy => unpause + renounce
    await (await manager.finalizeAutonomy()).wait();

    // approvals
    for (let i = 0; i < users.length; i++) {
      await (await usdt.connect(users[i]).approve(managerAddr, oneUSDT * 1_500_000n)).wait();
    }

    return {
      deployer, founder, partner, fees, ops, audit,
      users,
      usdt, wbtc, nxl, referral, ambassadors, vrf,
      manager, treasury, oneUSDT,
      mintedTotal,
    };
  }

  // ------- accounting: sum balances equals minted total (since no burn in mock) -------
  async function sumToken(token, addrs) {
    let s = 0n;
    for (const a of addrs) s += await token.balanceOf(a);
    return s;
  }

  async function assertStableAccounting(env) {
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
    const total = await sumToken(usdt, addrs);
    expect(total).to.equal(mintedTotal);
  }

  // ------- helpers: fill one round fast -------
  async function fillRound(manager, users, productId) {
    const product = await manager.products(productId);
    const maxTickets = product.maxTickets;
    const qtys = [10, 5, 3, 1];

    const roundId = await manager.currentRound(productId);
    let sold = (await manager.rounds(productId, roundId)).ticketsSold;

    let i = 0;
    while (sold < maxTickets) {
      const rem = maxTickets - sold;
      const q = qtys[i % qtys.length];
      const qty = rem >= BigInt(q) ? q : 1;
      const buyer = users[i % users.length];

      await (await manager.connect(buyer).buyTickets(productId, qty, ethers.ZeroAddress)).wait();
      sold = (await manager.rounds(productId, roundId)).ticketsSold;
      i++;
    }

    const r = await manager.rounds(productId, roundId);
    expect(r.ticketsSold).to.equal(maxTickets);
    expect(r.vrfRequested).to.equal(true);
    return { roundId, maxTickets };
  }

  async function resolveIfStuck(manager, productId, roundId) {
    const r = await manager.rounds(productId, roundId);
    if (r.vrfRequested && !r.completed) {
      await mine(8 * 24 * 3600);
      await (await manager.resolveStuckRound(productId, roundId)).wait();
    }
  }

  // ------- access control exhaustive tests -------
  async function accessControlChecks(env) {
    const { manager, users } = env;

    // not owner: setEcosystemAddresses must revert (and locked anyway)
    await expect(
      manager.connect(users[0]).setEcosystemAddresses(users[1].address, users[2].address, users[3].address)
    ).to.be.reverted;

    // finalizeAutonomy already renounced owner; emergencyPause must revert (no owner)
    await expect(manager.connect(users[0]).emergencyPause()).to.be.reverted;
  }

  // ------- invalid qty tests -------
  async function invalidQtyChecks(env) {
    const { manager, users } = env;

    await expect(
      manager.connect(users[0]).buyTickets(PRODUCT_ID, 2, ethers.ZeroAddress)
    ).to.be.revertedWith("Invalid qty");

    await expect(
      manager.connect(users[0]).buyTickets(PRODUCT_ID, 0, ethers.ZeroAddress)
    ).to.be.revertedWith("Invalid qty");
  }

  // ------- ticket duplicate / sold / frontrun style -------
  async function ticketContentionChecks(env) {
    const { manager, users } = env;

    // choose two users trying same ticket set
    const roundId = await manager.currentRound(PRODUCT_ID);

    // use fixed tickets [7,8,9]
    const tickets = [7, 8, 9];

    // buyerA buys specific
    await (await manager.connect(users[0]).buySpecificTickets(PRODUCT_ID, tickets, ethers.ZeroAddress)).wait();

    // buyerB tries same => must revert "Ticket sold"
    await expect(
      manager.connect(users[1]).buySpecificTickets(PRODUCT_ID, tickets, ethers.ZeroAddress)
    ).to.be.revertedWith("Ticket sold");

    // duplicates inside same tx => must revert "Duplicate ticket"
    await expect(
      manager.connect(users[2]).buySpecificTickets(PRODUCT_ID, [11, 11, 12], ethers.ZeroAddress)
    ).to.be.revertedWith("Duplicate ticket");
  }

  // ------- DoS patterns (ensure not deadlocked) -------
  async function dosPatternChecks(env) {
    const { manager, users } = env;

    // Try large set not allowed (qty must be 1/3/5/10)
    const big = Array.from({ length: 20 }, (_, i) => i);
    await expect(
      manager.connect(users[0]).buySpecificTickets(PRODUCT_ID, big, ethers.ZeroAddress)
    ).to.be.revertedWith("Invalid qty");

    // Try invalid ticket id >= maxTickets
    const product = await manager.products(PRODUCT_ID);
    const badTicket = Number(product.maxTickets) + 1;
    await expect(
      manager.connect(users[0]).buySpecificTickets(PRODUCT_ID, [badTicket], ethers.ZeroAddress)
    ).to.be.revertedWith("Invalid ticket");
  }

  // ------- reentrancy test (malicious transferFrom tries to reenter buyTickets/buySpecificTickets) -------
  async function reentrancyChecks() {
    const env = await deployEcosystem({ useMaliciousUSDT: true });
    const { manager, users, usdt, oneUSDT } = env;

    // enable reentrancy during transferFrom called by manager
    // the malicious token will try to reenter and should be blocked by nonReentrant.
    await (await usdt.configureAttackBuy(PRODUCT_ID, 1)).wait();
    await (await usdt.setAttackEnabled(true)).wait();

    // approve already set in deployEcosystem; do a buy that triggers transferFrom reentry
    await expect(
      manager.connect(users[0]).buyTickets(PRODUCT_ID, 1, ethers.ZeroAddress)
    ).to.be.reverted; // any revert is ok; core is: it must NOT drain accounting

    // accounting must still hold
    await assertStableAccounting(env);
  }

  // ------- random claims during fuzz (withdrawal ordering) -------
  async function maybeClaim(env, rng) {
    const { manager, users } = env;
    const who = pick(rng, users);

    const doStable = rng() < 0.6;
    if (doStable) {
      const amt = await manager.claimableStable(who.address);
      if (amt > 0n) {
        try {
          await (await manager.connect(who).claimStable()).wait();
        } catch {}
      }
    } else {
      const amt = await manager.claimableNXL(who.address);
      if (amt > 0n) {
        try {
          await (await manager.connect(who).claimNXL()).wait();
        } catch {}
      }
    }
  }

  // ------- economic report -------
  async function economicReport(env, label = "REPORT") {
    const { usdt, manager, treasury, referral, ambassadors, founder, partner, fees, ops, audit, users } = env;

    const addr = {
      manager: await manager.getAddress(),
      treasury: await treasury.getAddress(),
      referral: await referral.getAddress(),
      ambassadors: await ambassadors.getAddress(),
      founder: founder.address,
      partner: partner.address,
      fees: fees.address,
      ops: ops.address,
      audit: audit.address,
    };

    const balances = {};
    for (const [k, a] of Object.entries(addr)) {
      balances[k] = await usdt.balanceOf(a);
    }

    // sample users (first 10)
    let usersSum = 0n;
    const sampleN = Math.min(10, users.length);
    for (let i = 0; i < sampleN; i++) {
      usersSum += await usdt.balanceOf(users[i].address);
    }

    const auditAccrued = await env.manager.auditAccrued();

    // Print to console (Mocha output)
    console.log("\n==================== " + label + " ====================");
    console.log("USDT balances:");
    console.log(balances);
    console.log("auditAccrued (pull):", auditAccrued.toString());
    console.log("Sample(10) users USDT sum:", usersSum.toString());
    console.log("========================================================\n");
  }

  // ------- fuzzer: actions include buys, specific buys, claims, contention, resolve stuck -------
  async function fuzz(env, steps, seed = 1337) {
    const { manager, users } = env;
    const rng = mulberry32(seed);

    const qtys = [1, 3, 5, 10];

    for (let i = 0; i < steps; i++) {
      const p = rng();

      // 0.00-0.60: buyTickets
      if (p < 0.60) {
        const buyer = pick(rng, users);
        const qty = pick(rng, qtys);
        try {
          await (await manager.connect(buyer).buyTickets(PRODUCT_ID, qty, ethers.ZeroAddress)).wait();
        } catch {}
      }
      // 0.60-0.80: buySpecificTickets (random safe set)
      else if (p < 0.80) {
        const buyer = pick(rng, users);
        const qty = pick(rng, qtys);
        const product = await manager.products(PRODUCT_ID);
        const max = Number(product.maxTickets);

        // generate unique tickets
        const set = new Set();
        while (set.size < qty) set.add(pickInt(rng, 0, max - 1));
        const tickets = Array.from(set);

        try {
          await (await manager.connect(buyer).buySpecificTickets(PRODUCT_ID, tickets, ethers.ZeroAddress)).wait();
        } catch {}
      }
      // 0.80-0.93: random claim (withdrawal ordering)
      else if (p < 0.93) {
        await maybeClaim(env, rng);
      }
      // 0.93-0.97: contention style (two try same ticket)
      else if (p < 0.97) {
        const product = await manager.products(PRODUCT_ID);
        const max = Number(product.maxTickets);
        const t = pickInt(rng, 0, max - 1);
        const tickets = [t];

        // sequential simulate (mempool race) => one should win, other fail
        const a = users[0];
        const b = users[1];
        try { await (await manager.connect(a).buySpecificTickets(PRODUCT_ID, tickets, ethers.ZeroAddress)).wait(); } catch {}
        try { await (await manager.connect(b).buySpecificTickets(PRODUCT_ID, tickets, ethers.ZeroAddress)).wait(); } catch {}
      }
      // 0.97-1.00: resolve stuck if stuck
      else {
        const rid = await manager.currentRound(PRODUCT_ID);
        const r = await manager.rounds(PRODUCT_ID, rid);
        if (r.vrfRequested && !r.completed) {
          await mine(8 * 24 * 3600);
          try { await (await manager.resolveStuckRound(PRODUCT_ID, rid)).wait(); } catch {}
        }
      }

      // invariants frequently
      if (i % 50 === 0) await assertStableAccounting(env);

      // liveness
      if (i % 200 === 0) {
        const rid = await manager.currentRound(PRODUCT_ID);
        const rr = await manager.rounds(PRODUCT_ID, rid);
        expect(rr.roundId).to.equal(rid);
      }
    }

    await assertStableAccounting(env);
  }

  // ------- multi-round durability (full rounds complete) -------
  async function multiRound(env, roundsCount) {
    const { manager, users } = env;

    for (let i = 1; i <= roundsCount; i++) {
      const { roundId } = await fillRound(manager, users, PRODUCT_ID);
      await mine(8 * 24 * 3600);
      await (await manager.resolveStuckRound(PRODUCT_ID, roundId)).wait();

      // random claim from winner (if any)
      const rDone = await manager.rounds(PRODUCT_ID, roundId);
      const w = rDone.winner;
      if (w !== ethers.ZeroAddress) {
        const claim = await manager.claimableStable(w);
        if (claim > 0n) {
          const signer = await ethers.getSigner(w);
          try { await (await manager.connect(signer).claimStable()).wait(); } catch {}
        }
      }

      if (i % 2 === 0) await assertStableAccounting(env);
    }
  }

  // ==================== TESTS ====================

  it("FORTRESS: access control exhaustive + invalid qty + duplicates + DoS + front-run style", async function () {
    const env = await deployEcosystem();

    await accessControlChecks(env);
    await invalidQtyChecks(env);
    await ticketContentionChecks(env);
    await dosPatternChecks(env);

    await assertStableAccounting(env);
    await economicReport(env, "BASIC CHECKS REPORT");
  });

  it("FORTRESS: reentrancy via malicious ERC20 transferFrom must not drain / must revert", async function () {
    await reentrancyChecks();
  });

  it("FORTRESS: multi-round durability (10 full rounds) - should not brick over time", async function () {
    const env = await deployEcosystem();
    await multiRound(env, 10);
    await economicReport(env, "MULTI-ROUND REPORT");
  });

  it("AUDIT: deterministic fuzzer 5000 actions (with random claims)", async function () {
    const env = await deployEcosystem();
    await fuzz(env, 5000, 1337);
    await economicReport(env, "FUZZ 5K REPORT");
  });

  it("AUDIT: deterministic fuzzer 10000 actions (with random claims)", async function () {
    const env = await deployEcosystem();
    await fuzz(env, 10000, 1337);
    await economicReport(env, "FUZZ 10K REPORT");
  });

  it("AUDIT: deterministic fuzzer 20000 actions (with random claims)", async function () {
    const env = await deployEcosystem();
    await fuzz(env, 20000, 1337);
    await economicReport(env, "FUZZ 20K REPORT");
  });

  it("REGRESSION: MockERC20 must be referenced with fully qualified name", async function () {
    const MockERC20 = await ethers.getContractFactory(
      "contracts/mocks/MockERC20.sol:MockERC20"
    );
    const t = await MockERC20.deploy("T", "T", 18);
    await t.waitForDeployment();
    expect(await t.decimals()).to.equal(18);
  });
});
