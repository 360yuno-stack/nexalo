const { ethers } = require("hardhat");

async function main() {
    // Direcciones sin checksum correcto
    const addresses = {
        NXL_TOKEN: "0x4dF76B1e314ACb8DeE0C019743a050c02B42ceBf",
        NEXUM_MANAGER: "0xCC5BCbE9f59b7bf2F4Fc46d74524870a328aeE51"
    };
    
    console.log("\n🔍 CHECKSUMS CORRECTOS:\n");
    
    for (const [name, addr] of Object.entries(addresses)) {
        const checksummed = ethers.utils.getAddress(addr);
        console.log(`${name}:`);
        console.log(`  Original:  ${addr}`);
        console.log(`  Correcto:  ${checksummed}\n`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
