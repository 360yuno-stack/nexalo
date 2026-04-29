const { ethers } = require("hardhat");

async function main() {
  const productId = 0;
  const [signer] = await ethers.getSigners();

  console.log("Signer:", signer.address);

  const manager = await ethers.getContractAt(
    "NexumManager",
    "0x44bAfFc465Ff72f3907D32Ea18fE14275d88D76E"
  );

  const rid = await manager.currentRound(productId);
  console.log("Current round:", rid.toString());

  try {
    const tx = await manager.buyTickets(
      productId,
      5,
      ethers.ZeroAddress,
      { gasLimit: 4_000_000 }
    );

    console.log("tx hash:", tx.hash);

    const rc = await tx.wait();
    console.log("receipt status:", rc.status);
    console.log("receipt hash:", rc.hash);
  } catch (e) {
    console.log("buyTickets reverted in script:");
    console.log("reason:", e.reason ?? null);
    console.log("shortMessage:", e.shortMessage ?? null);
    console.log("message:", e.message ?? null);
    console.log("data:", e.data ?? null);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});