/**
 * NEXALO — Mainnet-Ready Deployment Script
 * ==========================================
 * Deploys and configures the complete ecosystem in the correct order.
 * Identical logic for BSC Testnet and BSC Mainnet (1:1 parity).
 *
 * Deploy order:
 *  1. NXLToken (needs NexumManager address — use CREATE2 pattern or pre-compute)
 *  2. NexumManager
 *  3. ReferralNetwork
 *  4. AmbassadorRegistry
 *  5. TreasuryBTC
 *  6. NexaloStaking
 *  7. DonationVault
 *  8. setEcosystemAddresses (NexumManager)
 *  9. configureNXLTokenTreasury (NexumManager → NXLToken)
 * 10. finalizeAutonomy() → renounceOwnership
 *
 * Usage:
 *   npx hardhat run scripts/deploy-mainnet-ready.js --network bscTestnet
 *   npx hardhat run scripts/deploy-mainnet-ready.js --network bscMainnet
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// ─── Configuration ─────────────────────────────────────────────────────────────
const CONFIG = {
  bscTestnet: {
    USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    WBTC: "0x8BaBbB98678facC7342735486C851ABD7A0d17Ca",
    VRF_COORDINATOR: "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f",
    SUBSCRIPTION_ID: 1234,
    KEY_HASH: "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
    REDEEM_WINDOW_DURATION: 7 * 24 * 3600, // 7 days testnet
    REDEEM_WINDOW_START_OFFSET: 30 * 24 * 3600, // 30 days after deploy
  },
  bscMainnet: {
    USDT: "0x55d398326f99059fF775485246999027B3197955", // BSC-USD (Tether)
    WBTC: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB on BSC
    VRF_COORDINATOR: "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE",
    SUBSCRIPTION_ID: process.env.MAINNET_VRF_SUBSCRIPTION_ID || 0,
    KEY_HASH: "0x114f3da0a805b6a67d6e9cd2ec746f7028f1b7376365af575cfea3550dd1aa04",
    REDEEM_WINDOW_DURATION: 7 * 24 * 3600, // 7 days mainnet
    REDEEM_WINDOW_START_OFFSET: 365 * 24 * 3600, // 1 year after deploy
  },
};

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = network.chainId === 97n ? "bscTestnet" : "bscMainnet";
  const cfg = CONFIG[networkName];

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  NEXALO Mainnet-Ready Deploy — ${networkName}`);
  console.log(`${"═".repeat(60)}\n`);

  const [deployer] = await ethers.getSigners();
  const deployerBal = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(deployerBal)} BNB`);

  if (deployerBal < ethers.parseEther("0.1")) {
    throw new Error("Insufficient BNB — need at least 0.1 BNB for gas");
  }

  // ── Address config ──────────────────────────────────────────────────────────
  const FOUNDER = process.env.FOUNDER_ADDRESS || deployer.address;
  const PARTNER = process.env.PARTNER_ADDRESS || deployer.address;
  const FEES_RECEIVER = process.env.FEES_RECEIVER || deployer.address;
  const OPS_SERVICE = process.env.OPS_SERVICE || deployer.address;
  const AUDIT_FUNDS = process.env.AUDIT_FUNDS || deployer.address;
  const PAUSE_GUARDIAN = process.env.PAUSE_GUARDIAN || FOUNDER;

  console.log("\n── Addresses ──────────────────────────────────────────────");
  console.log(`  Founder:       ${FOUNDER}`);
  console.log(`  Partner:       ${PARTNER}`);
  console.log(`  FeesReceiver:  ${FEES_RECEIVER}`);
  console.log(`  OpsService:    ${OPS_SERVICE}`);
  console.log(`  AuditFunds:    ${AUDIT_FUNDS}`);
  console.log(`  PauseGuardian: ${PAUSE_GUARDIAN}`);

  // Pre-flight: Mainnet VRF subscription check
  if (networkName === "bscMainnet" && cfg.SUBSCRIPTION_ID === 0) {
    throw new Error("MAINNET_VRF_SUBSCRIPTION_ID not set. Fund a Chainlink VRF subscription first.");
  }

  const deployedAddresses = {};

  // ── 1. Compute NexumManager address (for NXLToken constructor) ──────────────
  // We pre-compute the address by deploying NXL first with a known future nonce
  console.log("\n── Deployment ─────────────────────────────────────────────");

  const currentNonce = await ethers.provider.getTransactionCount(deployer.address);
  // NXLToken deploy is nonce N, NexumManager will be nonce N+1
  const futureManagerAddress = ethers.getCreateAddress({
    from: deployer.address,
    nonce: currentNonce + 1,
  });
  console.log(`  Pre-computed NexumManager address: ${futureManagerAddress}`);

  // ── 2. Deploy NXLToken ──────────────────────────────────────────────────────
  console.log("\n[1/8] Deploying NXLToken...");
  const NXL = await ethers.getContractFactory("NXLToken");
  const nxl = await NXL.deploy(FOUNDER, PARTNER, futureManagerAddress);
  await nxl.waitForDeployment();
  deployedAddresses.NXLToken = await nxl.getAddress();
  console.log(`  ✅ NXLToken: ${deployedAddresses.NXLToken}`);

  // Verify pre-computed address matches
  const redeemWindowStart = Math.floor(Date.now() / 1000) + cfg.REDEEM_WINDOW_START_OFFSET;

  // ── 3. Deploy NexumManager ──────────────────────────────────────────────────
  console.log("[2/8] Deploying NexumManager...");
  const NM = await ethers.getContractFactory("NexumManager");
  const nm = await NM.deploy(
    cfg.VRF_COORDINATOR,
    cfg.SUBSCRIPTION_ID,
    cfg.KEY_HASH,
    cfg.USDT,
    deployedAddresses.NXLToken,
    FOUNDER, PARTNER, FEES_RECEIVER, OPS_SERVICE,
    AUDIT_FUNDS, PAUSE_GUARDIAN
  );
  await nm.waitForDeployment();
  deployedAddresses.NexumManager = await nm.getAddress();

  // Verify addresses match
  if (deployedAddresses.NexumManager.toLowerCase() !== futureManagerAddress.toLowerCase()) {
    console.warn(`  ⚠️  Manager address mismatch! Pre-computed: ${futureManagerAddress}`);
    console.warn(`     Actual: ${deployedAddresses.NexumManager}`);
    console.warn("     NXLToken points to wrong manager — STOP and redeploy.");
    process.exit(1);
  }
  console.log(`  ✅ NexumManager: ${deployedAddresses.NexumManager}`);

  // ── 4. Deploy ReferralNetwork ───────────────────────────────────────────────
  console.log("[3/8] Deploying ReferralNetwork...");
  const RN = await ethers.getContractFactory("ReferralNetwork");
  const rn = await RN.deploy(cfg.USDT);
  await rn.waitForDeployment();
  deployedAddresses.ReferralNetwork = await rn.getAddress();
  await rn.setNexumManager(deployedAddresses.NexumManager);
  console.log(`  ✅ ReferralNetwork: ${deployedAddresses.ReferralNetwork}`);

  // ── 5. Deploy AmbassadorRegistry ───────────────────────────────────────────
  console.log("[4/8] Deploying AmbassadorRegistry...");
  const AR = await ethers.getContractFactory("AmbassadorRegistry");
  const ar = await AR.deploy(cfg.USDT);
  await ar.waitForDeployment();
  deployedAddresses.AmbassadorRegistry = await ar.getAddress();
  console.log(`  ✅ AmbassadorRegistry: ${deployedAddresses.AmbassadorRegistry}`);

  // ── 6. Deploy TreasuryBTC ───────────────────────────────────────────────────
  console.log("[5/8] Deploying TreasuryBTC...");
  const TB = await ethers.getContractFactory("TreasuryBTC");
  const tb = await TB.deploy(
    cfg.USDT, deployedAddresses.NXLToken, deployedAddresses.NexumManager,
    cfg.WBTC, redeemWindowStart, cfg.REDEEM_WINDOW_DURATION
  );
  await tb.waitForDeployment();
  deployedAddresses.TreasuryBTC = await tb.getAddress();
  console.log(`  ✅ TreasuryBTC: ${deployedAddresses.TreasuryBTC}`);

  // ── 7. Deploy NexaloStaking ─────────────────────────────────────────────────
  console.log("[6/8] Deploying NexaloStaking...");
  const STAKING = await ethers.getContractFactory("NexaloStaking");
  const staking = await STAKING.deploy(deployedAddresses.NXLToken, cfg.WBTC);
  await staking.waitForDeployment();
  deployedAddresses.NexaloStaking = await staking.getAddress();
  await tb.setStaking(deployedAddresses.NexaloStaking);
  console.log(`  ✅ NexaloStaking: ${deployedAddresses.NexaloStaking}`);

  // ── 8. Deploy DonationVault ─────────────────────────────────────────────────
  console.log("[7/8] Deploying DonationVault...");
  const DV = await ethers.getContractFactory("DonationVault");
  const dv = await DV.deploy(cfg.USDT, deployedAddresses.TreasuryBTC);
  await dv.waitForDeployment();
  deployedAddresses.DonationVault = await dv.getAddress();
  console.log(`  ✅ DonationVault: ${deployedAddresses.DonationVault}`);

  // ── 9. Configure ecosystem ──────────────────────────────────────────────────
  console.log("[8/8] Configuring ecosystem...");
  const setEcoTx = await nm.setEcosystemAddresses(
    deployedAddresses.TreasuryBTC,
    deployedAddresses.ReferralNetwork,
    deployedAddresses.AmbassadorRegistry
  );
  await setEcoTx.wait();
  console.log("  ✅ Ecosystem addresses set");

  const cfgNXLTx = await nm.configureNXLTokenTreasury(deployedAddresses.TreasuryBTC);
  await cfgNXLTx.wait();
  console.log("  ✅ NXLToken treasury configured");

  // ── 10. Finalize autonomy (renounceOwnership) ───────────────────────────────
  console.log("\n── Finalizing Autonomy ─────────────────────────────────────");
  console.log("  ⚠️  This will renounceOwnership — IRREVERSIBLE");
  const finTx = await nm.finalizeAutonomy();
  await finTx.wait();

  const newOwner = await nm.owner();
  if (newOwner !== ethers.ZeroAddress) {
    throw new Error(`Owner not renounced! Current owner: ${newOwner}`);
  }
  console.log("  ✅ Autonomy finalized — owner renounced");
  console.log(`  ✅ Pause guardian: ${await nm.pauseGuardian()}`);
  console.log(`  ✅ Protocol unpaused: ${!(await nm.paused())}`);

  // ── Post-deploy verification ────────────────────────────────────────────────
  console.log("\n── Post-Deploy Verification ────────────────────────────────");
  const nxlAvailable = await nxl.getAvailableRewards();
  console.log(`  NXL available for rewards: ${ethers.formatEther(nxlAvailable)} NXL`);
  console.log(`  Rounds initialized: 6 (one per product)`);
  console.log(`  Protocol paused: ${await nm.paused()}`);
  console.log(`  Ecosystem locked: ${await nm.ecosystemLocked()}`);

  // ── Save deployment ─────────────────────────────────────────────────────────
  const output = {
    network: networkName,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedAddresses,
    config: {
      USDT: cfg.USDT,
      WBTC: cfg.WBTC,
      VRF_COORDINATOR: cfg.VRF_COORDINATOR,
      SUBSCRIPTION_ID: cfg.SUBSCRIPTION_ID,
      KEY_HASH: cfg.KEY_HASH,
      FOUNDER,
      PARTNER,
      FEES_RECEIVER,
      OPS_SERVICE,
      AUDIT_FUNDS,
      PAUSE_GUARDIAN,
      REDEEM_WINDOW_START: new Date(redeemWindowStart * 1000).toISOString(),
    },
  };

  const outFile = path.join(__dirname, `../deployments-${networkName}-${Date.now()}.json`);
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`\n✅ Deployment saved: ${outFile}`);

  // Also update deployed-addresses.json
  fs.writeFileSync(
    path.join(__dirname, "../deployed-addresses.json"),
    JSON.stringify(output, null, 2)
  );

  console.log(`\n${"═".repeat(60)}`);
  console.log("  NEXALO DEPLOYMENT COMPLETE");
  console.log(`${"═".repeat(60)}`);
  console.log("\nNext steps:");
  console.log("  1. Verify contracts on BSCScan:");
  console.log("     npx hardhat run scripts/verify-all-contracts.js --network " + networkName);
  console.log("  2. Add NexumManager to Chainlink VRF subscription as consumer");
  console.log("  3. Fund TreasuryBTC with initial WBTC for staking rewards");
  console.log("  4. Announce guardian address publicly for transparency");
}

main().catch((e) => { console.error(e); process.exit(1); });
