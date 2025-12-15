const hre = require("hardhat");

async function main() {
  console.log("\n💰 OBTENIENDO USDT DE TESTNET\n");

  const [deployer] = await hre.ethers.getSigners();
  const USDT_ADDRESS = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

  // ABI del contrato de USDT testnet (tiene función mint pública)
  const USDT_ABI = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address account) view returns (uint256)"
  ];

  const usdt = await hre.ethers.getContractAt(USDT_ABI, USDT_ADDRESS);

  console.log(`Wallet: ${deployer.address}`);
  
  const balanceBefore = await usdt.balanceOf(deployer.address);
  console.log(`Balance USDT antes: ${hre.ethers.formatEther(balanceBefore)}\n`);

  // Mintear 10,000 USDT para el test
  console.log("Minteando 10,000 USDT...");
  const amount = hre.ethers.parseEther("10000");
  
  try {
    const tx = await usdt.mint(deployer.address, amount);
    await tx.wait();
    console.log("✅ USDT minteado exitosamente\n");
  } catch (error) {
    console.log("❌ Este contrato USDT no tiene función mint pública");
    console.log("Usa la Opción 2 (ver abajo)\n");
    return;
  }

  const balanceAfter = await usdt.balanceOf(deployer.address);
  console.log(`Balance USDT después: ${hre.ethers.formatEther(balanceAfter)}`);
  console.log(`\n✅ Ahora puedes ejecutar el stress test\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
