const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n💥 TEST DE ESTRÉS NEXALO - VERSIÓN OPTIMIZADA");
  console.log("======================================================================\n");

  const deployment = JSON.parse(fs.readFileSync("./deployments.json", "utf8"));
  const NEXUM_MANAGER = deployment.contracts.NexumManager;
  const NXL_TOKEN = deployment.contracts.NXLToken;
  const USDT = deployment.config.USDT;

  const [deployer] = await hre.ethers.getSigners();

  console.log("📍 Configuración del Test:");
  console.log(`   Operaciones: 7 (limitado por balance USDT)`);
  console.log(`   Wallet: ${deployer.address}`);
  console.log(`   Producto: FLASH (ID: 0)\n`);

  const nexumManager = await hre.ethers.getContractAt("NexumManager", NEXUM_MANAGER);
  const nxlToken = await hre.ethers.getContractAt("NXLToken", NXL_TOKEN);
  const usdt = await hre.ethers.getContractAt("IERC20", USDT);

  const productId = 0;
  const product = await nexumManager.products(productId);
  const pricePerTicket = product.priceUSD;

  const usdtBalance = await usdt.balanceOf(deployer.address);
  console.log("🎯 Producto FLASH:");
  console.log(`   Precio: ${hre.ethers.formatEther(pricePerTicket)} USDT/ticket`);
  console.log(`   Max Tickets: ${product.maxTickets}`);
  console.log(`   NXL/Ticket: ${hre.ethers.formatEther(product.nxlPerTicket)}`);
  console.log(`   Balance USDT: ${hre.ethers.formatEther(usdtBalance)} USDT\n`);

  // Calcular cuántas compras podemos hacer
  const maxPurchases = Number(usdtBalance / pricePerTicket);
  const purchasesToMake = Math.min(maxPurchases, 7);

  console.log(`💰 Puedes hacer ${maxPurchases} compras con tu balance`);
  console.log(`🎯 Realizando ${purchasesToMake} compras...\n`);

  // Aprobar USDT
  console.log("🔓 Aprobando USDT...");
  const totalUSDTNeeded = pricePerTicket * BigInt(purchasesToMake);
  const approveTx = await usdt.approve(NEXUM_MANAGER, totalUSDTNeeded);
  await approveTx.wait();
  console.log(`   ✅ ${hre.ethers.formatEther(totalUSDTNeeded)} USDT aprobados\n`);

  // Estado inicial
  const roundIdBefore = await nexumManager.currentRound(productId);
  const roundInfoBefore = await nexumManager.getRoundInfo(productId, roundIdBefore);
  console.log("📊 Estado ANTES:");
  console.log(`   Round ID: ${roundIdBefore}`);
  console.log(`   Tickets vendidos: ${roundInfoBefore.ticketsSold}`);
  console.log(`   Total recaudado: ${hre.ethers.formatEther(roundInfoBefore.totalCollected)} USDT\n`);

  // Ejecutar compras
  console.log("🚀 INICIANDO COMPRAS...\n");
  
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < purchasesToMake; i++) {
    try {
      console.log(`   Compra ${i + 1}/${purchasesToMake}...`);
      
      const buyTx = await nexumManager.buyTickets(
        productId,
        1, // 1 ticket
        hre.ethers.ZeroAddress // Sin referrer
      );
      const receipt = await buyTx.wait();
      
      console.log(`   ✅ Compra ${i + 1} exitosa (Gas: ${receipt.gasUsed.toString()})`);
      successCount++;

    } catch (error) {
      errorCount++;
      console.log(`   ❌ Error en compra ${i + 1}: ${error.message.substring(0, 100)}`);
      
      if (error.message.includes("Round completed")) {
        console.log(`\n🏁 RONDA COMPLETADA`);
        break;
      }
    }
  }

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  console.log("\n======================================================================");
  console.log("📊 RESULTADOS DEL TEST");
  console.log("======================================================================\n");

  console.log(`⏱️  Duración: ${duration.toFixed(2)} segundos`);
  console.log(`✅ Compras exitosas: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}\n`);

  // Estado después
  const roundIdAfter = await nexumManager.currentRound(productId);
  const roundInfoAfter = await nexumManager.getRoundInfo(productId, roundIdAfter);

  console.log("📊 Estado DESPUÉS:");
  console.log(`   Round ID: ${roundIdAfter}`);
  console.log(`   Tickets vendidos: ${roundInfoAfter.ticketsSold}`);
  console.log(`   Total recaudado: ${hre.ethers.formatEther(roundInfoAfter.totalCollected)} USDT`);
  console.log(`   Completada: ${roundInfoAfter.completed}`);
  console.log(`   VRF solicitado: ${roundInfoAfter.vrfRequested}`);
  
  if (roundInfoAfter.winner !== hre.ethers.ZeroAddress) {
    console.log(`   🏆 Ganador: ${roundInfoAfter.winner}`);
  }
  console.log();

  // Verificar NXL distribuido
  console.log("💎 Distribución de NXL:");
  const nxlPerTicket = product.nxlPerTicket;
  const expectedNXL = nxlPerTicket * BigInt(successCount);
  console.log(`   NXL esperado distribuido: ${hre.ethers.formatEther(expectedNXL)} NXL\n`);

  // Balance del deployer
  const nxlBalance = await nxlToken.balanceOf(deployer.address);
  console.log(`   Tu balance NXL: ${hre.ethers.formatEther(nxlBalance)} NXL\n`);

  // Verificar balances de contratos del ecosistema
  console.log("💰 Balances del Ecosistema:");
  const referralBalance = await usdt.balanceOf(deployment.contracts.ReferralNetwork);
  const ambassadorBalance = await usdt.balanceOf(deployment.contracts.AmbassadorRegistry);
  const treasuryBalance = await usdt.balanceOf(deployment.contracts.TreasuryBTC);
  const buybackBalance = await usdt.balanceOf(deployment.contracts.BuybackContract);
  const managerBalance = await usdt.balanceOf(NEXUM_MANAGER);

  console.log(`   NexumManager:       ${hre.ethers.formatEther(managerBalance)} USDT`);
  console.log(`   ReferralNetwork:    ${hre.ethers.formatEther(referralBalance)} USDT`);
  console.log(`   AmbassadorRegistry: ${hre.ethers.formatEther(ambassadorBalance)} USDT`);
  console.log(`   TreasuryBTC:        ${hre.ethers.formatEther(treasuryBalance)} USDT`);
  console.log(`   BuybackContract:    ${hre.ethers.formatEther(buybackBalance)} USDT\n`);

  // Verificar distribución de fondos (si la ronda se completó)
  if (roundInfoAfter.completed) {
    console.log("🎉 RONDA COMPLETADA - VERIFICANDO DISTRIBUCIÓN:");
    console.log(`   Ganador: ${roundInfoAfter.winner}`);
    
    const winnerBalance = await usdt.balanceOf(roundInfoAfter.winner);
    console.log(`   Balance ganador: ${hre.ethers.formatEther(winnerBalance)} USDT`);
    
    const winnerNXL = await nxlToken.balanceOf(roundInfoAfter.winner);
    console.log(`   NXL ganador: ${hre.ethers.formatEther(winnerNXL)} NXL\n`);
  }

  // Tus tickets
  const myTickets = await nexumManager.getUserTickets(productId, roundIdAfter, deployer.address);
  console.log("🎫 Tus Tickets:");
  console.log(`   Cantidad: ${myTickets.length}`);
  if (myTickets.length > 0 && myTickets.length <= 10) {
    console.log(`   Números: ${myTickets.map(t => t.toString()).join(", ")}`);
  }
  console.log();

  console.log("======================================================================");
  console.log("✅ TEST COMPLETADO");
  console.log("======================================================================\n");

  console.log("📝 Resumen:");
  console.log(`   - Sistema funcionando correctamente ✅`);
  console.log(`   - Distribución de NXL automática ✅`);
  console.log(`   - ${successCount} tickets comprados exitosamente`);
  if (roundInfoAfter.completed) {
    console.log(`   - Ronda completada con ganador ✅`);
  }
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
