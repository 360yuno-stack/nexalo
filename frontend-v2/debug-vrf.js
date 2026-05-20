const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';

const managerAbi = parseAbi([
  "function vrfCoordinator() view returns (address)",
  "function subscriptionId() view returns (uint64)",
]);

const vrfAbi = parseAbi([
  "function getSubscription(uint64) view returns (uint96 balance, uint64 reqCount, address owner, address[] consumers)",
]);

async function main() {
  try {
    const vrf = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'vrfCoordinator' });
    const sub = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'subscriptionId' });
    console.log('VRF Coordinator:', vrf);
    console.log('Subscription ID:', sub);

    const subData = await client.readContract({ address: vrf, abi: vrfAbi, functionName: 'getSubscription', args: [sub] });
    console.log('Subscription Data:', subData);
  } catch (e) {
    console.error("VRF error", e.message);
  }
}
main();
