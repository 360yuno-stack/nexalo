const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("\n🔍 VERIFICANDO CONTRATOS EN BSCSCAN");
  console.log("======================================================================\n");

  const deployment = JSON.parse(fs.readFileSync("./deployments.json", "utf8"));
  const contracts = deployment.contracts;
  const config = deployment.config;

  // NXLToken
  console.log("1️⃣  Verificando NXLToken...");
  try {
    await hre.run("verify:verify", {
      address: contracts.NXLToken,
      constructorArguments: [
        deployment.deployer, // REWARDS_POOL
        config.FOUNDER_ADDRESS || process.env.FOUNDER_ADDRESS,
        config.PARTNER_ADDRESS || process.env.PARTNER_ADDRESS
      ]
    });
    console.log("   ✅ NXLToken verificado\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ Ya estaba verificado\n");
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // NexumManager
  console.log("2️⃣  Verificando NexumManager...");
  try {
    await hre.run("verify:verify", {
      address: contracts.NexumManager,
      constructorArguments: [
        process.env.VRF_COORDINATOR,
        process.env.VRF_SUBSCRIPTION_ID,
        process.env.KEY_HASH,
        config.USDT,
        contracts.NXLToken,
        process.env.FOUNDER_ADDRESS,
        process.env.PARTNER_ADDRESS
      ]
    });
    console.log("   ✅ NexumManager verificado\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ Ya estaba verificado\n");
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // ReferralNetwork
  console.log("3️⃣  Verificando ReferralNetwork...");
  try {
    await hre.run("verify:verify", {
      address: contracts.ReferralNetwork,
      constructorArguments: [config.USDT]
    });
    console.log("   ✅ ReferralNetwork verificado\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ Ya estaba verificado\n");
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // AmbassadorRegistry
  console.log("4️⃣  Verificando AmbassadorRegistry...");
  try {
    await hre.run("verify:verify", {
      address: contracts.AmbassadorRegistry,
      constructorArguments: [config.USDT]
    });
    console.log("   ✅ AmbassadorRegistry verificado\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ Ya estaba verificado\n");
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // TreasuryBTC
  console.log("5️⃣  Verificando TreasuryBTC...");
  try {
    await hre.run("verify:verify", {
      address: contracts.TreasuryBTC,
      constructorArguments: [config.USDT, config.WBTC]
    });
    console.log("   ✅ TreasuryBTC verificado\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ Ya estaba verificado\n");
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // BuybackContract
  console.log("6️⃣  Verificando BuybackContract...");
  try {
    await hre.run("verify:verify", {
      address: contracts.BuybackContract,
      constructorArguments: [config.USDT, contracts.NXLToken]
    });
    console.log("   ✅ BuybackContract verificado\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ Ya estaba verificado\n");
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log("======================================================================");
  console.log("✅ VERIFICACIÓN COMPLETADA");
  console.log("======================================================================\n");
  
  console.log("🔗 Enlaces BSCScan:\n");
  console.log(`NXLToken:          https://testnet.bscscan.com/address/${contracts.NXLToken}#code`);
  console.log(`NexumManager:      https://testnet.bscscan.com/address/${contracts.NexumManager}#code`);
  console.log(`ReferralNetwork:   https://testnet.bscscan.com/address/${contracts.ReferralNetwork}#code`);
  console.log(`AmbassadorRegistry:https://testnet.bscscan.com/address/${contracts.AmbassadorRegistry}#code`);
  console.log(`TreasuryBTC:       https://testnet.bscscan.com/address/${contracts.TreasuryBTC}#code`);
  console.log(`BuybackContract:   https://testnet.bscscan.com/address/${contracts.BuybackContract}#code\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
