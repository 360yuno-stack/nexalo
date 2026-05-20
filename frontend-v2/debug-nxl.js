const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';

const managerAbi = parseAbi([
  "function nxlToken() view returns (address)",
]);

const nxlAbi = parseAbi([
  "function getAvailableRewards() view returns (uint256)",
  "function isAuthorized(address) view returns (bool)",
]);

async function main() {
  try {
    const nxl = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'nxlToken' });
    console.log('NXL Token Address:', nxl);

    const avail = await client.readContract({ address: nxl, abi: nxlAbi, functionName: 'getAvailableRewards' });
    console.log('Available Rewards:', avail);

    const auth = await client.readContract({ address: nxl, abi: nxlAbi, functionName: 'isAuthorized', args: [NEXUM_MANAGER] });
    console.log('Is NexumManager Authorized:', auth);
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
