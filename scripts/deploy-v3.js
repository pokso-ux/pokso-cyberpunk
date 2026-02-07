const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("========================================");
    console.log("🚀 POKSO LSP8 V3 - Full Quality Deploy");
    console.log("========================================");
    console.log("Deployer:", deployer.address);
    console.log("Network: LUKSO Mainnet");
    console.log("");
    
    // Deploy LSP8 Pure
    console.log("1️⃣ Deploying POKSOLSP8Pure...");
    const POKSOLSP8Pure = await ethers.getContractFactory("POKSOLSP8Pure");
    const lsp8 = await POKSOLSP8Pure.deploy(deployer.address);
    await lsp8.deployed();
    console.log("✅ LSP8 deployed:", lsp8.address);
    
    // Deploy Minter V2 with reentrancy guard + LSP4 support
    console.log("\n2️⃣ Deploying POKSOMinterV2...");
    const POKSOMinterV2 = await ethers.getContractFactory("POKSOMinterV2");
    const minter = await POKSOMinterV2.deploy(lsp8.address);
    await minter.deployed();
    console.log("✅ Minter deployed:", minter.address);
    
    // Transfer ownership
    console.log("\n3️⃣ Transferring LSP8 ownership to Minter...");
    const tx1 = await lsp8.transferOwnership(minter.address);
    await tx1.wait();
    console.log("✅ Ownership transferred");
    
    // Verify ownership
    const newOwner = await lsp8.owner();
    console.log("   New owner:", newOwner);
    console.log("   Correct:", newOwner === minter.address ? "✅" : "❌");
    
    // Set LSP4 Metadata
    console.log("\n4️⃣ Setting LSP4 Metadata...");
    const metadata = JSON.parse(fs.readFileSync('./lsp4-metadata.json', 'utf8'));
    const metadataBytes = ethers.utils.toUtf8Bytes(JSON.stringify(metadata));
    
    const tx2 = await minter.setLSP4Metadata(metadataBytes);
    await tx2.wait();
    console.log("✅ LSP4 Metadata set");
    
    // Add creator
    console.log("\n5️⃣ Adding creator...");
    const tx3 = await minter.addCreator(deployer.address);
    await tx3.wait();
    console.log("✅ Creator added:", deployer.address);
    
    // Verify metadata
    console.log("\n6️⃣ Verifying...");
    const LSP4_METADATA_KEY = "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";
    const data = await lsp8.getData(LSP4_METADATA_KEY);
    if (data && data !== '0x') {
        console.log("✅ LSP4Metadata verified on contract");
    } else {
        console.log("❌ LSP4Metadata not found");
    }
    
    // Save deployment
    const deployment = {
        network: "lukso-mainnet",
        chainId: 42,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        lsp8: {
            name: "POKSOLSP8Pure",
            address: lsp8.address,
            type: "Pure LSP8 NFT with LSP4 Metadata",
            maxSupply: 500
        },
        minter: {
            name: "POKSOMinterV2",
            address: minter.address,
            type: "Payment Handler + LSP4 Support",
            mintPrice: "5 LYX",
            maxPerWallet: 10
        },
        features: {
            lsp4Metadata: true,
            reentrancyGuard: true,
            batchMint: true,
            refundExcess: true
        }
    };
    
    fs.writeFileSync('./deployment-v3.json', JSON.stringify(deployment, null, 2));
    fs.writeFileSync('./deployment-latest.json', JSON.stringify(deployment, null, 2));
    
    console.log("\n========================================");
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("========================================");
    console.log("LSP8 Contract:", lsp8.address);
    console.log("Minter Contract:", minter.address);
    console.log("");
    console.log("Quality Improvements:");
    console.log("  ✅ LSP4 Metadata configured");
    console.log("  ✅ Reentrancy protection");
    console.log("  ✅ Creator registered");
    console.log("  ✅ Clean architecture");
    console.log("");
    console.log("⚠️  UPDATE app.js with:");
    console.log("   NFT_CONTRACT_ADDRESS = '" + minter.address + "'");
    console.log("");
    console.log("Saved to: deployment-v3.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
