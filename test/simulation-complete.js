const { ethers } = require("hardhat");

function fmt(x, d = 18) {
  return d === 18 ? ethers.formatEther(x) : ethers.formatUnits(x, d);
}

describe("NEXALO - Ciclo Completo con Distribuciones", function () {
  it("SIMULACIÓN COMPLETA (versión compatible contratos actuales)", async function () {
    console.log("\n🚀 NEXALO - SIMULACIÓN COMPLETA (versión compatible contratos actuales)");
    console.log("═".repeat(80));

    const [owner, founder, partner, fees, ops, auditFunds, buyer, user2, ref1] = await ethers.getSigners();

    console.log("\n📋 CUENTAS:");
    console.log("- Deployer:", owner.address);
    console.log("- Founder:", founder.address);
    console.log("- Partner:", partner.address);
    console.log("- Fees:", fees.address);
    console.log("- Ops:", ops.address);
    console.log("- AuditFunds:", auditFunds.address);

    console.log("\n" + "═".repeat(80));
    console.log("PASO 1: DESPLEGANDO TOKENS + VRF + MANAGER");
    console.log("═".repeat(80));

    // USDT + WBTC mocks (18 dec para simplificar)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdt = await MockERC20.deploy("Test USDT", "USDT", 18);
    await usdt.waitForDeployment();
    await usdt.mint(owner.address, ethers.parseEther("10000000"));
    console.log("\n✅ USDT:", await usdt.getAddress());

    const wbtc = await MockERC20.deploy("Mock WBTC", "WBTC", 18);
    await wbtc.waitForDeployment();
    await wbtc.mint(owner.address, ethers.parseEther("1000"));
    console.log("✅ WBTC:", await wbtc.getAddress());

    // NXLToken real (constructor: founder, partner)
    const NXLToken = await ethers.getContractFactory("NXLToken");
    const nxl = await NXLToken.deploy(founder.address, partner.address);
    await nxl.waitForDeployment();
    console.log("\n✅ NXL:", await nxl.getAddress());

    // VRF stub
    const VRF = await ethers.getContractFactory("VRFCoordinatorStub");
    const vrf = await VRF.deploy();
    await vrf.waitForDeployment();
    console.log("\n✅ VRF:", await vrf.getAddress());

    // NexumManager (constructor actual):
    // (_vrfCoordinator, _subscriptionId, _keyHash, _stablecoin, _nxlToken, _founder, _partner, _feesReceiver, _operationsService, _auditFunds)
    const keyHash = "0x" + "11".repeat(32);
    const subId = 1;

    const NexumManager = await ethers.getContractFactory("NexumManager");
    const mgr = await NexumManager.deploy(
      await vrf.getAddress(),
      subId,
      keyHash,
      await usdt.getAddress(),
      await nxl.getAddress(),
      founder.address,
      partner.address,
      fees.address,
      ops.address,
      auditFunds.address
    );
    await mgr.waitForDeployment();
    console.log("\n✅ NexumManager:", await mgr.getAddress());

    // set manager in token (one-time)
    console.log("\n🔧 Configurando NXLToken.nexumManager...");
    await nxl.setNexumManager(await mgr.getAddress());
    console.log("✅ NXLToken manager set");

    console.log("\n" + "═".repeat(80));
    console.log("PASO 2: DEPLOY ECOSISTEMA (Referral + Ambassadors + TreasuryBTC)");
    console.log("═".repeat(80));

    const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
    const refNet = await ReferralNetwork.deploy(await usdt.getAddress());
    await refNet.waitForDeployment();
    console.log("\n✅ ReferralNetwork:", await refNet.getAddress());

    const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
    const ambReg = await AmbassadorRegistry.deploy(await usdt.getAddress());
    await ambReg.waitForDeployment();
    console.log("✅ AmbassadorRegistry:", await ambReg.getAddress());

    // TreasuryBTC constructor actual:
    // (_stablecoin, _nxlToken, _nexumManager, _wbtc, _redeemWindowStart, _redeemWindowDuration)
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const redeemWindowStart = now;               // ya empezada en local
    const redeemWindowDuration = 7 * 24 * 3600;  // 7 días

    const TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
    const treasury = await TreasuryBTC.deploy(
      await usdt.getAddress(),
      await nxl.getAddress(),
      await mgr.getAddress(),
      await wbtc.getAddress(),
      redeemWindowStart,
      redeemWindowDuration
    );
    await treasury.waitForDeployment();
    console.log("\n✅ TreasuryBTC:", await treasury.getAddress());

    console.log("\n" + "═".repeat(80));
    console.log("PASO 3: CONFIGURANDO SISTEMA (autonomía)");
    console.log("═".repeat(80));

    // referral: setNexumManager (one-time)
    await refNet.connect(owner).setNexumManager(await mgr.getAddress());

    // NexumManager: set ecosystem addresses + configure NXL treasury + finalize
    await mgr.connect(owner).setEcosystemAddresses(await treasury.getAddress(), await refNet.getAddress(), await ambReg.getAddress());
    await mgr.connect(owner).configureNXLTokenTreasury(await treasury.getAddress());
    await mgr.connect(owner).finalizeAutonomy();
    console.log("✅ Sistema configurado y autonomía finalizada (unpaused + renounce)");

    console.log("\n" + "═".repeat(80));
    console.log("PASO 4: PREPARANDO USDT PARA COMPRAS");
    console.log("═".repeat(80));

    await usdt.transfer(buyer.address, ethers.parseEther("100000"));
    await usdt.transfer(user2.address, ethers.parseEther("100000"));
    await usdt.connect(buyer).approve(await mgr.getAddress(), ethers.parseEther("100000"));
    await usdt.connect(user2).approve(await mgr.getAddress(), ethers.parseEther("100000"));
    console.log("✅ USDT distribuido y aprobado");

    console.log("\n" + "═".repeat(80));
    console.log("PASO 5: ESTADO INICIAL PRODUCTO FLASH");
    console.log("═".repeat(80));

    const p0 = await mgr.products(0);
    console.log("\n📊 Producto FLASH:");
    console.log("- name:", p0.name);
    console.log("- priceUSDE18:", fmt(p0.priceUSDE18), "USD");
    console.log("- maxTickets:", p0.maxTickets.toString());
    console.log("- nxlPerTicket:", fmt(p0.nxlPerTicket), "NXL");
    console.log("- nxlWinnerBonus:", fmt(p0.nxlWinnerBonus), "NXL");
    console.log("- jackpotUSDE18:", fmt(p0.jackpotUSDE18), "USD");
    console.log("- active:", p0.active);

    const productId = 0;
    const roundId = await mgr.currentRound(productId);
    console.log("\n🎟️ Round actual:", roundId.toString());

    console.log("\n" + "═".repeat(80));
    console.log("PASO 6: COMPRANDO TICKETS (llenar 1000)");
    console.log("═".repeat(80));

    console.log("\n👤 Buyer compra 10 tickets (con ref1)...");
    await mgr.connect(buyer).buyTickets(productId, 10, ref1.address);
    console.log("✅ 10 tickets comprados");

    console.log("\n⏳ Completando ronda (990 tickets más con User2)...");
    for (let i = 0; i < 99; i++) {
      await mgr.connect(user2).buyTickets(productId, 10, ethers.ZeroAddress);
      if ((i + 1) % 20 === 0) {
        console.log(`  Progreso: ${((i + 1) * 10 + 10)}/${1000}`);
      }
    }
    console.log("✅ Ronda completada!");

    const r = await mgr.rounds(productId, roundId);
    console.log("\n📊 Estado final del round:");
    console.log("- ticketsSold:", r.ticketsSold.toString());
    console.log("- completed:", r.completed);
    console.log("- vrfRequested:", r.vrfRequested);
    console.log("- vrfRequestId:", r.vrfRequestId.toString());
    console.log("- winner:", r.winner);
    console.log("- winningTicket:", r.winningTicket.toString());
    console.log("- prizePot:", fmt(r.prizePot), "USDT");
    console.log("- instantPot:", fmt(r.instantPot), "USDT");

    console.log("\n" + "═".repeat(80));
    console.log("RESUMEN FINAL (balances y métricas)");
    console.log("═".repeat(80));

    console.log("\n💰 BALANCES USDT:");
    console.log("- Manager:", fmt(await usdt.balanceOf(await mgr.getAddress())), "USDT");
    console.log("- TreasuryBTC:", fmt(await usdt.balanceOf(await treasury.getAddress())), "USDT");
    console.log("- AmbassadorRegistry:", fmt(await usdt.balanceOf(await ambReg.getAddress())), "USDT");
    console.log("- ReferralNetwork:", fmt(await usdt.balanceOf(await refNet.getAddress())), "USDT");
    console.log("- Founder:", fmt(await usdt.balanceOf(founder.address)), "USDT");
    console.log("- Partner:", fmt(await usdt.balanceOf(partner.address)), "USDT");
    console.log("- Fees:", fmt(await usdt.balanceOf(fees.address)), "USDT");
    console.log("- Ops:", fmt(await usdt.balanceOf(ops.address)), "USDT");

    console.log("\n🔎 Estado Referral (ref1):");
    console.log("- claimable:", fmt(await refNet.claimable(ref1.address)), "USDT");

    console.log("\n✅ SIMULACIÓN COMPLETADA");
    console.log("\n⚠️ NOTA: En local, el VRF real no responde solo.");
    console.log("   En testnet/mainnet Chainlink VRF completará el round y arrancará uno nuevo.");
    console.log("═".repeat(80));
  });
});
