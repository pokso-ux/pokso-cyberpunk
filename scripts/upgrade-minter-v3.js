const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    // Load deployment info
    const deployment = JSON.parse(fs.readFileSync('./deployment-clean.json', 'utf8'));
    const lsp8Address = deployment.lsp8.address;
    const oldMinterAddress = deployment.minter.address;
    
    console.log("=== Upgrading Minter with LSP4 Metadata Support ===");
    console.log("LSP8 Address:", lsp8Address);
    console.log("Old Minter:", oldMinterAddress);
    
    // Get signer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    // Load contracts
    const POKSOLSP8Pure = await ethers.getContractFactory("POKSOLSP8Pure");
    const POKSOMinterV2 = await ethers.getContractFactory("POKSOMinterV2");
    
    const lsp8 = POKSOLSP8Pure.attach(lsp8Address);
    
    // Check current ownership
    const currentOwner = await lsp8.owner();
    console.log("\nCurrent LSP8 owner:", currentOwner);
    
    // Deploy new Minter
    console.log("\n🚀 Deploying new POKSOMinterV2...");
    const minter = await POKSOMinterV2.deploy(lsp8Address);
    await minter.deployed();
    console.log("✅ New Minter deployed:", minter.address);
    
    // Transfer LSP8 ownership to new minter
    if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log("\nTransferring LSP8 ownership to new minter...");
        const tx = await lsp8.transferOwnership(minter.address);
        await tx.wait();
        console.log("✅ Ownership transferred");
    } else if (currentOwner.toLowerCase() === oldMinterAddress.toLowerCase()) {
        console.log("\n⚠️ Old Minter is owner. Calling withdraw first...");
        const oldMinter = POKSOMinterV2.attach(oldMinterAddress);
        
        // Withdraw funds from old minter
        try {
            const balance = await ethers.provider.getBalance(oldMinterAddress);
            if (balance > 0) {
                console.log("Withdrawing", ethers.utils.formatEther(balance), "LYX from old minter...");
                const tx = await oldMinter.withdraw();
                await tx.wait();
                console.log("✅ Funds withdrawn");
            }
        } catch(e) {
            console.log("Could not withdraw:", e.message);
        }
        
        // We need to transfer ownership through old minter... but it doesn't have that function
        console.log("❌ Cannot transfer ownership through old minter (no function)");
        console.log("Options:");
        console.log("1. Keep using old minter (no LSP4 metadata)");
        console.log("2. Deploy new LSP8 + Minter from scratch");
        return;
    }
    
    // Update deployment file
    deployment.minter.address = minter.address;
    deployment.minter.note = "Updated with LSP4 metadata support";
    fs.writeFileSync('./deployment-clean.json', JSON.stringify(deployment, null, 2));
    
    // Set LSP4 Metadata
    console.log("\n📝 Setting LSP4 Metadata...");
    const metadata = JSON.parse(fs.readFileSync('./lsp4-metadata.json', 'utf8'));
    const metadataBytes = ethers.utils.toUtf8Bytes(JSON.stringify(metadata));
    
    const tx2 = await minter.setLSP4Metadata(metadataBytes);
    await tx2.wait();
    console.log("✅ LSP4 Metadata set");
    
    // Add creator
    console.log("\n👤 Adding creator...");
    const tx3 = await minter.addCreator(deployer.address);
    await tx3.wait();
    console.log("✅ Creator added:", deployer.address);
    
    // Save updated addresses
    const deploymentInfo = {
        network: "lukso-mainnet",
        chainId: 42,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        lsp8: {
            name: "POKSOLSP8Pure",
            address: lsp8Address,
            type: "Pure LSP8 NFT Contract"
        },
        minter: {
            name: "POKSOMinterV2",
            address: minter.address,
            type: "Payment Handler with LSP4 Support",
            mintPrice: "5 LYX"
        }
    };
    fs.writeFileSync('./deployment-v3.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n========================================");
    console.log("🎉 UPGRADE COMPLETE!");
    console.log("========================================");
    console.log("New Minter:", minter.address);
    console.log("LSP4 Metadata: ✅ Set");
    console.log("Creator: ✅ Added");
    console.log("Reentrancy Guard: ✅ Enabled");
    console.log("\n⚠️ UPDATE app.js with new Minter address!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
