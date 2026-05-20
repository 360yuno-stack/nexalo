const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';

const managerAbi = parseAbi([
  "function paused() view returns (bool)",
  "function globalStopped() view returns (bool)",
]);

async function main() {
  try {
    const paused = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'paused' });
    console.log('Paused:', paused);

    const globalStopped = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'globalStopped' });
    console.log('GlobalStopped:', globalStopped);
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
