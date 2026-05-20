const { createPublicClient, http, parseAbi } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NEXUM_MANAGER = '0x6BC5AeED2Da2080A1cDcDF71020ef14cE1f9eAe5';
const USER = '0xA65d959d82DC2cc329950941D8e306347401CeBf';
const USDT_OLD = '0xBd43EC0740B034dEDD5Cf7700c34DDDe9863e503';
const USDT_NEW = '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd';

const erc20Abi = parseAbi([
  "function allowance(address, address) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
]);

async function main() {
  try {
    const balOld = await client.readContract({ address: USDT_OLD, abi: erc20Abi, functionName: 'balanceOf', args: [USER] });
    console.log('Old USDT Balance:', balOld);

    const balNew = await client.readContract({ address: USDT_NEW, abi: erc20Abi, functionName: 'balanceOf', args: [USER] });
    console.log('New USDT Balance:', balNew);
    
    const allowNew = await client.readContract({ address: USDT_NEW, abi: erc20Abi, functionName: 'allowance', args: [USER, NEXUM_MANAGER] });
    console.log('New USDT Allowance:', allowNew);
  } catch (e) {
    console.error("Script error", e);
  }
}
main();
