const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';
const USER = '0xA65d959d82DC2cc329950941D8e306347401CeBf';

const managerAbi = parseAbi([
  "function buyTickets(uint256 productId, uint256 quantity, address referrerAddr) external",
]);

async function main() {
  try {
    const { request } = await client.simulateContract({
      address: NEXUM_MANAGER,
      abi: managerAbi,
      functionName: 'buyTickets',
      args: [0, 1, '0x0000000000000000000000000000000000000000'],
      account: USER,
    });
    console.log('Simulation success:', request);
  } catch (e) {
    console.error("Simulation reverted with:", e.message);
  }
}
main();
