const hre = require("hardhat");
const { ethers } = hre;
const { parseUnits, ZeroAddress } = require("ethers");

async function main() {
  const {
    STABLE_TOKEN,
    NXL_TOKEN,
    VRF_COORDINATOR,
    VRF_SUB_ID,
    VRF_KEY_HASH,
    FOUNDER,
    PARTNER,
    FEES_RECEIVER,
    OPS_SERVICE,
    AUDIT_FUNDS,
    TREASURY_BTC,
    REFERRAL_NETWORK,
    AMBASSADOR_REGISTRY,
    INVESTOR,          // <-- NUEVO: opcional en .env para el inversor
  } = process.env;

  if (!STABLE_TOKEN || !NXL_TOKEN || !VRF_COORDINATOR || !VRF_SUB_ID || !VRF_KEY_HASH) {
    throw new Error("Faltan vars en .env (STABLE_TOKEN, NXL_TOKEN, VRF_COORDINATOR, VRF_SUB_ID, VRF_KEY_HASH)");
  }
  if (!FOUNDER || !PARTNER || !FEES_RECEIVER || !OPS_SERVICE || !AUDIT_FUNDS) {
    throw new Error("Faltan FOUNDER/PARTNER/FEES_RECEIVER/OPS_SERVICE/AUDIT_FUNDS en .env");
  }
  if (!TREASURY_BTC || !REFERRAL_NETWORK || !AMBASSADOR_REGISTRY) {
    throw new Error("Faltan TREASURY_BTC/REFERRAL_NETWORK/AMBASSADOR_REGISTRY en .env");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  console.log("VRF_COORDINATOR:", VRF_COORDINATOR);
  console.log("VRF_SUB_ID:", VRF_SUB_ID);
  console.log("VRF_KEY_HASH:", VRF_KEY_HASH);
  console.log("STABLE_TOKEN:", STABLE_TOKEN);
  console.log("NXL_TOKEN:", NXL_TOKEN);
  console.log("FOUNDER:", FOUNDER);
  console.log("PARTNER:", PARTNER);
  console.log("FEES_RECEIVER:", FEES_RECEIVER);
  console.log("OPS_SERVICE:", OPS_SERVICE);
  console.log("AUDIT_FUNDS:", AUDIT_FUNDS);
  console.log("TREASURY_BTC:", TREASURY_BTC);
  console.log("REFERRAL_NETWORK:", REFERRAL_NETWORK);
  console.log("AMBASSADOR_REGISTRY:", AMBASSADOR_REGISTRY);
  console.log("INVESTOR (env):", INVESTOR || "(no definido, usaremos deployer)");

  const Manager = await ethers.getContractFactory("NexumManager");
  const manager = await Manager.deploy(
    VRF_COORDINATOR,
    BigInt(VRF_SUB_ID),
    VRF_KEY_HASH,
    STABLE_TOKEN,
    NXL_TOKEN,
    FOUNDER,
    PARTNER,
    FEES_RECEIVER,
    OPS_SERVICE,
    AUDIT_FUNDS
  );

  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log("NexumManager deployed at:", managerAddress);

  // Configurar ecosistema
  const tx1 = await manager.setEcosystemAddresses(
    TREASURY_BTC,
    REFERRAL_NETWORK,
    AMBASSADOR_REGISTRY
  );
  await tx1.wait();
  console.log("Ecosystem addresses set");

  // Configurar investor para probar el 3 %
  const investorAddress = INVESTOR && INVESTOR !== "" ? INVESTOR : deployer.address;
  const txInvestor = await manager.setInvestor(investorAddress);
  await txInvestor.wait();
  console.log("Investor set to:", investorAddress);

  // Despausar (modo test local)
  const tx3 = await manager.emergencyUnpause();
  await tx3.wait();
  console.log("Manager unpaused");

  // Aprobar stable hacia el manager
  const stable = await ethers.getContractAt("IERC20", STABLE_TOKEN);
  const approveTx = await stable.approve(managerAddress, parseUnits("10000", 18));
  await approveTx.wait();
  console.log("Approved stable to manager");

  try {
    await manager.buyTickets.staticCall(0, 3, ZeroAddress);
    console.log("staticCall buyTickets(0,3) OK, enviando tx real...");

    const buyTx = await manager.buyTickets(0, 3, ZeroAddress);
    const receipt = await buyTx.wait();
    console.log("FLASH buyTickets(0,3) gasUsed:", receipt.gasUsed.toString());

    const currentRoundFlash = await manager.currentRound(0);
    const roundFlash = await manager.rounds(0, currentRoundFlash);
    console.log("FLASH round:", currentRoundFlash.toString());
    console.log("FLASH ticketsSold:", roundFlash.ticketsSold.toString());
    console.log("FLASH prizePot:", roundFlash.prizePot.toString());
    console.log("FLASH instantPot:", roundFlash.instantPot.toString());

    console.log("OK: deploy + config + setInvestor + compra FLASH completados.");
  } catch (err) {
    console.error("buyTickets(0,3) reverted en staticCall, detalle:\n", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
