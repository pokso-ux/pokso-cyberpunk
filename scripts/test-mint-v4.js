const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const deployment = JSON.parse(fs.readFileSync('./deployment-v4.json', 'utf8'));
    const minterAddress = deployment.minter.address;
    const lsp8Address = deployment.lsp8.address;
    
    console.log("Testing mint on V4 with metadata...");
    console.log("Minter:", minterAddress);
    console.log("LSP8:", lsp8Address);
    
    const [deployer] = await ethers.getSigners();
    
    // Connect to minter
    const POKSOMinterV2 = await ethers.getContractFactory("POKSOMinterV2");
    const minter = POKSOMinterV2.attach(minterAddress);
    
    // Check current state
    const currentId = await minter.lsp8().then(addr => {
        const lsp8 = new ethers.Contract(addr, ["function currentTokenId() view returns (uint256)"], deployer);
        return lsp8.currentTokenId();
    });
    
    console.log("\nCurrent token ID:", currentId.toString());
    console.log("Mint price:", ethers.utils.formatEther(await minter.mintPrice()), "LYX");
    
    // Mint 1 NFT
    console.log("\n🚀 Minting 1 POKSO NFT...");
    const mintPrice = await minter.mintPrice();
    const tx = await minter.mint({ value: mintPrice, gasLimit: 500000 });
    console.log("Transaction:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Minted! Block:", receipt.blockNumber);
    
    // Check token details
    const newId = await minter.lsp8().then(addr => {
        const lsp8 = new ethers.Contract(addr, ["function currentTokenId() view returns (uint256)"], deployer);
        return lsp8.currentTokenId();
    });
    
    console.log("\nNew token ID:", newId.toString());
    console.log("\n📊 Check on Universal Profile:");
    console.log("https://universaleverything.io/", await minter.lsp8());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
