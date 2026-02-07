const { ethers } = require("hardhat");
const fs = require('fs');

// LSP8 Token Metadata Base URI Key
const _LSP8_TOKEN_METADATA_BASE_URI = "0x6de85eaf5d982b4e5da0000000000000000000000000000000000000000000000c7334dc347b6e3a5e7"; // keccak256("LSP8Metadata")

async function main() {
    const deployment = JSON.parse(fs.readFileSync('./deployment-v3.json', 'utf8'));
    const lsp8Address = deployment.lsp8.address;
    const minterAddress = deployment.minter.address;
    
    console.log("Setting LSP8 Token Metadata Base URI...");
    console.log("LSP8:", lsp8Address);
    console.log("Minter:", minterAddress);
    
    const [deployer] = await ethers.getSigners();
    
    // Connect to Minter (which owns LSP8)
    const POKSOMinterV2 = await ethers.getContractFactory("POKSOMinterV2");
    const minter = POKSOMinterV2.attach(minterAddress);
    
    // Check ownership
    const POKSOLSP8Pure = await ethers.getContractFactory("POKSOLSP8Pure");
    const lsp8 = POKSOLSP8Pure.attach(lsp8Address);
    
    const owner = await lsp8.owner();
    console.log("LSP8 Owner:", owner);
    console.log("Minter is owner:", owner.toLowerCase() === minterAddress.toLowerCase());
    
    // We need to add a function to set base URI through the minter
    // For now, let's verify the current state
    
    console.log("\nChecking token #0 metadata...");
    const tokenId = ethers.utils.hexZeroPad("0x0", 32);
    
    // Check if we can read tokenURI
    try {
        const tokenURI = await lsp8.tokenURI(tokenId);
        console.log("Token #0 URI:", tokenURI);
    } catch(e) {
        console.log("tokenURI() error:", e.message);
    }
    
    // Get baseURI
    try {
        const baseURI = await lsp8.getData(_LSP8_TOKEN_METADATA_BASE_URI);
        console.log("Current baseURI:", baseURI);
        if (baseURI === '0x') {
            console.log("❌ No baseURI set!");
        }
    } catch(e) {
        console.log("getData error:", e.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
