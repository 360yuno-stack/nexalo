// scripts/deploy_manager_only.js
const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const { ethers } = hre;
  const { isAddress } = require("ethers");

  console.log("\n🚀 REDEPLOY SOLO NexumManager");
  console.log("====================================\n");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📍 Deployer:", deployer.address);
  console.log("💰 Balance (wei):", balance.toString());
  console.log("🌐 Network:", hre.network.name, "\n");

  // === ENV BASE ===
  const USDT = process.env.STABLE_TOKEN || process.env.USDT_ADDRESS;
  const NXL_TOKEN = process.env.NXL_TOKEN;
  const TREASURY_BTC = process.env.TREASURY_BTC || process.env.TREASURY_BTC_ADDRESS;
  const REFERRAL_NETWORK = process.env.REFERRAL_NETWORK || process.env.REFERRAL_NETWORK_ADDRESS;
  const AMBASSADOR_REGISTRY = process.env.AMBASSADOR_REGISTRY || process.env.AMBASSADOR_REGISTRY_ADDRESS;

  const FOUNDER = process.env.FOUNDER || process.env.FOUNDER_ADDRESS;
  const PARTNER = process.env.PARTNER || process.env.PARTNER_ADDRESS;
  const VRF_COORDINATOR = process.env.VRF_COORDINATOR;
  const VRF_KEY_HASH = process.env.VRF_KEY_HASH;
  const FEES_RECEIVER = process.env.FEES_RECEIVER || FOUNDER;
  const OPS_SERVICE = process.env.OPS_SERVICE || FOUNDER;
  const AUDIT_FUNDS = process.env.AUDIT_FUNDS || FOUNDER;
  const subscriptionId = BigInt(process.env.VRF_SUB_ID || process.env.VRF_SUBSCRIPTION_ID || "0");

  // Validaciones rápidas
  if (!USDT || !isAddress(USDT)) throw new Error(`STABLE_TOKEN / USDT_ADDRESS inválido: "${USDT}"`);
  if (!NXL_TOKEN || !isAddress(NXL_TOKEN)) throw new Error(`NXL_TOKEN inválido: "${NXL_TOKEN}"`);
  if (!TREASURY_BTC || !isAddress(TREASURY_BTC)) throw new Error(`TREASURY_BTC inválido: "${TREASURY_BTC}"`);
  if (!REFERRAL_NETWORK || !isAddress(REFERRAL_NETWORK)) throw new Error(`REFERRAL_NETWORK inválido: "${REFERRAL_NETWORK}"`);
  if (!AMBASSADOR_REGISTRY || !isAddress(AMBASSADOR_REGISTRY)) throw new Error(`AMBASSADOR_REGISTRY inválido: "${AMBASSADOR_REGISTRY}"`);
  if (!FOUNDER || !isAddress(FOUNDER)) throw new Error(`FOUNDER inválido: "${FOUNDER}"`);
  if (!PARTNER || !isAddress(PARTNER)) throw new Error(`PARTNER inválido: "${PARTNER}"`);
  if (!VRF_COORDINATOR || !isAddress(VRF_COORDINATOR)) throw new Error(`VRF_COORDINATOR inválido: "${VRF_COORDINATOR}"`);
  if (!VRF_KEY_HASH || !/^0x[0-9a-fA-F]{64}$/.test(VRF_KEY_HASH)) throw new Error(`VRF_KEY_HASH inválido: "${VRF_KEY_HASH}"`);
  if (!FEES_RECEIVER || !isAddress(FEES_RECEIVER)) throw new Error(`FEES_RECEIVER inválido: "${FEES_RECEIVER}"`);
  if (!OPS_SERVICE || !isAddress(OPS_SERVICE)) throw new Error(`OPS_SERVICE inválido: "${OPS_SERVICE}"`);
  if (!AUDIT_FUNDS || !isAddress(AUDIT_FUNDS)) throw new Error(`AUDIT_FUNDS inválido: "${AUDIT_FUNDS}"`);
  if (!subscriptionId) throw new Error(`VRF_SUB_ID inválido: "${process.env.VRF_SUB_ID}"`);

  console.log("⚙️  Configuración .env para redeploy:");
  console.log(" STABLE / USDT:      ", USDT);
  console.log(" NXL_TOKEN:          ", NXL_TOKEN);
  console.log(" TREASURY_BTC:       ", TREASURY_BTC);
  console.log(" REFERRAL_NETWORK:   ", REFERRAL_NETWORK);
  console.log(" AMBASSADOR_REGISTRY:", AMBASSADOR_REGISTRY);
  console.log(" Founder:            ", FOUNDER);
  console.log(" Partner:            ", PARTNER);
  console.log(" VRF_COORDINATOR:    ", VRF_COORDINATOR);
  console.log(" VRF_SUB_ID:         ", subscriptionId.toString());
  console.log(" VRF_KEY_HASH:       ", VRF_KEY_HASH);
  console.log(" FEES_RECEIVER:      ", FEES_RECEIVER);
  console.log(" OPS_SERVICE:        ", OPS_SERVICE);
  console.log(" AUDIT_FUNDS:        ", AUDIT_FUNDS, "\n");

  // 1) Redeploy NexumManager
  console.log("1️⃣ Desplegando NUEVO NexumManager...");
  const NexumManagerFactory = await ethers.getContractFactory("NexumManager");
  const newManager = await NexumManagerFactory.deploy(
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
  await newManager.waitForDeployment();
  const NEW_MANAGER = await newManager.getAddress();
  console.log(" ✅ Nuevo NexumManager:", NEW_MANAGER, "\n");

  // 2) Reconfigurar ReferralNetwork
  console.log("2️⃣ Configurando ReferralNetwork con nuevo manager...");
  const refNet = await ethers.getContractAt("ReferralNetwork", REFERRAL_NETWORK);
  const txRef = await refNet.setNexumManager(NEW_MANAGER);
  await txRef.wait();
  console.log(" ✅ ReferralNetwork.setNexumManager()\n");

  // 3) Configurar ecosistema del nuevo manager
  console.log("3️⃣ Configurando ecosistema en nuevo NexumManager...");
  const manager = await ethers.getContractAt("NexumManager", NEW_MANAGER);

  const txEco = await manager.setEcosystemAddresses(
    TREASURY_BTC,
    REFERRAL_NETWORK,
    AMBASSADOR_REGISTRY
  );
  await txEco.wait();
  console.log(" ✅ NexumManager.setEcosystemAddresses()");

  const txFinalize = await manager.finalizeAutonomy();
  await txFinalize.wait();
  console.log(" ✅ NexumManager.finalizeAutonomy()\n");

  // 4) Checks finales
  console.log("4️⃣ Verificaciones finales...");
  console.log(" paused:            ", await manager.paused());
  console.log(" globalStopped:     ", await manager.globalStopped());
  console.log(" treasuryBTC:       ", await manager.treasuryBTC());
  console.log(" nxlTreasuryConfigured:", await manager.nxlTreasuryConfigured());
  console.log(" currentRound(0):   ", (await manager.currentRound(0)).toString(), "\n");

  console.log("====================================");
  console.log("✅ REDEPLOY SOLO NexumManager COMPLETADO\n");
  console.log("Nuevo NexumManager:", NEW_MANAGER);
  console.log("====================================\n");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });