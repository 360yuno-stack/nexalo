const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🔧 VERIFICANDO Y CORREGIENDO PERMISOS\n");

  const deployment = JSON.parse(fs.readFileSync("./deployments.json", "utf8"));
  const NXL_TOKEN = deployment.contracts.NXLToken;
  const NEXUM_MANAGER = deployment.contracts.NexumManager;

  const [deployer] = await hre.ethers.getSigners();
  const nxlToken = await hre.ethers.getContractAt("NXLToken", NXL_TOKEN);
  const nexumManager = await hre.ethers.getContractAt("NexumManager", NEXUM_MANAGER);

  console.log("📍 Direcciones:");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   NXLToken: ${NXL_TOKEN}`);
  console.log(`   NexumManager: ${NEXUM_MANAGER}\n`);

  // 1. Verificar owner del NXLToken
  const currentOwner = await nxlToken.owner();
  console.log("1️⃣  Owner actual de NXLToken:");
  console.log(`   ${currentOwner}`);
  
  if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
    console.log("   ⚠️  Owner es deployer (debería ser NexumManager)\n");
    
    console.log("2️⃣  Transfiriendo ownership a NexumManager...");
    const tx = await nxlToken.transferOwnership(NEXUM_MANAGER);
    await tx.wait();
    console.log("   ✅ Ownership transferido\n");
    
  } else if (currentOwner.toLowerCase() === NEXUM_MANAGER.toLowerCase()) {
    console.log("   ✅ Owner correcto (NexumManager)\n");
  } else {
    console.log("   ❌ Owner desconocido\n");
  }

  // 2. Verificar balance de REWARDS_POOL
  const REWARDS_POOL = await nxlToken.REWARDS_POOL();
  const rewardsBalance = await nxlToken.balanceOf(REWARDS_POOL);
  console.log("3️⃣  Balance del REWARDS_POOL:");
  console.log(`   Dirección: ${REWARDS_POOL}`);
  console.log(`   Balance: ${hre.ethers.formatEther(rewardsBalance)} NXL\n`);

  // 3. Verificar si NexumManager está configurado en NXLToken
  try {
    const nexumManagerInToken = await nxlToken.nexumManager();
    console.log("4️⃣  NexumManager configurado en NXLToken:");
    console.log(`   ${nexumManagerInToken}`);
    
    if (nexumManagerInToken === hre.ethers.ZeroAddress) {
      console.log("   ⚠️  No configurado, configurando...\n");
      const setTx = await nxlToken.setNexumManager(NEXUM_MANAGER);
      await setTx.wait();
      console.log("   ✅ NexumManager configurado\n");
    } else if (nexumManagerInToken.toLowerCase() === NEXUM_MANAGER.toLowerCase()) {
      console.log("   ✅ Configurado correctamente\n");
    }
  } catch (error) {
    console.log("   ⚠️  Función setNexumManager no existe en este contrato\n");
  }

  // 4. Verificar estado del producto FLASH
  const product = await nexumManager.products(0);
  console.log("5️⃣  Estado del producto FLASH:");
  console.log(`   Nombre: ${product.name}`);
  console.log(`   Activo: ${product.active}`);
  console.log(`   Precio: ${hre.ethers.formatEther(product.priceUSD)} USDT`);
  console.log(`   NXL/ticket: ${hre.ethers.formatEther(product.nxlPerTicket)} NXL\n`);

  if (!product.active) {
    console.log("   ⚠️  Producto INACTIVO - Necesita reactivarse manualmente\n");
    console.log("   El producto se desactivó porque no pudo distribuir NXL.");
    console.log("   Después de corregir permisos, necesitas redesplegar o");
    console.log("   agregar función para reactivar productos.\n");
  }

  // 5. Verificar owner actual después de cambios
  const finalOwner = await nxlToken.owner();
  console.log("6️⃣  Owner final de NXLToken:");
  console.log(`   ${finalOwner}\n`);

  console.log("======================================================================");
  console.log("✅ VERIFICACIÓN COMPLETADA");
  console.log("======================================================================\n");

  if (finalOwner.toLowerCase() === NEXUM_MANAGER.toLowerCase() && rewardsBalance > 0) {
    console.log("✅ Permisos correctos");
    console.log("⚠️  PERO el producto FLASH está inactivo");
    console.log("\n💡 SOLUCIÓN: Redesplegar NXLToken y NexumManager con permisos correctos\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
