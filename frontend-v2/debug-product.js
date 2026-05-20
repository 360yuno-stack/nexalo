const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';

const managerAbi = parseAbi([
  "function products(uint256) view returns (string name, uint256 priceUSDE18, uint256 maxTickets, uint256 nxlPerTicket, uint256 nxlWinnerBonus, uint256 jackpotUSDE18, bool active)",
]);

async function main() {
  try {
    const prod0 = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'products', args: [0] });
    console.log('Product 0:', prod0);
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
