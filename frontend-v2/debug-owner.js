const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NXL_TOKEN = '0x49D76E9F9c7dB89A2ACC91F92ed24E922776F132';

const nxlAbi = parseAbi([
  "function owner() view returns (address)",
  "function authorized(address) view returns (bool)",
]);

async function main() {
  try {
    const o = await client.readContract({ address: NXL_TOKEN, abi: nxlAbi, functionName: 'owner' });
    console.log('NXL Token Owner:', o);
  } catch (e) {
    console.error("Owner error:", e.message);
  }

  try {
    const auth = await client.readContract({ address: NXL_TOKEN, abi: nxlAbi, functionName: 'authorized', args: ['0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5'] });
    console.log('Is NexumManager in authorized mapping:', auth);
  } catch (e) {
    console.error("Authorized error:", e.message);
  }
}
main();
