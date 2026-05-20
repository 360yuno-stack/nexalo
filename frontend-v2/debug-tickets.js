const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';

const managerAbi = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "rounds",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "productId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "roundId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ticketsSold",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "completed",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "vrfRequested",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "vrfRequestId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "vrfRandomWord",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "winner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "winningTicket",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "prizePot",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "instantPot",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  try {
    const r = await client.readContract({ address: NEXUM_MANAGER, abi: managerAbi, functionName: 'rounds', args: [0, 1] });
    console.log('Round 1:', r);
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
