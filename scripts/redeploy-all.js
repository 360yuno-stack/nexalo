const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🔄 REDESPLIEGUE COMPLETO NEXALO");
  console.log("======================================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("📍 Información:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${hre.ethers.formatEther(balance)} BNB\n`);

  const USDT = process.env.USDT_ADDRESS;
  const WBTC = process.env.WBTC_ADDRESS;
  const FOUNDER = process.env.FOUNDER_ADDRESS;
  const PARTNER = process.env.PARTNER_ADDRESS;
  const VRF_COORDINATOR = process.env.VRF_COORDINATOR;
  const SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID;
  const KEY_HASH = process.env.KEY_HASH;

  // 1. Deploy NXLToken con REWARDS_POOL separado
  console.log("1️⃣  Desplegando NXLToken...");
  
  // Crear dirección para REWARDS_POOL (puede ser el deployer por ahora)
  const REWARDS_POOL = deployer.address;
  
  const NXLToken = await hre.ethers.getContractFactory("NXLToken");
  const nxlToken = await NXLToken.deploy(REWARDS_POOL, FOUNDER, PARTNER);
  await nxlToken.waitForDeployment();
  const nxlTokenAddress = await nxlToken.getAddress();
  console.log(`   ✅ ${nxlTokenAddress}\n`);

  // 2. Deploy NexumManager
  console.log("2️⃣  Desplegando NexumManager...");
  const NexumManager = await hre.ethers.getContractFactory("NexumManager");
  const nexumManager = await NexumManager.deploy(
    VRF_COORDINATOR,
    SUBSCRIPTION_ID,
    KEY_HASH,
    USDT,
    nxlTokenAddress,
    FOUNDER,
    PARTNER
  );
  await nexumManager.waitForDeployment();
  const nexumManagerAddress = await nexumManager.getAddress();
  console.log(`   ✅ ${nexumManagerAddress}\n`);

  // 3. Deploy ReferralNetwork
  console.log("3️⃣  Desplegando ReferralNetwork...");
  const ReferralNetwork = await hre.ethers.getContractFactory("ReferralNetwork");
  const referralNetwork = await ReferralNetwork.deploy(USDT);
  await referralNetwork.waitForDeployment();
  const referralNetworkAddress = await referralNetwork.getAddress();
  console.log(`   ✅ ${referralNetworkAddress}\n`);

  // 4. Deploy AmbassadorRegistry
  console.log("4️⃣  Desplegando AmbassadorRegistry...");
  const AmbassadorRegistry = await hre.ethers.getContractFactory("AmbassadorRegistry");
  const ambassadorRegistry = await AmbassadorRegistry.deploy(USDT);
  await ambassadorRegistry.waitForDeployment();
  const ambassadorRegistryAddress = await ambassadorRegistry.getAddress();
  console.log(`   ✅ ${ambassadorRegistryAddress}\n`);

  // 5. Deploy TreasuryBTC
  console.log("5️⃣  Desplegando TreasuryBTC...");
  const TreasuryBTC = await hre.ethers.getContractFactory("TreasuryBTC");
  const treasuryBTC = await TreasuryBTC.deploy(USDT, WBTC);
  await treasuryBTC.waitForDeployment();
  const treasuryBTCAddress = await treasuryBTC.getAddress();
  console.log(`   ✅ ${treasuryBTCAddress}\n`);

  // 6. Deploy BuybackContract
  console.log("6️⃣  Desplegando BuybackContract...");
  const BuybackContract = await hre.ethers.getContractFactory("BuybackContract");
  const buybackContract = await BuybackContract.deploy(USDT, nxlTokenAddress);
  await buybackContract.waitForDeployment();
  const buybackContractAddress = await buybackContract.getAddress();
  console.log(`   ✅ ${buybackContractAddress}\n`);

  // 7. Configurar permisos
  console.log("7️⃣  Configurando permisos...");
  
  // NXLToken: setNexumManager
  await nxlToken.setNexumManager(nexumManagerAddress);
  console.log("   ✅ NexumManager configurado en NXLToken");
  
  // ReferralNetwork: setNexumManager
  await referralNetwork.setNexumManager(nexumManagerAddress);
  console.log("   ✅ NexumManager configurado en ReferralNetwork");
  
  // NexumManager: setEcosystemAddresses
  await nexumManager.setEcosystemAddresses(
    treasuryBTCAddress,
    referralNetworkAddress,
    ambassadorRegistryAddress,
    buybackContractAddress
  );
  console.log("   ✅ Ecosistema configurado en NexumManager\n");

  // 8. Guardar deployment
  const deployment = {
    network: "bscTestnet",
    chainId: "97",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      NXLToken: nxlTokenAddress,
      NexumManager: nexumManagerAddress,
      ReferralNetwork: referralNetworkAddress,
      AmbassadorRegistry: ambassadorRegistryAddress,
      TreasuryBTC: treasuryBTCAddress,
      BuybackContract: buybackContractAddress
    },
    config: {
      USDT: USDT,
      WBTC: WBTC,
      REWARDS_POOL: REWARDS_POOL,
      VRF_COORDINATOR: VRF_COORDINATOR,
      SUBSCRIPTION_ID: SUBSCRIPTION_ID,
      KEY_HASH: KEY_HASH
    }
  };

  fs.writeFileSync("./deployments.json", JSON.stringify(deployment, null, 2));
  console.log("8️⃣  Deployment guardado ✅\n");

  console.log("======================================================================");
  console.log("✅ REDESPLIEGUE COMPLETO EXITOSO");
  console.log("======================================================================\n");

  console.log("📋 Contratos desplegados:\n");
  console.log(`   NXL Token:          ${nxlTokenAddress}`);
  console.log(`   NexumManager:       ${nexumManagerAddress}`);
  console.log(`   ReferralNetwork:    ${referralNetworkAddress}`);
  console.log(`   AmbassadorRegistry: ${ambassadorRegistryAddress}`);
  console.log(`   TreasuryBTC:        ${treasuryBTCAddress}`);
  console.log(`   BuybackContract:    ${buybackContractAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
