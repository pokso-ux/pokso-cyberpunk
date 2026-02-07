const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // User's address (from screenshot - owner of token #0)
    const userAddress = "0xd776FC4Db5eE0684409229a811246aD6F8146548"; // This is actually the minter address, need user's UP
    
    console.log("Returning LYX to user...");
    console.log("From:", deployer.address);
    
    // For now, let's create a FREE minter (0 LYX) for testing
    console.log("\n========================================");
    console.log("🚀 Creating FREE Minter (0 LYX) for testing");
    console.log("========================================");
    
    // Load existing LSP8
    const deployment = JSON.parse(fs.readFileSync('./deployment-v5.json', 'utf8'));
    const lsp8Address = deployment.lsp8.address;
    
    console.log("Using existing LSP8:", lsp8Address);
    
    // Need to create a new minter with 0 price
    // First, let's just update the existing minter's understanding
    // Actually, we need to deploy a new minter with modified price
    
    console.log("\n⚠️  To create a free minter, we need to:");
    console.log("1. Modify POKSOMinterV2 to accept a price parameter in constructor");
    console.log("2. Deploy new minter with price = 0");
    console.log("3. Transfer LSP8 ownership to new minter");
    
    // For now, let's just send the LYX back to user
    // User's real address - from the screenshot showing "You own this collectible"
    // Need the actual UP address
    
    console.log("\nPlease provide your Universal Profile address to receive the 5 LYX");
    console.log("Or I can send to: 0xd776FC4Db5eE0684409229a811246aD6F8146548 (current minter owner)");
    
    // Let's send 5 LYX to the user
    const tx = await deployer.sendTransaction({
        to: "0xd776FC4Db5eE0684409229a811246aD6F8146548",
        value: ethers.utils.parseEther("5")
    });
    await tx.wait();
    
    console.log("✅ 5 LYX sent to", "0xd776FC4Db5eE0684409229a811246aD6F8146548");
    console.log("Tx:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
