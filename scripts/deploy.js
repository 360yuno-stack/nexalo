const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 DESPLEGANDO ECOSISTEMA NEXALO");
    console.log("=".repeat(70) + "\n");

    // Obtener signer y dirección
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddr = await deployer.getAddress();
    const balance = await hre.ethers.provider.getBalance(deployerAddr);
    
    console.log("📍 Información de Deploy:");
    console.log("   Deployer:", deployerAddr);
    console.log("   Balance:", hre.ethers.formatEther(balance), "BNB");
    console.log("   Network:", hre.network.name);
    console.log("\n");

    // CONFIGURACIÓN - Hardcoded para evitar problemas
    const USDT_ADDRESS = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";
    const WBTC_ADDRESS = "0x8BaBbB98678facC7342735486C851ABD7A0d17Ca";
    const VRF_COORDINATOR_ADDRESS = "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f";
    const VRF_SUBSCRIPTION_ID = 1234;
    const VRF_KEY_HASH = "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314";

    console.log("⚙️  Configuración:");
    console.log("   USDT:", USDT_ADDRESS);
    console.log("   WBTC:", WBTC_ADDRESS);
    console.log("   Deployer:", deployerAddr);
    console.log("   VRF Coordinator:", VRF_COORDINATOR_ADDRESS);
    console.log("   Subscription ID:", VRF_SUBSCRIPTION_ID);
    console.log("   Key Hash:", VRF_KEY_HASH);
    console.log("\n");

    const deployed = {};

    try {
        // 1️⃣ DEPLOY NXL TOKEN
        console.log("1️⃣  Desplegando NXLToken...");
        const NXLToken = await hre.ethers.getContractFactory("NXLToken");
        const nxlToken = await NXLToken.deploy(
            deployerAddr,  // _rewardsPool
            deployerAddr,  // _founder
            deployerAddr   // _partner
        );
        await nxlToken.waitForDeployment();
        deployed.NXLToken = await nxlToken.getAddress();
        console.log("   ✅", deployed.NXLToken, "\n");

        // 2️⃣ DEPLOY NEXUM MANAGER
        console.log("2️⃣  Desplegando NexumManager...");
        const NexumManager = await hre.ethers.getContractFactory("NexumManager");
        const nexumManager = await NexumManager.deploy(
            VRF_COORDINATOR_ADDRESS,   // _vrfCoordinator (address)
            VRF_SUBSCRIPTION_ID,       // _subscriptionId (uint64)
            VRF_KEY_HASH,              // _keyHash (bytes32)
            USDT_ADDRESS,              // _stablecoin (address)
            deployed.NXLToken,         // _nxlToken (address)
            deployerAddr,              // _founder (address)
            deployerAddr               // _partner (address)
        );
        await nexumManager.waitForDeployment();
        deployed.NexumManager = await nexumManager.getAddress();
        console.log("   ✅", deployed.NexumManager, "\n");

        // 3️⃣ TRANSFERIR OWNERSHIP DE NXL A MANAGER
        console.log("3️⃣  Configurando permisos...");
        let tx = await nxlToken.transferOwnership(deployed.NexumManager);
        await tx.wait();
        console.log("   ✅ Ownership de NXL transferido a Manager\n");

        // 4️⃣ GUARDAR DEPLOYMENT
        console.log("4️⃣  Guardando deployment...");
        const deployment = {
            network: hre.network.name,
            chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
            deployer: deployerAddr,
            timestamp: new Date().toISOString(),
            contracts: deployed,
            config: {
                USDT: USDT_ADDRESS,
                WBTC: WBTC_ADDRESS,
                VRF_COORDINATOR: VRF_COORDINATOR_ADDRESS,
                SUBSCRIPTION_ID: VRF_SUBSCRIPTION_ID,
                KEY_HASH: VRF_KEY_HASH
            }
        };

        fs.writeFileSync("deployments.json", JSON.stringify(deployment, null, 2));
        console.log("   ✅ Guardado en deployments.json\n");

        // RESUMEN FINAL
        console.log("=".repeat(70));
        console.log("✅ DEPLOY COMPLETADO EXITOSAMENTE");
        console.log("=".repeat(70) + "\n");
        console.log("📋 Contratos desplegados:\n");
        console.log(`   NXL Token:     ${deployed.NXLToken}`);
        console.log(`   NexumManager:  ${deployed.NexumManager}`);
        console.log("\n📝 Próximos pasos:\n");
        console.log("   1. Actualizar frontend/js/config.js:");
        console.log(`      NXL_TOKEN: '${deployed.NXLToken}'`);
        console.log(`      NEXUM_MANAGER: '${deployed.NexumManager}'`);
        console.log("\n   2. Recargar frontend (http://localhost:8000 + Ctrl+F5)");
        console.log("   3. Conectar wallet y probar compra de tickets");
        console.log("\n" + "=".repeat(70) + "\n");

    } catch (error) {
        console.error("\n❌ ERROR EN DEPLOY:");
        console.error("   Mensaje:", error.message);
        if (error.reason) console.error("   Razón:", error.reason);
        console.error("\n   Stack trace completo:");
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR FATAL:", error.message);
        process.exit(1);
    });
