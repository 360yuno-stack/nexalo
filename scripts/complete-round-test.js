const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🏁 TEST DE RONDA COMPLETA - DISTRIBUCIÓN AUTOMÁTICA");
  console.log("======================================================================\n");

  const deployment = JSON.parse(fs.readFileSync("./deployments.json", "utf8"));
  const NEXUM_MANAGER = deployment.contracts.NexumManager;
  const NXL_TOKEN = deployment.contracts.NXLToken;
  const USDT = deployment.config.USDT;

  const [deployer] = await hre.ethers.getSigners();

  const nexumManager = await hre.ethers.getContractAt("NexumManager", NEXUM_MANAGER);
  const usdt = await hre.ethers.getContractAt("IERC20", USDT);

  const productId = 0; // FLASH
  const product = await nexumManager.products(productId);
  
  console.log("🎯 Producto: FLASH");
  console.log(`   Max Tickets: ${product.maxTickets}`);
  console.log(`   Precio: ${hre.ethers.formatEther(product.priceUSD)} USDT\n`);

  const roundId = await nexumManager.currentRound(productId);
  const roundInfo = await nexumManager.getRoundInfo(productId, roundId);
  
  const ticketsSold = Number(roundInfo.ticketsSold);
  const remaining = Number(product.maxTickets) - ticketsSold;

  console.log("📊 Estado actual:");
  console.log(`   Tickets vendidos: ${ticketsSold}`);
  console.log(`   Tickets restantes: ${remaining}\n`);

  if (remaining === 0) {
    console.log("✅ Ronda ya completada, verificando distribución...\n");
  } else {
    console.log(`⚠️  Faltan ${remaining} tickets para completar la ronda`);
    console.log(`💰 Necesitas ${remaining} USDT para completar\n`);
    
    const usdtBalance = await usdt.balanceOf(deployer.address);
    console.log(`   Tu balance: ${hre.ethers.formatEther(usdtBalance)} USDT\n`);
    
    if (usdtBalance < hre.ethers.parseEther(remaining.toString())) {
      console.log("❌ Balance insuficiente para completar la ronda");
      console.log("\n💡 OPCIONES:");
      console.log("   1. Obtener más USDT testnet");
      console.log("   2. Esperar a que otros usuarios compren");
      console.log("   3. Simular con un producto más pequeño\n");
      return;
    }
  }

  // Verificar balances del ecosistema
  console.log("💰 Balances del Ecosistema ANTES:");
  const referralBalance = await usdt.balanceOf(deployment.contracts.ReferralNetwork);
  const ambassadorBalance = await usdt.balanceOf(deployment.contracts.AmbassadorRegistry);
  const treasuryBalance = await usdt.balanceOf(deployment.contracts.TreasuryBTC);
  const buybackBalance = await usdt.balanceOf(deployment.contracts.BuybackContract);

  console.log(`   ReferralNetwork:    ${hre.ethers.formatEther(referralBalance)} USDT`);
  console.log(`   AmbassadorRegistry: ${hre.ethers.formatEther(ambassadorBalance)} USDT`);
  console.log(`   TreasuryBTC:        ${hre.ethers.formatEther(treasuryBalance)} USDT`);
  console.log(`   BuybackContract:    ${hre.ethers.formatEther(buybackBalance)} USDT\n`);

  if (roundInfo.completed) {
    console.log("🎉 RONDA COMPLETADA");
    console.log(`   🏆 Ganador: ${roundInfo.winner}\n`);
    
    // Verificar distribución
    console.log("💰 Balances del Ecosistema DESPUÉS:");
    const refBalanceAfter = await usdt.balanceOf(deployment.contracts.ReferralNetwork);
    const ambBalanceAfter = await usdt.balanceOf(deployment.contracts.AmbassadorRegistry);
    const treasBalanceAfter = await usdt.balanceOf(deployment.contracts.TreasuryBTC);
    const buyBalanceAfter = await usdt.balanceOf(deployment.contracts.BuybackContract);

    console.log(`   ReferralNetwork:    ${hre.ethers.formatEther(refBalanceAfter)} USDT`);
    console.log(`   AmbassadorRegistry: ${hre.ethers.formatEther(ambBalanceAfter)} USDT`);
    console.log(`   TreasuryBTC:        ${hre.ethers.formatEther(treasBalanceAfter)} USDT`);
    console.log(`   BuybackContract:    ${hre.ethers.formatEther(buyBalanceAfter)} USDT\n`);

    console.log("✅ DISTRIBUCIÓN VERIFICADA");
  }

  console.log("======================================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
