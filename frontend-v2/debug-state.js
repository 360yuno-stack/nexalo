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
  "function products(uint256) view returns (string name, uint256 priceUSDE18, uint256 maxTickets, uint256 nxlPerTicket, uint256 nxlWinnerBonus, uint256 jackpotUSDE18, bool active)",
  "function currentRound(uint256) view returns (uint256)",
  "function rounds(uint256, uint256) view returns (uint256 productId, uint256 roundId, uint256 ticketsSold, bool completed, bool vrfRequested, uint256 vrfRequestId, uint256 vrfRandomWord, address winner, uint256 winningTicket, uint256 prizePot, uint256 instantPot, uint256 liquidityTarget, uint256 liquidityFunded, uint256 liquidityProfitPool, uint256 liquidityReturnedPrincipal, bool liquiditySettled)",
]);

async function main() {
  try {
    const paused = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'paused' });
    console.log('Paused:', paused);

    const globalStopped = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'globalStopped' });
    console.log('GlobalStopped:', globalStopped);
    
    const prod0 = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'products', args: [0] });
    console.log('Product 0:', prod0);

    const curRound = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'currentRound', args: [0] });
    console.log('Current Round Prod 0:', curRound);

    const roundData = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'rounds', args: [0, curRound] });
    console.log('Round Data:', roundData);
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
