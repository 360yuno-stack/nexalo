const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NXL_TOKEN = '0x49D76E9F9c7dB89A2ACC91F92ed24E922776F132';

const nxlAbi = parseAbi([
  "function nexumManager() view returns (address)",
]);

async function main() {
  try {
    const m = await client.readContract({ address: NXL_TOKEN, abi: nxlAbi, functionName: 'nexumManager' });
    console.log('NXL Token Manager:', m);
  } catch (e) {
    console.error("Manager error:", e.message);
  }
}
main();
