const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🚀 DESPLEGANDO ECOSISTEMA NEXALO COMPLETO");
  console.log("======================================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("📍 Información de Deploy:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${hre.ethers.formatEther(balance)} BNB`);
  console.log(`   Network: ${hre.network.name}\n`);

  const USDT = process.env.USDT_ADDRESS;
  const WBTC = process.env.WBTC_ADDRESS;
  const FOUNDER = process.env.FOUNDER_ADDRESS;
  const PARTNER = process.env.PARTNER_ADDRESS;

  console.log("⚙️  Configuración:");
  console.log(`   USDT: ${USDT}`);
  console.log(`   WBTC: ${WBTC}`);
  console.log(`   Founder: ${FOUNDER}`);
  console.log(`   Partner: ${PARTNER}\n`);

  // Cargar deployment anterior
  const deploymentPath = "./deployments.json";
  let deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const NXL_TOKEN = deployment.contracts.NXLToken;
  const NEXUM_MANAGER = deployment.contracts.NexumManager;

  console.log("📦 Contratos existentes:");
  console.log(`   NXL Token: ${NXL_TOKEN}`);
  console.log(`   NexumManager: ${NEXUM_MANAGER}\n`);

  // 1. Deploy ReferralNetwork
  console.log("1️⃣  Desplegando ReferralNetwork...");
  const ReferralNetwork = await hre.ethers.getContractFactory("ReferralNetwork");
  const referralNetwork = await ReferralNetwork.deploy(USDT);
  await referralNetwork.waitForDeployment();
  const referralNetworkAddress = await referralNetwork.getAddress();
  console.log(`   ✅ ${referralNetworkAddress}\n`);

  // 2. Deploy AmbassadorRegistry
  console.log("2️⃣  Desplegando AmbassadorRegistry...");
  const AmbassadorRegistry = await hre.ethers.getContractFactory("AmbassadorRegistry");
  const ambassadorRegistry = await AmbassadorRegistry.deploy(USDT);
  await ambassadorRegistry.waitForDeployment();
  const ambassadorRegistryAddress = await ambassadorRegistry.getAddress();
  console.log(`   ✅ ${ambassadorRegistryAddress}\n`);

  // 3. Deploy TreasuryBTC
  console.log("3️⃣  Desplegando TreasuryBTC...");
  const TreasuryBTC = await hre.ethers.getContractFactory("TreasuryBTC");
  const treasuryBTC = await TreasuryBTC.deploy(USDT, WBTC);
  await treasuryBTC.waitForDeployment();
  const treasuryBTCAddress = await treasuryBTC.getAddress();
  console.log(`   ✅ ${treasuryBTCAddress}\n`);

  // 4. Deploy BuybackContract
  console.log("4️⃣  Desplegando BuybackContract...");
  const BuybackContract = await hre.ethers.getContractFactory("BuybackContract");
  const buybackContract = await BuybackContract.deploy(USDT, NXL_TOKEN);
  await buybackContract.waitForDeployment();
  const buybackContractAddress = await buybackContract.getAddress();
  console.log(`   ✅ ${buybackContractAddress}\n`);

  // 5. Configurar permisos
  console.log("5️⃣  Configurando permisos...");
  
  const refNet = await hre.ethers.getContractAt("ReferralNetwork", referralNetworkAddress);
  await refNet.setNexumManager(NEXUM_MANAGER);
  console.log("   ✅ ReferralNetwork configurado\n");

  // 6. Configurar NexumManager con direcciones del ecosistema
  console.log("6️⃣  Configurando NexumManager...");
  const nexumManager = await hre.ethers.getContractAt("NexumManager", NEXUM_MANAGER);
  
  const tx = await nexumManager.setEcosystemAddresses(
    treasuryBTCAddress,
    referralNetworkAddress,
    ambassadorRegistryAddress,
    buybackContractAddress
  );
  await tx.wait();
  console.log("   ✅ Ecosistema configurado en NexumManager\n");

  // 7. Guardar deployment actualizado
  deployment.contracts = {
    ...deployment.contracts,
    ReferralNetwork: referralNetworkAddress,
    AmbassadorRegistry: ambassadorRegistryAddress,
    TreasuryBTC: treasuryBTCAddress,
    BuybackContract: buybackContractAddress
  };
  deployment.timestamp = new Date().toISOString();

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("7️⃣  Deployment guardado ✅\n");

  console.log("======================================================================");
  console.log("✅ ECOSISTEMA COMPLETO DESPLEGADO");
  console.log("======================================================================\n");

  console.log("📋 Contratos desplegados:\n");
  console.log(`   NXL Token:          ${NXL_TOKEN}`);
  console.log(`   NexumManager:       ${NEXUM_MANAGER}`);
  console.log(`   ReferralNetwork:    ${referralNetworkAddress}`);
  console.log(`   AmbassadorRegistry: ${ambassadorRegistryAddress}`);
  console.log(`   TreasuryBTC:        ${treasuryBTCAddress}`);
  console.log(`   BuybackContract:    ${buybackContractAddress}\n`);

  console.log("📝 Próximos pasos:\n");
  console.log("   1. Actualizar frontend/js/config.js");
  console.log("   2. Ejecutar test de estrés");
  console.log("   3. Verificar distribución de fondos\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
