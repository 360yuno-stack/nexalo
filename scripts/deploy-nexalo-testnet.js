const { ethers } = require("hardhat");

const NXL_ADDRESS = "0x86f63A3F2ea35354CF4A5A2543edb7234c86f106"; // NXLToken ya desplegado en testnet

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Using existing NXLToken:", NXL_ADDRESS);

  // 1) ReferralNetwork (establecoin = USDT_ADDRESS)
  const ReferralNetwork = await ethers.getContractFactory("ReferralNetwork");
  const referral = await ReferralNetwork.deploy(process.env.USDT_ADDRESS);
  await referral.waitForDeployment();
  const referralAddress = await referral.getAddress();
  console.log("ReferralNetwork:", referralAddress);

  // 2) TreasuryBTC (stablecoin, NXL, founder)
  const TreasuryBTC = await ethers.getContractFactory("TreasuryBTC");
  const treasury = await TreasuryBTC.deploy(
  process.env.USDT_ADDRESS,
  NXL_ADDRESS,
  process.env.FOUNDER_ADDRESS
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("TreasuryBTC:", treasuryAddress);

  // 3) AmbassadorRegistry (establecoin = USDT_ADDRESS)
const AmbassadorRegistry = await ethers.getContractFactory("AmbassadorRegistry");
const ambassadors = await AmbassadorRegistry.deploy(process.env.USDT_ADDRESS);
await ambassadors.waitForDeployment();
const ambassadorsAddress = await ambassadors.getAddress();
console.log("AmbassadorRegistry:", ambassadorsAddress);

  // 4) BuybackContract (stablecoin, NXL)
const BuybackContract = await ethers.getContractFactory("BuybackContract");
const buyback = await BuybackContract.deploy(
  process.env.USDT_ADDRESS,
  NXL_ADDRESS
);
await buyback.waitForDeployment();
const buybackAddress = await buyback.getAddress();
console.log("BuybackContract:", buybackAddress);

  // 5) NexaloStaking (NXL + WBTC)
  const NexaloStaking = await ethers.getContractFactory("NexaloStaking");
  const staking = await NexaloStaking.deploy(NXL_ADDRESS, process.env.WBTC_ADDRESS);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("NexaloStaking:", stakingAddress);

  // 6) NexumManager
  const NexumManager = await ethers.getContractFactory("NexumManager");
  const manager = await NexumManager.deploy(
    process.env.VRF_COORDINATOR,
    Number(process.env.VRF_SUBSCRIPTION_ID),
    process.env.KEY_HASH,
    process.env.USDT_ADDRESS,
    NXL_ADDRESS,
    process.env.FOUNDER_ADDRESS,
    process.env.PARTNER_ADDRESS
  );
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log("NexumManager:", managerAddress);

  // 7) Configuración post-deploy
  const nxl = await ethers.getContractAt("NXLToken", NXL_ADDRESS);
  await (await nxl.setNexumManager(managerAddress)).wait();
  console.log("NXLToken: NexumManager set");

  await (await referral.setNexumManager(managerAddress)).wait();
  console.log("ReferralNetwork: NexumManager set");

  await (await manager.setEcosystemAddresses(
    treasuryAddress,
    referralAddress,
    ambassadorsAddress,
    buybackAddress
  )).wait();
  console.log("NexumManager: ecosystem addresses set");

  console.log("NexaloStaking:", stakingAddress);
  console.log("NexumManager:", managerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
