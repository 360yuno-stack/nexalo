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
  console.log("   AUDIT_FUNDS:    ", AUDIT_FUNDS, "\n");

  // 1) NXLToken
  console.log("1️⃣  Desplegando NXL Token...");
  const NXLTokenFactory = await ethers.getContractFactory("NXLToken");
  const nxlToken = await NXLTokenFactory.deploy(FOUNDER, PARTNER);
  await nxlToken.waitForDeployment();
  const NXL_TOKEN = await nxlToken.getAddress();
  console.log("   ✅ NXL Token:", NXL_TOKEN, "\n");

  // 2) NexumManager
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
    AUDIT_FUNDS
  );
  await nexumManager.waitForDeployment();
  const NEXUM_MANAGER = await nexumManager.getAddress();
  console.log("   ✅ NexumManager:", NEXUM_MANAGER, "\n");

  // 3) ReferralNetwork
  console.log("3️⃣  Desplegando ReferralNetwork...");
  const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
  const referralNetwork = await ReferralNetwork.deploy(USDT);
  await referralNetwork.waitForDeployment();
  const REFERRAL_NETWORK = await referralNetwork.getAddress();
  console.log("   ✅ ReferralNetwork:", REFERRAL_NETWORK, "\n");

  // 4) AmbassadorRegistry
  console.log("4️⃣  Desplegando AmbassadorRegistry...");
  const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
  const ambassadorRegistry = await AmbassadorRegistry.deploy(USDT);
  await ambassadorRegistry.waitForDeployment();
  const AMBASSADOR_REGISTRY = await ambassadorRegistry.getAddress();
  console.log("   ✅ AmbassadorRegistry:", AMBASSADOR_REGISTRY, "\n");

  // 5) TreasuryBTC
  console.log("5️⃣  Desplegando TreasuryBTC...");
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

  // 6) BuybackContract
  console.log("6️⃣  Desplegando BuybackContract...");
  const BuybackContract = await ethers.getContractFactory("BuybackContract");
  const buyback = await BuybackContract.deploy(USDT, NXL_TOKEN);
  await buyback.waitForDeployment();
  const BUYBACK_CONTRACT = await buyback.getAddress();
  console.log("   ✅ BuybackContract:", BUYBACK_CONTRACT, "\n");

  // 7) Config ReferralNetwork
  console.log("7️⃣  Configurando ReferralNetwork...");
  const refNet = await ethers.getContractAt("ReferralNetwork", REFERRAL_NETWORK);
  const txRef = await refNet.setNexumManager(NEXUM_MANAGER);
  await txRef.wait();
  console.log("   ✅ ReferralNetwork.setNexumManager()\n");

  // 8) Config NexumManager
  console.log("8️⃣  Configurando NexumManager...");
  const manager = await ethers.getContractAt("NexumManager", NEXUM_MANAGER);

  const txEco = await manager.setEcosystemAddresses(
    TREASURY_BTC,
    REFERRAL_NETWORK,
    AMBASSADOR_REGISTRY
  );
  await txEco.wait();
  console.log("   ✅ NexumManager.setEcosystemAddresses()");

 

  const txFinalize = await manager.finalizeAutonomy();
  await txFinalize.wait();
  console.log("   ✅ NexumManager.finalizeAutonomy()\n");

   // 9) Checks finales
  console.log("9️⃣  Verificaciones finales...");

  const nxlRead = await ethers.getContractAt("NXLToken", NXL_TOKEN);

  console.log("   paused:                ", await manager.paused());
  console.log("   globalStopped:         ", await manager.globalStopped());
  console.log("   treasuryBTC:           ", await manager.treasuryBTC());
  console.log("   nxlTreasuryConfigured: ", await manager.nxlTreasuryConfigured());
  console.log("   currentRound(0):       ", (await manager.currentRound(0)).toString());
  console.log("   NXL.treasuryBTC():     ", await nxlRead.treasuryBTC(), "\n");

  console.log("==============================================");
  console.log("✅ ECOSISTEMA COMPLETO DESPLEGADO\n");
  console.log("📋 Contratos:");
  console.log("   NXL Token:          ", NXL_TOKEN);
  console.log("   NexumManager:       ", NEXUM_MANAGER);
  console.log("   ReferralNetwork:    ", REFERRAL_NETWORK);
  console.log("   AmbassadorRegistry: ", AMBASSADOR_REGISTRY);
  console.log("   TreasuryBTC:        ", TREASURY_BTC);
  console.log("   BuybackContract:    ", BUYBACK_CONTRACT);
  console.log("==============================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });