const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';

const managerAbi = parseAbi([
  "function founder() view returns (address)",
  "function partner() view returns (address)",
  "function feesReceiver() view returns (address)",
  "function operationsService() view returns (address)",
  "function treasuryBTC() view returns (address)",
]);

async function main() {
  try {
    const f = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'founder' });
    const p = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'partner' });
    const fr = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'feesReceiver' });
    const os = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'operationsService' });
    
    console.log({founder: f, partner: p, feesReceiver: fr, operationsService: os});
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
