/**
 * NEXALO — Verify all contracts on BSCScan
 * Usage: npx hardhat run scripts/verify-all-contracts.js --network bscTestnet
 */
const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function verify(address, constructorArguments) {
  try {
    await run("verify:verify", { address, constructorArguments });
    console.log(`  ✅ Verified: ${address}`);
  } catch (e) {
    if (e.message.includes("Already Verified")) {
      console.log(`  ℹ️  Already verified: ${address}`);
    } else {
      console.error(`  ❌ Failed: ${address} — ${e.message}`);
    }
  }
}

async function main() {
  const dep = JSON.parse(fs.readFileSync(
    path.join(__dirname, "../deployed-addresses.json"), "utf8"
  ));

  const c = dep.contracts;
  const cfg = dep.config;

  console.log("\nVerifying NEXALO contracts on BSCScan...\n");

  await verify(c.NXLToken, [
    cfg.FOUNDER, cfg.PARTNER, c.NexumManager
  ]);

  await verify(c.NexumManager, [
    cfg.VRF_COORDINATOR, cfg.SUBSCRIPTION_ID, cfg.KEY_HASH,
    cfg.USDT, c.NXLToken,
    cfg.FOUNDER, cfg.PARTNER,
    cfg.FEES_RECEIVER, cfg.OPS_SERVICE,
    cfg.AUDIT_FUNDS, cfg.PAUSE_GUARDIAN
  ]);

  await verify(c.ReferralNetwork, [cfg.USDT]);
  await verify(c.AmbassadorRegistry, [cfg.USDT]);

  const redeemStart = Math.floor(new Date(cfg.REDEEM_WINDOW_START).getTime() / 1000);
  await verify(c.TreasuryBTC, [
    cfg.USDT, c.NXLToken, c.NexumManager,
    cfg.WBTC, redeemStart, 7 * 24 * 3600
  ]);

  await verify(c.NexaloStaking, [c.NXLToken, cfg.WBTC]);
  await verify(c.DonationVault, [cfg.USDT, c.TreasuryBTC]);

  console.log("\n✅ Verification complete");
}

main().catch((e) => { console.error(e); process.exit(1); });
