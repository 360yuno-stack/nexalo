const hre = require("hardhat");

async function main() {
  const TestUSDT = await hre.ethers.getContractFactory("contracts/TestUSDT.sol:TestUSDT");
  const usdt = await TestUSDT.deploy();

  // En ethers v6 NO hay .deployed(), se espera al receipt:
  const receipt = await usdt.deploymentTransaction().wait();

  console.log("TestUSDT deployed to:", usdt.target);
  console.log("Deployment tx hash:", receipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
