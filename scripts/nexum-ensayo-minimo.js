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

  const round = await manager.rounds(productId, rid);
  console.log("Round struct:", round);

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

  console.log("---- staticCall buyTickets ----");
  try {
    await manager.buyTickets.staticCall(
      productId,
      5,
      ethers.ZeroAddress,
      { gasLimit: 4_000_000 }
    );
    console.log("staticCall OK (no revert)");
  } catch (e) {
    console.log("staticCall reverted:");
    console.log("reason:", e.reason);
    console.log("shortMessage:", e.shortMessage);
    console.log("message:", e.message);
    console.log("data:", e.data);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});