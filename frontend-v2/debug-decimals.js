const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';

const managerAbi = parseAbi([
  "function stableDecimals() view returns (uint8)",
]);

async function main() {
  try {
    const d = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'stableDecimals' });
    console.log('Stable Decimals in Manager:', d);
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
