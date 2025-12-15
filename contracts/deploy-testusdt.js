const hre = require("hardhat");

async function main() {
  const TestUSDT = await hre.ethers.getContractFactory("TestUSDT");
  const usdt = await TestUSDT.deploy();
  await usdt.deployed();
  console.log("TestUSDT deployed to:", usdt.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
