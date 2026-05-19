const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const { ethers } = hre;
  const { isAddress } = require("ethers");

  console.log("\n🚀 DESPLEGANDO ECOSISTEMA NEXALO COMPLETO");
  console.log("==============================================\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📍 Deployer:", deployer.address);
  console.log("💰 Balance (wei):", balance.toString());
  console.log("🌐 Network:", hre.network.name, "\n");

  // === ENV BASE ===
  const USDT = process.env.STABLE_TOKEN || process.env.USDT_ADDRESS;
  const WBTC = process.env.WBTC_ADDRESS;

  const founderEnv = process.env.FOUNDER_ADDRESS || process.env.FOUNDER;
  const partnerEnv = process.env.PARTNER_ADDRESS || process.env.PARTNER;

  const VRF_COORDINATOR = process.env.VRF_COORDINATOR;
  const VRF_KEY_HASH = process.env.VRF_KEY_HASH;
  const FEES_RECEIVER = process.env.FEES_RECEIVER || founderEnv;
  const OPS_SERVICE = process.env.OPS_SERVICE || founderEnv;
  const AUDIT_FUNDS = process.env.AUDIT_FUNDS || founderEnv;
  const PAUSE_GUARDIAN = process.env.PAUSE_GUARDIAN || founderEnv;

  if (!USDT || !isAddress(USDT)) {
    throw new Error(`STABLE_TOKEN / USDT_ADDRESS inválido: "${USDT}"`);
  }
  if (!WBTC || !isAddress(WBTC)) {
    throw new Error(`WBTC_ADDRESS inválido: "${WBTC}"`);
  }
  if (!founderEnv || !isAddress(founderEnv)) {
    throw new Error(`FOUNDER inválida: "${founderEnv}"`);
  }
  if (!partnerEnv || !isAddress(partnerEnv)) {
    throw new Error(`PARTNER inválida: "${partnerEnv}"`);
  }
  if (!VRF_COORDINATOR || !isAddress(VRF_COORDINATOR)) {
    throw new Error(`VRF_COORDINATOR inválido: "${VRF_COORDINATOR}"`);
  }
  if (!VRF_KEY_HASH || !/^0x[0-9a-fA-F]{64}$/.test(VRF_KEY_HASH)) {
    throw new Error(`VRF_KEY_HASH inválido: "${VRF_KEY_HASH}"`);
  }
  if (!FEES_RECEIVER || !isAddress(FEES_RECEIVER)) {
    throw new Error(`FEES_RECEIVER inválido: "${FEES_RECEIVER}"`);
  }
  if (!OPS_SERVICE || !isAddress(OPS_SERVICE)) {
    throw new Error(`OPS_SERVICE inválido: "${OPS_SERVICE}"`);
  }
  if (!AUDIT_FUNDS || !isAddress(AUDIT_FUNDS)) {
    throw new Error(`AUDIT_FUNDS inválido: "${AUDIT_FUNDS}"`);
  }
  if (!PAUSE_GUARDIAN || !isAddress(PAUSE_GUARDIAN)) {
    throw new Error(`PAUSE_GUARDIAN inválido: "${PAUSE_GUARDIAN}"`);
  }

  const subscriptionId = BigInt(process.env.VRF_SUB_ID || "0");
  if (!subscriptionId) {
    throw new Error(`VRF_SUB_ID inválido: "${process.env.VRF_SUB_ID}"`);
  }

  const FOUNDER = founderEnv;
  const PARTNER = partnerEnv;

  console.log("⚙️  Configuración .env:");
  console.log("   STABLE / USDT: ", USDT);
  console.log("   WBTC:          ", WBTC);
  console.log("   Founder:       ", FOUNDER);
  console.log("   Partner:       ", PARTNER);
  console.log("   VRF_COORDINATOR:", VRF_COORDINATOR);
  console.log("   VRF_SUB_ID:     ", subscriptionId.toString());
  console.log("   VRF_KEY_HASH:   ", VRF_KEY_HASH);
  console.log("   FEES_RECEIVER:  ", FEES_RECEIVER);
  console.log("   OPS_SERVICE:    ", OPS_SERVICE);
  console.log("   AUDIT_FUNDS:    ", AUDIT_FUNDS);
  console.log("   PAUSE_GUARDIAN: ", PAUSE_GUARDIAN, "\n");

  // 1) NXLToken
  console.log("1️⃣  Desplegando NXL Token...");
  const NXLTokenFactory = await ethers.getContractFactory("NXLToken");
  const nxlToken = await NXLTokenFactory.deploy(FOUNDER, PARTNER);
  await nxlToken.waitForDeployment();
  const NXL_TOKEN = await nxlToken.getAddress();
  console.log("   ✅ NXL Token:", NXL_TOKEN, "\n");

  // 2) NexumManager (11 params — includes _pauseGuardian)
  console.log("2️⃣  Desplegando NexumManager...");
  const NexumManagerFactory = await ethers.getContractFactory("NexumManager");
  const nexumManager = await NexumManagerFactory.deploy(
    VRF_COORDINATOR,
    subscriptionId,
    VRF_KEY_HASH,
    USDT,
    NXL_TOKEN,
    FOUNDER,
    PARTNER,
    FEES_RECEIVER,
    OPS_SERVICE,
    AUDIT_FUNDS,
    PAUSE_GUARDIAN  // <-- 11th param, was missing before
  );
  await nexumManager.waitForDeployment();
  const NEXUM_MANAGER = await nexumManager.getAddress();
  console.log("   ✅ NexumManager:", NEXUM_MANAGER, "\n");

  // 3) NXLToken.setNexumManager — MUST be called before any other config
  console.log("3️⃣  Configurando NXLToken.setNexumManager...");
  const nxl = await ethers.getContractAt("NXLToken", NXL_TOKEN);
  // MED-02 SECURITY: setNexumManager requires msg.sender == founderAddress
  // The deployer wallet MUST be the same as FOUNDER_ADDRESS
  if (deployer.address.toLowerCase() !== FOUNDER.toLowerCase()) {
    throw new Error(
      `DEPLOY BLOCKED: Deployer (${deployer.address}) != FOUNDER (${FOUNDER}).\n` +
      `setNexumManager requires msg.sender == founderAddress. Deploy with the FOUNDER private key.`
    );
  }
  const txSetMgr = await nxl.setNexumManager(NEXUM_MANAGER);
  await txSetMgr.wait();
  console.log("   ✅ NXLToken.setNexumManager()\n");

  // 4) ReferralNetwork
  console.log("4️⃣  Desplegando ReferralNetwork...");
  const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
  const referralNetwork = await ReferralNetwork.deploy(USDT);
  await referralNetwork.waitForDeployment();
  const REFERRAL_NETWORK = await referralNetwork.getAddress();
  console.log("   ✅ ReferralNetwork:", REFERRAL_NETWORK, "\n");

  // 5) AmbassadorRegistry
  console.log("5️⃣  Desplegando AmbassadorRegistry...");
  const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
  const ambassadorRegistry = await AmbassadorRegistry.deploy(USDT);
  await ambassadorRegistry.waitForDeployment();
  const AMBASSADOR_REGISTRY = await ambassadorRegistry.getAddress();
  console.log("   ✅ AmbassadorRegistry:", AMBASSADOR_REGISTRY, "\n");

  // 6) TreasuryBTC
  console.log("6️⃣  Desplegando TreasuryBTC...");
  const now = Math.floor(Date.now() / 1000);
  const redeemWindowStart = now - 7 * 24 * 60 * 60;
  const redeemWindowDuration = 7 * 24 * 60 * 60;

  const TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
  const treasuryBTC = await TreasuryBTC.deploy(
    USDT,
    NXL_TOKEN,
    NEXUM_MANAGER,
    WBTC,
    redeemWindowStart,
    redeemWindowDuration
  );
  await treasuryBTC.waitForDeployment();
  const TREASURY_BTC = await treasuryBTC.getAddress();
  console.log("   ✅ TreasuryBTC:", TREASURY_BTC);
  console.log("   🌱 redeemWindowStart:", redeemWindowStart);
  console.log("   📅 redeemWindowDuration (s):", redeemWindowDuration, "\n");

  // 7) BuybackContract
  console.log("7️⃣  Desplegando BuybackContract...");
  const BuybackContract = await ethers.getContractFactory("BuybackContract");
  const buyback = await BuybackContract.deploy(USDT, NXL_TOKEN);
  await buyback.waitForDeployment();
  const BUYBACK_CONTRACT = await buyback.getAddress();
  console.log("   ✅ BuybackContract:", BUYBACK_CONTRACT, "\n");

  // 8) NexaloStaking
  console.log("8️⃣  Desplegando NexaloStaking...");
  const NexaloStaking = await ethers.getContractFactory("NexaloStaking");
  const staking = await NexaloStaking.deploy(NXL_TOKEN, WBTC);
  await staking.waitForDeployment();
  const STAKING = await staking.getAddress();
  console.log("   ✅ NexaloStaking:", STAKING, "\n");

  // 9) Config ReferralNetwork
  console.log("9️⃣  Configurando ReferralNetwork...");
  const refNet = await ethers.getContractAt("ReferralNetwork", REFERRAL_NETWORK);
  const txRef = await refNet.setNexumManager(NEXUM_MANAGER);
  await txRef.wait();
  console.log("   ✅ ReferralNetwork.setNexumManager()\n");

  // 10) Config NexumManager
  console.log("🔟  Configurando NexumManager...");
  const manager = await ethers.getContractAt("NexumManager", NEXUM_MANAGER);

  const txEco = await manager.setEcosystemAddresses(
    TREASURY_BTC,
    REFERRAL_NETWORK,
    AMBASSADOR_REGISTRY
  );
  await txEco.wait();
  console.log("   ✅ NexumManager.setEcosystemAddresses()");

  // configureNXLTokenTreasury — required before finalizeAutonomy
  const txNxlTreasury = await manager.configureNXLTokenTreasury(TREASURY_BTC);
  await txNxlTreasury.wait();
  console.log("   ✅ NexumManager.configureNXLTokenTreasury()");

  const txFinalize = await manager.finalizeAutonomy();
  await txFinalize.wait();
  console.log("   ✅ NexumManager.finalizeAutonomy()\n");

  // 11) Checks finales
  console.log("1️⃣1️⃣  Verificaciones finales...");

  const nxlRead = await ethers.getContractAt("NXLToken", NXL_TOKEN);

  console.log("   paused:                ", await manager.paused());
  console.log("   globalStopped:         ", await manager.globalStopped());
  console.log("   treasuryBTC:           ", await manager.treasuryBTC());
  console.log("   nxlTreasuryConfigured: ", await manager.nxlTreasuryConfigured());
  console.log("   currentRound(0):       ", (await manager.currentRound(0)).toString());
  console.log("   NXL.treasuryBTC():     ", await nxlRead.treasuryBTC());
  console.log("   NXL.nexumManager():    ", await nxlRead.nexumManager());
  console.log("   pauseGuardian:         ", await manager.pauseGuardian(), "\n");

  // Save addresses
  const fs = require("fs");
  const addresses = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      NXLToken: NXL_TOKEN,
      NexumManager: NEXUM_MANAGER,
      ReferralNetwork: REFERRAL_NETWORK,
      AmbassadorRegistry: AMBASSADOR_REGISTRY,
      TreasuryBTC: TREASURY_BTC,
      BuybackContract: BUYBACK_CONTRACT,
      NexaloStaking: STAKING,
    },
    config: {
      USDT,
      WBTC,
      VRF_COORDINATOR,
      SUBSCRIPTION_ID: subscriptionId.toString(),
      KEY_HASH: VRF_KEY_HASH,
      FOUNDER,
      PARTNER,
      FEES_RECEIVER,
      OPS_SERVICE,
      AUDIT_FUNDS,
      PAUSE_GUARDIAN,
    }
  };
  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("   📝 deployed-addresses.json actualizado\n");

  console.log("==============================================");
  console.log("✅ ECOSISTEMA COMPLETO DESPLEGADO\n");
  console.log("📋 Contratos:");
  console.log("   NXL Token:          ", NXL_TOKEN);
  console.log("   NexumManager:       ", NEXUM_MANAGER);
  console.log("   ReferralNetwork:    ", REFERRAL_NETWORK);
  console.log("   AmbassadorRegistry: ", AMBASSADOR_REGISTRY);
  console.log("   TreasuryBTC:        ", TREASURY_BTC);
  console.log("   BuybackContract:    ", BUYBACK_CONTRACT);
  console.log("   NexaloStaking:      ", STAKING);
  console.log("==============================================\n");

  // === NXL Supply Info ===
  console.log("📊 Distribución NXL (100M total):");
  console.log("   96M → Rewards pool (held by NXLToken contract)");
  console.log("   3M  → Founder (vesting 2 años) → ", FOUNDER);
  console.log("   1M  → Partner (vesting 1 año)  → ", PARTNER);
  console.log("   ⚠️  Ninguna wallet tiene 100M. El contrato NXLToken los custodia.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });