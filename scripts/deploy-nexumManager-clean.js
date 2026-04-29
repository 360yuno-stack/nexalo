// DEPLOY SCRIPT: NexumManager (CLEAN REDEPLOY)
// Estructura Round NUEVA: 12 campos (prizePot, instantPot, etc)

const { ethers } = require("hardhat");
require("dotenv").config();
const fs = require("fs");

async function main() {
  console.log("\n ============================================");
  console.log("  DEPLOY: NexumManager (NUEVA ESTRUCTURA)");
  console.log("  Red: BSC Testnet");
  console.log("  Fecha: " + new Date().toISOString());
  console.log("============================================\n");

  console.log(" PASO 1: Validando variables de entorno...\n");

  const requiredEnv = [
    "VRF_COORDINATOR",
    "VRF_SUBSCRIPTION_ID",
    "VRF_KEY_HASH",
    "USDT_ADDRESS",
    "NXL_TOKEN_ADDRESS",
    "FOUNDER_ADDRESS",
    "PARTNER_ADDRESS",
    "FEES_RECEIVER_ADDRESS",
    "OPERATIONS_SERVICE_ADDRESS",
    "AUDIT_FUNDS_ADDRESS",
    "PRIVATE_KEY"
  ];

  for (const envVar of requiredEnv) {
    if (!process.env[envVar]) {
      throw new Error(` VARIABLE NO CONFIGURADA: ${envVar}`);
    }
    console.log(`   ${envVar}`);
  }

  console.log("\n Todas las variables están configuradas\n");

  console.log(" PASO 2: Conectando con deployer...\n");
  
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log(`  Deployer: ${deployerAddress}`);
  
  const balance = await ethers.provider.getBalance(deployerAddress);
  const balanceBNB = ethers.formatEther(balance);
  console.log(`  Balance: ${balanceBNB} BNB`);

  if (parseFloat(balanceBNB) < 0.5) {
    throw new Error(` Balance insuficiente (${balanceBNB} BNB)`);
  }
  
  console.log("   Balance OK\n");

  console.log("  PASO 3: Validando direcciones...\n");

  const addresses = {
    vrfCoordinator: process.env.VRF_COORDINATOR,
    stablecoin: process.env.USDT_ADDRESS,
    nxlToken: process.env.NXL_TOKEN_ADDRESS,
    founder: process.env.FOUNDER_ADDRESS,
    partner: process.env.PARTNER_ADDRESS,
    feesReceiver: process.env.FEES_RECEIVER_ADDRESS,
    operationsService: process.env.OPERATIONS_SERVICE_ADDRESS,
    auditFunds: process.env.AUDIT_FUNDS_ADDRESS,
  };

  for (const [key, addr] of Object.entries(addresses)) {
    if (!ethers.isAddress(addr)) {
      throw new Error(` DIRECCIÓN INVÁLIDA ${key}`);
    }
    console.log(`   ${key}`);
  }

  console.log("");

  console.log(" PASO 4: Verificando contratos...\n");

  try {
    const usdtCode = await ethers.provider.getCode(process.env.USDT_ADDRESS);
    if (usdtCode === "0x") {
      throw new Error(`USDT no deployado`);
    }
    console.log(`   USDT deployado`);

    const nxlCode = await ethers.provider.getCode(process.env.NXL_TOKEN_ADDRESS);
    if (nxlCode === "0x") {
      throw new Error(`NXL no deployado`);
    }
    console.log(`   NXLToken deployado\n`);

  } catch (error) {
    console.error(`   ${error.message}`);
    throw error;
  }

  console.log(" PASO 5: Desplegando NexumManager...\n");

  const NexumManager = await ethers.getContractFactory("NexumManager");
  
  const deployTx = await NexumManager.deploy(
    addresses.vrfCoordinator,
    BigInt(process.env.VRF_SUBSCRIPTION_ID),
    process.env.VRF_KEY_HASH,
    addresses.stablecoin,
    addresses.nxlToken,
    addresses.founder,
    addresses.partner,
    addresses.feesReceiver,
    addresses.operationsService,
    addresses.auditFunds
  );

  console.log(`   TX: ${deployTx.deploymentTransaction().hash}`);
  
  const nexumManager = await deployTx.waitForDeployment();
  const nexumManagerAddress = await nexumManager.getAddress();

  console.log(`   NexumManager: ${nexumManagerAddress}\n`);

  console.log(" PASO 6: Verificando...\n");

  try {
    const code = await ethers.provider.getCode(nexumManagerAddress);
    if (code === "0x") {
      throw new Error("Código no encontrado");
    }
    console.log("   Código en blockchain");

    const roundInfo = await nexumManager.rounds(0, 1);
    console.log(`   rounds() accesible`);
    console.log(`   Estructura: ${Object.keys(roundInfo).length} campos\n`);

  } catch (error) {
    console.error(`    ${error.message}\n`);
  }

  console.log(" PASO 7: Guardando...\n");

  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: "bsctest",
    deployer: deployerAddress,
    nexumManager: nexumManagerAddress,
    deployTx: deployTx.deploymentTransaction().hash
  };

  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments", { recursive: true });
  }
  
  const deploymentFile = `./deployments/nexumManager_${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`   ${deploymentFile}`);

  let deployedAddresses = {};
  if (fs.existsSync("./deployed-addresses.json")) {
    deployedAddresses = JSON.parse(fs.readFileSync("./deployed-addresses.json"));
  }
  deployedAddresses["NexumManager"] = nexumManagerAddress;
  fs.writeFileSync("./deployed-addresses.json", JSON.stringify(deployedAddresses, null, 2));
  console.log(`   deployed-addresses.json\n`);

  console.log(" ============================================");
  console.log("  DEPLOY EXITOSO");
  console.log("============================================\n");

  console.log(" NexumManager: " + nexumManagerAddress);
  console.log("\n PRÓXIMOS PASOS:");
  console.log(`   1. BSCScan: https://testnet.bscscan.com/address/${nexumManagerAddress}`);
  console.log(`   2. Ejecutar pruebas`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n ERROR:", error.message);
    process.exit(1);
  });
