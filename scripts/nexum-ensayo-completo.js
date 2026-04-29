const { ethers } = require("hardhat");

async function main() {
  const productId = 0;

  const [signer] = await ethers.getSigners();
  const me = signer.address;
  console.log("Signer:", me);

  const manager = await ethers.getContractAt(
    "NexumManager",
    "0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5"
  );

  const ridBN = await manager.currentRound(productId);
  const rid = Number(ridBN);
  console.log("Current round:", rid);

  let round = await manager.rounds(productId, rid);
  console.log("Round struct before:", round);

  const stableAddress = await manager.stablecoin();
  console.log("Stablecoin:", stableAddress);

  const usdt = await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
    stableAddress
  );

  const balance = await usdt.balanceOf(me);
  const allowance = await usdt.allowance(me, await manager.getAddress());
  console.log("Stable balance:", balance.toString());
  console.log("Stable allowance:", allowance.toString());

  // Si hace falta, haz approve aquí (ajusta cantidad y decimales según tu estable)
  if (allowance === 0n) {
    console.log("Doing approve...");
    const decimals = await usdt.decimals();
    const amount = ethers.parseUnits("1000", decimals);
    const txApprove = await usdt.approve(await manager.getAddress(), amount);
    const rcApprove = await txApprove.wait();
    console.log("Approve tx:", rcApprove.hash);
  }

  // Vuelve a leer allowance
  const allowance2 = await usdt.allowance(me, await manager.getAddress());
  console.log("Stable allowance after:", allowance2.toString());

  // Compra de prueba
  try {
    const tx = await manager.buyTickets(
      productId,
      5,
      ethers.ZeroAddress,
      { gasLimit: 4_000_000 }
    );
    const rc = await tx.wait();
    console.log("buyTickets tx:", rc.hash);
  } catch (e) {
    console.log("buyTickets reverted:", e.reason ?? e.shortMessage ?? e.message);
    return;
  }

  round = await manager.rounds(productId, rid);
  console.log("Round struct after:", round);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});