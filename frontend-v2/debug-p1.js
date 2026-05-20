const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';

const managerAbi = parseAbi([
  "function products(uint256) view returns (string name, uint256 priceUSDE18, uint256 maxTickets, uint256 nxlPerTicket, uint256 nxlWinnerBonus, uint256 jackpotUSDE18, bool active)",
  "function currentRound(uint256) view returns (uint256)",
]);

const managerAbi2 = [
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "rounds",
    "outputs": [
      {"internalType": "uint256", "name": "productId", "type": "uint256"},
      {"internalType": "uint256", "name": "roundId", "type": "uint256"},
      {"internalType": "uint256", "name": "ticketsSold", "type": "uint256"}
    ],
    "stateMutability": "view", "type": "function"
  }
];

async function main() {
  try {
    const p1 = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'products', args: [1] });
    console.log('Product 1:', p1);

    const curRound = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'currentRound', args: [1] });
    console.log('Product 1 Round:', curRound);

    if (p1[6]) { // active
      const r = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi2, functionName: 'rounds', args: [1, curRound] });
      console.log('Product 1 Round Tickets Sold:', r[2]);
    }
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
