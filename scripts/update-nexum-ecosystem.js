const hre = require("hardhat");
require("dotenv").config();

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(color, icon, message) {
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

async function main() {
  log(colors.cyan, "🚀", "ACTUALIZANDO CONFIGURACIÓN NEXUM MANAGER V2.5");
  console.log("═".repeat(80));
  console.log("");

  try {
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddr = await deployer.getAddress();

    // DIRECCIONES EXISTENTES DEL PROYECTO
    const NEXUM_MANAGER_ADDRESS = "0xCC5BCbE9f59b7bf2F4Fc46d74524870a328aeE51";
    const TREASURY_BTC = "0x511feF415454586cF070d6A3309aF5cd1c1bB7B5";
    const REFERRAL_NETWORK = "0xe1C42cac7a014DDBEDE2f8C14B2F0f7eAD39f59b";
    const AMBASSADOR_REGISTRY = "0x3213A167b064F35d071FD4f7D064bC5d1a6789d0";
    const BUYBACK_CONTRACT = "0x879B142d7b2dC03d5F02c9e674D1f4b6b88df727";

    log(colors.blue, "📍", "INFORMACIÓN");
    console.log(`  Red: ${hre.network.name}`);
    console.log(`  Deployer: ${deployerAddr}`);
    console.log(`  NexumManager: ${NEXUM_MANAGER_ADDRESS}`);
    console.log("");

    // ==================== CONECTAR A CONTRATO ====================
    log(colors.yellow, "1️⃣", "CONECTANDO A NEXUM MANAGER");
    const NexumManager = await hre.ethers.getContractFactory("NexumManager");
    const nexumManager = NexumManager.attach(NEXUM_MANAGER_ADDRESS);
    log(colors.green, "✅", "Conectado a NexumManager");
    console.log("");

    // ==================== VERIFICAR ESTADO ====================
    log(colors.yellow, "2️⃣", "VERIFICANDO ESTADO ACTUAL");
    
    try {
      const currentTreasuryBTC = await nexumManager.treasuryBTC();
      console.log(`  Treasury BTC actual: ${currentTreasuryBTC}`);
      console.log(`  Treasury BTC nuevo:  ${TREASURY_BTC}`);
    } catch (e) {
      log(colors.yellow, "⚠️", "No se pudo leer treasuryBTC (posiblemente no configurado)");
    }
    console.log("");

    // ==================== CONFIGURAR DIRECCIONES DEL ECOSISTEMA ====================
    log(colors.yellow, "3️⃣", "CONFIGURANDO DIRECCIONES DEL ECOSISTEMA");
    
    console.log("  Parámetros a configurar:");
    console.log(`    Treasury BTC: ${TREASURY_BTC}`);
    console.log(`    Referral Network: ${REFERRAL_NETWORK}`);
    console.log(`    Ambassador Registry: ${AMBASSADOR_REGISTRY}`);
    console.log(`    Buyback Contract: ${BUYBACK_CONTRACT}`);
    console.log("");

    const tx = await nexumManager.setEcosystemAddresses(
      TREASURY_BTC,
      REFERRAL_NETWORK,
      AMBASSADOR_REGISTRY,
      BUYBACK_CONTRACT
    );

    log(colors.yellow, "⏳", `Esperando confirmación (tx: ${tx.hash})`);
    const receipt = await tx.wait(1);
    log(colors.green, "✅", `Transacción confirmada en bloque: ${receipt.blockNumber}`);
    console.log("");

    // ==================== VERIFICAR CONFIGURACIÓN ====================
    log(colors.yellow, "4️⃣", "VERIFICANDO CONFIGURACIÓN");
    
    const treasuryBTC = await nexumManager.treasuryBTC();
    const referralNetwork = await nexumManager.referralNetwork();
    const ambassadorRegistry = await nexumManager.ambassadorRegistry();
    const buybackContract = await nexumManager.buybackContract();

    console.log("  Configuración guardada:");
    console.log(`    ✅ Treasury BTC: ${treasuryBTC}`);
    console.log(`    ✅ Referral Network: ${referralNetwork}`);
    console.log(`    ✅ Ambassador Registry: ${ambassadorRegistry}`);
    console.log(`    ✅ Buyback Contract: ${buybackContract}`);
    console.log("");

    // ==================== VERIFICAR PAUSED STATE ====================
    log(colors.yellow, "5️⃣", "VERIFICANDO ESTADO DE CONTRATO");
    const paused = await nexumManager.paused();
    console.log(`  Estado del contrato: ${paused ? "PAUSADO ⏸️" : "ACTIVO ✅"}`);
    console.log("");

    // ==================== INFORMACIÓN DE PRODUCTOS ====================
    log(colors.yellow, "6️⃣", "INFORMACIÓN DE PRODUCTOS");
    
    const productNames = ["FLASH", "ORIGINAL", "PREMIUM", "ELITE", "VIP", "BLACKBLOK"];
    for (let i = 0; i < 6; i++) {
      try {
        const productInfo = await nexumManager.getProductInfo(i);
        console.log(`  ${i + 1}. ${productNames[i]}:`);
        console.log(`     Precio: ${hre.ethers.formatEther(productInfo.priceUSD)} USD`);
        console.log(`     Tickets: ${productInfo.maxTickets}`);
        console.log(`     Activo: ${productInfo.active ? "✅" : "❌"}`);
      } catch (e) {
        console.log(`  ${i + 1}. ${productNames[i]}: Error al obtener info`);
      }
    }
    console.log("");

    // ==================== RESUMEN FINAL ====================
    console.log("═".repeat(80));
    log(colors.green, "✅", "ACTUALIZACIÓN COMPLETADA EXITOSAMENTE");
    console.log("═".repeat(80));
    console.log("");

    log(colors.cyan, "🔗", "PRÓXIMOS PASOS:");
    console.log("  1. Verificar en explorador de bloques:");
    console.log(`     https://testnet.bscscan.com/address/${NEXUM_MANAGER_ADDRESS}`);
    console.log("");
    console.log("  2. Probar compra de tickets:");
    console.log("     - Conectar wallet a frontend");
    console.log("     - Probar con producto FLASH (más barato)");
    console.log("     - Verificar que VRF funciona correctamente");
    console.log("");
    console.log("  3. Para mainnet:");
    console.log("     - Cambiar NEXUM_MANAGER_ADDRESS a dirección de mainnet");
    console.log("     - Ejecutar: npx hardhat run scripts/update-nexum-ecosystem.js --network bsc");
    console.log("");
    console.log("═".repeat(80) + "\n");

  } catch (error) {
    console.log("");
    log(colors.red, "❌", "ERROR EN ACTUALIZACIÓN");
    console.log(`  Mensaje: ${error.message}`);
    if (error.reason) console.log(`  Razón: ${error.reason}`);
    console.log("");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ ERROR FATAL:", error);
    process.exit(1);
  });
