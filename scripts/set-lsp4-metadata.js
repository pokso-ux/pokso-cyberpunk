const { ethers } = require("hardhat");
const fs = require('fs');

// LSP4 Metadata Key (keccak256("LSP4Metadata"))
const LSP4_METADATA_KEY = "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415623f84c3c8b4b075da";

async function main() {
    // Load deployment info
    const deployment = JSON.parse(fs.readFileSync('./deployment-clean.json', 'utf8'));
    const lsp8Address = deployment.lsp8.address;
    
    console.log("Setting LSP4 Metadata for LSP8 contract:", lsp8Address);
    
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    
    // Load LSP8 contract
    const POKSOLSP8Pure = await ethers.getContractFactory("POKSOLSP8Pure");
    const lsp8 = POKSOLSP8Pure.attach(lsp8Address);
    
    // Check current owner
    const owner = await lsp8.owner();
    console.log("Contract owner:", owner);
    console.log("Deployer is owner:", owner.toLowerCase() === deployer.address.toLowerCase());
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("⚠️ Deployer is not owner. Cannot set metadata.");
        console.log("Current owner should call setLSP4Metadata()");
        return;
    }
    
    // Load metadata JSON
    const metadata = JSON.parse(fs.readFileSync('./lsp4-metadata.json', 'utf8'));
    const metadataString = JSON.stringify(metadata);
    
    // Convert to bytes
    const metadataBytes = ethers.utils.toUtf8Bytes(metadataString);
    
    console.log("\nSetting LSP4 Metadata...");
    console.log("Metadata length:", metadataBytes.length, "bytes");
    
    // Set metadata - the contract has setLSP4Metadata function
    const tx = await lsp8.setLSP4Metadata(metadataBytes);
    console.log("Transaction hash:", tx.hash);
    
    await tx.wait();
    console.log("✅ LSP4 Metadata set successfully!");
    
    // Add creator (deployer)
    console.log("\nAdding creator...");
    const tx2 = await lsp8.addCreator(deployer.address);
    await tx2.wait();
    console.log("✅ Creator added:", deployer.address);
    
    // Verify by reading the data
    console.log("\nVerifying LSP4Metadata...");
    const data = await lsp8.getData(LSP4_METADATA_KEY);
    if (data && data !== '0x') {
        const decoded = ethers.utils.toUtf8String(data);
        console.log("✅ LSP4Metadata is set!");
        console.log("Preview:", decoded.substring(0, 200) + "...");
    } else {
        console.log("❌ LSP4Metadata not found");
    }
    
    console.log("\n🎉 Collection is now fully configured for LUKSO explorers!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
