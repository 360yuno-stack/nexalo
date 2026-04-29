const { ethers } = require("hardhat");

async function main() {
  const manager = await ethers.getContractAt(
    "NexumManager",
    "0xCEB1c73C63cC0dD5220f31fbaB2c536B56C41069"
  );

  console.log("target:", await manager.getAddress());
  console.log("has buyTickets:", typeof manager.buyTickets);
  console.log("has currentRound:", typeof manager.currentRound);

  console.log(
    "buyTickets fragment:",
    manager.interface.getFunction("buyTickets").format()
  );

  const data = manager.interface.encodeFunctionData("buyTickets", [
    0,
    5,
    ethers.ZeroAddress
  ]);

  console.log("encoded data:", data);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});