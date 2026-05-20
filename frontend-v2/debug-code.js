const { createPublicClient, http } = require('viem');
const { bscTestnet } = require('viem/chains');

const client = createPublicClient({
  chain: bscTestnet,
  transport: http()
});

const NXL_TOKEN = '0x49D76E9F9c7dB89A2ACC91F92ed24E922776F132';

async function main() {
  const code = await client.getBytecode({ address: NXL_TOKEN });
  console.log('NXL Token Code Size:', code ? code.length : 0);
}
main();
