const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  console.log("\n🚀 DEPLOYING NEXUM MANAGER - AUDIT FIXES EDITION\n");

  try {
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddr = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(deployerAddr);

    console.log(`📍 Red: ${hre.network.name}`);
    console.log(`   Deployer: ${deployerAddr}`);
    console.log(`   Balance: ${hre.ethers.formatEther(balance)} BNB\n`);

    const vrfCoordinator = "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f";
    const subscriptionId = 1234n;
    const keyHash = "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314";
    const usdtAddress = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

    console.log("1️⃣ Desplegando NXL Token...");
    const NXLToken = await hre.ethers.getContractFactory("NXLToken");
    const nxlToken = await NXLToken.deploy(deployerAddr, deployerAddr);
    await nxlToken.waitForDeployment();
    const nxlAddr = await nxlToken.getAddress();
    console.log(`✅ NXL Token: ${nxlAddr}\n`);

    console.log("2️⃣ Desplegando NexumManager...");
    const NexumManager = await hre.ethers.getContractFactory("NexumManager");
    const nexumManager = await NexumManager.deploy(
      vrfCoordinator, subscriptionId, keyHash, usdtAddress, nxlAddr,
      deployerAddr, deployerAddr, deployerAddr, deployerAddr, deployerAddr
    );
    await nexumManager.waitForDeployment();
    const nexumAddr = await nexumManager.getAddress();
    console.log(`✅ NexumManager: ${nexumAddr}\n`);

    console.log("3️⃣ Guardando información...");
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    fs.writeFileSync(
      path.join(deploymentsDir, `deployment-${timestamp}.json`),
      JSON.stringify({
        network: hre.network.name,
        chainId: chainId,
        deployer: deployerAddr,
        timestamp: new Date().toISOString(),
        version: "AUDIT-FIXES",
        contracts: { NXLToken: nxlAddr, NexumManager: nexumAddr }
      }, null, 2)
    );

    const deployedAddressesPath = path.join(__dirname, "../deployed-addresses.json");
    fs.writeFileSync(deployedAddressesPath, JSON.stringify({
      network: hre.network.name,
      deployer: deployerAddr,
      timestamp: new Date().toISOString(),
      version: "AUDIT-FIXES",
      contracts: {
        NXLToken: nxlAddr,
        NexumManager: nexumAddr,
        ReferralNetwork: "0xe1C42cac7a014DDBEDE2f8C14B2F0f7eAD39f59b",
        TreasuryBTC: "0x511feF415454586cF070d6A3309aF5cd1c1bB7B5",
        AmbassadorRegistry: "0x3213A167b064F35d071FD4f7D064bC5d1a6789d0",
        NXLBuyback: "0x879B142d7b2dC03d5F02c9e674D1f4b6b88df727",
        NexaloStaking: "0xaAF206584Af59C105Df88e1664e7834b58A910F4",
        DonationVault: "0x568d75B14F346F3C07427eAD98E40E9a5B93920C"
      },
      config: {
        VRF_COORDINATOR: vrfCoordinator,
        SUBSCRIPTION_ID: "1234",
        KEY_HASH: keyHash,
        USDT: usdtAddress
      }
    }, null, 2));

    console.log(`✅ Guardado en deployed-addresses.json\n`);
    console.log("═".repeat(80));
    console.log("✅ DEPLOYMENT COMPLETADO EXITOSAMENTE\n");
    console.log(`📝 NXL Token: ${nxlAddr}`);
    console.log(`📝 NexumManager: ${nexumAddr}\n`);
    console.log("═".repeat(80) + "\n");

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
