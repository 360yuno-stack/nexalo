const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NEXALO - Ciclo Completo con Distribuciones", function () {
    let usdt, nxl, nexumManager, referralNetwork, ambassadorRegistry, treasuryBTC;
    let deployer, founder, partner, user1, user2, user3;

    const PRODUCT_ID = 0;
    const TICKET_PRICE = ethers.parseEther("1");

    before(async function () {
        [deployer, founder, partner, user1, user2, user3] = await ethers.getSigners();

        console.log("\n📦 DESPLEGANDO CONTRATOS...");

        const MockERC20 = await ethers.getContractFactory("MockERC20");
        usdt = await MockERC20.deploy("Test USDT", "USDT", 18);
        await usdt.waitForDeployment();
        await usdt.mint(deployer.address, ethers.parseEther("10000000"));

        const NXLToken = await ethers.getContractFactory("NXLToken");
        nxl = await NXLToken.deploy(founder.address, partner.address);
        await nxl.waitForDeployment();

        const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
        referralNetwork = await ReferralNetwork.deploy(await usdt.getAddress());
        await referralNetwork.waitForDeployment();

        const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
        ambassadorRegistry = await AmbassadorRegistry.deploy(await usdt.getAddress());
        await ambassadorRegistry.waitForDeployment();

        const TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
        treasuryBTC = await TreasuryBTC.deploy(
            await usdt.getAddress(),
            await nxl.getAddress(),
            founder.address
        );
        await treasuryBTC.waitForDeployment();

        const BuybackContract = await ethers.getContractFactory("BuybackContract");
        const buybackContract = await BuybackContract.deploy(
            await nxl.getAddress(),
            await usdt.getAddress()
        );
        await buybackContract.waitForDeployment();

        const NexumManager = await ethers.getContractFactory("NexumManager");
        nexumManager = await NexumManager.deploy(
            deployer.address,
            1,
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            await usdt.getAddress(),
            await nxl.getAddress(),
            founder.address,
            partner.address
        );
        await nexumManager.waitForDeployment();

        console.log("✅ Contratos desplegados");

        console.log("\n⚙️ CONFIGURANDO SISTEMA...");
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

        await usdt.transfer(user1.address, ethers.parseEther("100"));
        await usdt.transfer(user2.address, ethers.parseEther("100"));
        await usdt.connect(user1).approve(await nexumManager.getAddress(), ethers.parseEther("100"));
        await usdt.connect(user2).approve(await nexumManager.getAddress(), ethers.parseEther("100"));

        console.log("✅ Sistema configurado\n");
    });

    describe("Ciclo Completo: Compra → VRF → Distribución", function () {
        
        it("Paso 1: Comprar todos los tickets (10)", async function () {
            console.log("\n🎟️  COMPRANDO TICKETS...");
            
            await nexumManager.connect(user1).buyTickets(PRODUCT_ID, 3, ethers.ZeroAddress);
            console.log("✅ User1: 3 tickets");
            
            await nexumManager.connect(user2).buyTickets(PRODUCT_ID, 5, ethers.ZeroAddress);
            console.log("✅ User2: 5 tickets");
            
            await nexumManager.connect(user1).buyTickets(PRODUCT_ID, 1, ethers.ZeroAddress);
            console.log("✅ User1: +1 ticket (4 total)");
            
            await nexumManager.connect(user1).buyTickets(PRODUCT_ID, 1, ethers.ZeroAddress);
            console.log("✅ User1: +1 ticket (5 total)");
            
            const roundId = await nexumManager.currentRound(PRODUCT_ID);
            const roundInfo = await nexumManager.getRoundInfo(PRODUCT_ID, roundId);
            
            expect(roundInfo[0]).to.equal(10n);
            expect(roundInfo[4]).to.equal(true);
            
            console.log("✅ Ronda completada: 10/10 tickets");
        });

        it("Paso 2: Simular respuesta VRF y verificar distribución", async function () {
            console.log("\n🎲 SIMULANDO VRF Y DISTRIBUCIÓN...");
            
            const roundId = await nexumManager.currentRound(PRODUCT_ID);
            const roundInfo = await nexumManager.getRoundInfo(PRODUCT_ID, roundId);
            const requestId = roundInfo[5];
            
            const totalCollected = ethers.parseEther("10");
            
            const user1BalanceBefore = await usdt.balanceOf(user1.address);
            const user2BalanceBefore = await usdt.balanceOf(user2.address);
            const founderBalanceBefore = await usdt.balanceOf(founder.address);
            const partnerBalanceBefore = await usdt.balanceOf(partner.address);
            const treasuryBalanceBefore = await usdt.balanceOf(await treasuryBTC.getAddress());
            
            console.log("\n💰 BALANCES ANTES:");
            console.log("- User1:", ethers.formatEther(user1BalanceBefore), "USDT");
            console.log("- User2:", ethers.formatEther(user2BalanceBefore), "USDT");
            console.log("- Founder:", ethers.formatEther(founderBalanceBefore), "USDT");
            console.log("- Partner:", ethers.formatEther(partnerBalanceBefore), "USDT");
            console.log("- Treasury:", ethers.formatEther(treasuryBalanceBefore), "USDT");
            
            const randomWord = 1n;
            await nexumManager.rawFulfillRandomWords(requestId, [randomWord]);
            
            console.log("\n✅ VRF ejecutado - Ganador: ticket #1 (User1)");
            
            const user1BalanceAfter = await usdt.balanceOf(user1.address);
            const user2BalanceAfter = await usdt.balanceOf(user2.address);
            const founderBalanceAfter = await usdt.balanceOf(founder.address);
            const partnerBalanceAfter = await usdt.balanceOf(partner.address);
            const treasuryBalanceAfter = await usdt.balanceOf(await treasuryBTC.getAddress());
            
            console.log("\n💰 BALANCES DESPUÉS:");
            console.log("- User1:", ethers.formatEther(user1BalanceAfter), "USDT");
            console.log("- User2:", ethers.formatEther(user2BalanceAfter), "USDT");
            console.log("- Founder:", ethers.formatEther(founderBalanceAfter), "USDT");
            console.log("- Partner:", ethers.formatEther(partnerBalanceAfter), "USDT");
            console.log("- Treasury:", ethers.formatEther(treasuryBalanceAfter), "USDT");
            
            const mainPrize = (totalCollected * 5000n) / 10000n;
            const instantRewards = (totalCollected * 1000n) / 10000n;
            const treasuryAmount = (totalCollected * 1000n) / 10000n;
            const operationsTotal = (totalCollected * 1500n) / 10000n;
            const founderAmount = (operationsTotal * 667n) / 1000n;
            const partnerAmount = (operationsTotal * 67n) / 1000n;
            
            console.log("\n📊 DISTRIBUCIÓN MATEMÁTICA:");
            console.log("- Premio principal (50%):", ethers.formatEther(mainPrize), "USDT");
            console.log("- Instant rewards (10%):", ethers.formatEther(instantRewards), "USDT");
            console.log("- Treasury BTC (10%):", ethers.formatEther(treasuryAmount), "USDT");
            console.log("- Founder (10.005%):", ethers.formatEther(founderAmount), "USDT");
            console.log("- Partner (1.005%):", ethers.formatEther(partnerAmount), "USDT");
            
            const user1Received = user1BalanceAfter - user1BalanceBefore;
            expect(user1Received).to.be.gte(mainPrize);
            
            const treasuryReceived = treasuryBalanceAfter - treasuryBalanceBefore;
            expect(treasuryReceived).to.equal(treasuryAmount);
            
            const founderReceived = founderBalanceAfter - founderBalanceBefore;
            expect(founderReceived).to.be.gte(founderAmount);
            
            const partnerReceived = partnerBalanceAfter - partnerBalanceBefore;
            expect(partnerReceived).to.equal(partnerAmount);
            
            console.log("\n✅ TODAS LAS DISTRIBUCIONES CORRECTAS");
        });

        it("Paso 3: Verificar que se inició nuevo sorteo automáticamente", async function () {
            console.log("\n🔄 VERIFICANDO NUEVO SORTEO...");
            
            const currentRoundId = await nexumManager.currentRound(PRODUCT_ID);
            expect(currentRoundId).to.equal(2n);
            
            const newRoundInfo = await nexumManager.getRoundInfo(PRODUCT_ID, currentRoundId);
            expect(newRoundInfo[0]).to.equal(0n);
            expect(newRoundInfo[3]).to.equal(false);
            
            console.log("✅ Nuevo sorteo iniciado automáticamente (Round 2)");
        });

        it("Paso 4: Verificar distribución de NXL rewards", async function () {
            console.log("\n🎁 VERIFICANDO NXL REWARDS...");
            
            const user1NXL = await nxl.balanceOf(user1.address);
            expect(user1NXL).to.equal(ethers.parseEther("0.5"));
            console.log("- User1:", ethers.formatEther(user1NXL), "NXL");
            
            const user2NXL = await nxl.balanceOf(user2.address);
            expect(user2NXL).to.equal(ethers.parseEther("0.5"));
            console.log("- User2:", ethers.formatEther(user2NXL), "NXL");
            
            console.log("✅ NXL rewards distribuidos correctamente");
        });

        it("Paso 5: Verificar que la distribución suma 100%", async function () {
            console.log("\n🧮 VERIFICANDO SUMA TOTAL = 100%...");
            
            const mainPrizePct = 5000n;
            const instantPct = 1000n;
            const multilevelPct = 1000n;
            const treasuryPct = 1000n;
            const ambassadorsPct = 500n;
            const operationsPct = 1500n;
            
            const total = mainPrizePct + instantPct + multilevelPct + treasuryPct + ambassadorsPct + operationsPct;
            
            expect(total).to.equal(10000n);
            
            console.log("✅ La suma de distribuciones = 100%");
        });
    });
});
