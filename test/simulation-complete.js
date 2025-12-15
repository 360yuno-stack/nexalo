const { ethers } = require("hardhat");

async function main() {
    console.log("\n🚀 NEXALO - SIMULACIÓN COMPLETA DE CICLO DE SORTEO");
    console.log("═".repeat(80));

    const [deployer, founder, partner, user1, user2, user3] = await ethers.getSigners();

    console.log("\n📋 CUENTAS:");
    console.log("- Deployer:", deployer.address);
    console.log("- Founder:", founder.address);
    console.log("- Partner:", partner.address);

    console.log("\n" + "═".repeat(80));
    console.log("PASO 1: DESPLEGANDO CONTRATOS");
    console.log("═".repeat(80));

    console.log("\n📦 Desplegando Mock USDT...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdt = await MockERC20.deploy("Test USDT", "USDT", 18);
    await usdt.waitForDeployment();
    await usdt.mint(deployer.address, ethers.parseEther("10000000"));
    console.log("✅ USDT:", await usdt.getAddress());

    console.log("\n📦 Desplegando NXLToken...");
    const NXLToken = await ethers.getContractFactory("NXLToken");
    const nxl = await NXLToken.deploy(founder.address, partner.address);
    await nxl.waitForDeployment();
    console.log("✅ NXL:", await nxl.getAddress());

    console.log("\n📦 Desplegando ReferralNetwork...");
    const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
    const referralNetwork = await ReferralNetwork.deploy(await usdt.getAddress());
    await referralNetwork.waitForDeployment();
    console.log("✅ ReferralNetwork:", await referralNetwork.getAddress());

    console.log("\n📦 Desplegando AmbassadorRegistry...");
    const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
    const ambassadorRegistry = await AmbassadorRegistry.deploy(await usdt.getAddress());
    await ambassadorRegistry.waitForDeployment();
    console.log("✅ AmbassadorRegistry:", await ambassadorRegistry.getAddress());

    console.log("\n📦 Desplegando TreasuryBTC...");
    const TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
    const treasuryBTC = await TreasuryBTC.deploy(
        await usdt.getAddress(),
        await nxl.getAddress(),
        founder.address
    );
    await treasuryBTC.waitForDeployment();
    console.log("✅ TreasuryBTC:", await treasuryBTC.getAddress());

    console.log("\n📦 Desplegando BuybackContract...");
    const BuybackContract = await ethers.getContractFactory("BuybackContract");
    const buybackContract = await BuybackContract.deploy(
        await nxl.getAddress(),
        await usdt.getAddress()
    );
    await buybackContract.waitForDeployment();
    console.log("✅ BuybackContract:", await buybackContract.getAddress());

    console.log("\n📦 Desplegando NexumManager...");
    const NexumManager = await ethers.getContractFactory("NexumManager");
    const nexumManager = await NexumManager.deploy(
        deployer.address,
        1,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        await usdt.getAddress(),
        await nxl.getAddress(),
        founder.address,
        partner.address
    );
    await nexumManager.waitForDeployment();
    console.log("✅ NexumManager:", await nexumManager.getAddress());

    console.log("\n" + "═".repeat(80));
    console.log("PASO 2: CONFIGURANDO SISTEMA");
    console.log("═".repeat(80));

    await nxl.setNexumManager(await nexumManager.getAddress());
    await referralNetwork.setNexumManager(await nexumManager.getAddress());
    await treasuryBTC.setNexumManager(await nexumManager.getAddress());
    await treasuryBTC.setStakingStatus(true);
    await nexumManager.setEcosystemAddresses(
        await treasuryBTC.getAddress(),
        await referralNetwork.getAddress(),
        await ambassadorRegistry.getAddress(),
        await buybackContract.getAddress()
    );
    console.log("✅ Sistema configurado");

    await usdt.transfer(user1.address, ethers.parseEther("100000"));
    await usdt.transfer(user2.address, ethers.parseEther("100000"));
    await usdt.connect(user1).approve(await nexumManager.getAddress(), ethers.parseEther("100000"));
    await usdt.connect(user2).approve(await nexumManager.getAddress(), ethers.parseEther("100000"));
    console.log("✅ USDT distribuido y aprobado");

    console.log("\n" + "═".repeat(80));
    console.log("PASO 3: ESTADO INICIAL");
    console.log("═".repeat(80));

    const tokenInfo = await nxl.getTokenInfo();
    console.log("\n📊 NXL Token:");
    console.log("- Total Supply:", ethers.formatEther(tokenInfo[0]), "NXL");
    console.log("- Available Rewards:", ethers.formatEther(tokenInfo[2]), "NXL");

    const productInfo = await nexumManager.getProductInfo(0);
    console.log("\n📊 Producto FLASH:");
    console.log("- Precio:", ethers.formatEther(productInfo[1]), "USDT");
    console.log("- Max Tickets:", productInfo[2].toString());
    console.log("- NXL/ticket:", ethers.formatEther(productInfo[3]), "NXL");

    console.log("\n" + "═".repeat(80));
    console.log("PASO 4: COMPRANDO TICKETS");
    console.log("═".repeat(80));

    const productId = 0;
    const roundId = await nexumManager.currentRound(productId);
    console.log("\n🎟️  Round:", roundId.toString());

    console.log("\n👤 User1 compra 10 tickets...");
    await nexumManager.connect(user1).buyTickets(productId, 10, ethers.ZeroAddress);
    console.log("✅ 10 tickets comprados");

    console.log("\n⏳ Completando ronda (990 tickets más)...");
    for (let i = 0; i < 99; i++) {
        await nexumManager.connect(user2).buyTickets(productId, 10, ethers.ZeroAddress);
        if ((i + 1) % 20 === 0) {
            console.log(`  Progreso: ${((i + 1) * 10 + 10)}/${1000}`);
        }
    }
    console.log("✅ Ronda completada!");

    const roundInfo = await nexumManager.getRoundInfo(productId, roundId);
    console.log("\n📊 Estado final:");
    console.log("- Tickets vendidos:", roundInfo[0].toString());
    console.log("- Total recolectado:", ethers.formatEther(roundInfo[1]), "USDT");
    console.log("- VRF solicitado:", roundInfo[4]);

    console.log("\n" + "═".repeat(80));
    console.log("RESUMEN FINAL");
    console.log("═".repeat(80));

    console.log("\n💰 BALANCES:");
    console.log("- NexumManager:", ethers.formatEther(await usdt.balanceOf(await nexumManager.getAddress())), "USDT");
    console.log("- TreasuryBTC:", ethers.formatEther(await usdt.balanceOf(await treasuryBTC.getAddress())), "USDT");
    console.log("- Founder:", ethers.formatEther(await usdt.balanceOf(founder.address)), "USDT");

    console.log("\n✅ SIMULACIÓN COMPLETADA");
    console.log("\n⚠️  NOTA: En testnet/mainnet, Chainlink VRF responderá automáticamente");
    console.log("y completará la distribución + iniciará nuevo sorteo");
    console.log("═".repeat(80));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error);
        process.exit(1);
    });
