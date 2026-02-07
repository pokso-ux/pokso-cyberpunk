const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("========================================");
    console.log("🚀 POKSO LSP8 V4 - Token Metadata Fix");
    console.log("========================================");
    console.log("Deployer:", deployer.address);
    console.log("Network: LUKSO Mainnet");
    console.log("");
    
    // Deploy LSP8 Pure with token metadata support
    console.log("1️⃣ Deploying POKSOLSP8Pure V4...");
    const POKSOLSP8Pure = await ethers.getContractFactory("POKSOLSP8Pure");
    const lsp8 = await POKSOLSP8Pure.deploy(deployer.address);
    await lsp8.deployed();
    console.log("✅ LSP8 V4 deployed:", lsp8.address);
    
    // Deploy Minter V4
    console.log("\n2️⃣ Deploying POKSOMinterV2 V4...");
    const POKSOMinterV2 = await ethers.getContractFactory("POKSOMinterV2");
    const minter = await POKSOMinterV2.deploy(lsp8.address);
    await minter.deployed();
    console.log("✅ Minter V4 deployed:", minter.address);
    
    // Transfer ownership
    console.log("\n3️⃣ Transferring LSP8 ownership to Minter...");
    const tx1 = await lsp8.transferOwnership(minter.address);
    await tx1.wait();
    console.log("✅ Ownership transferred");
    
    // Set LSP4 Metadata
    console.log("\n4️⃣ Setting LSP4 Collection Metadata...");
    const metadata = JSON.parse(fs.readFileSync('./lsp4-metadata.json', 'utf8'));
    const metadataBytes = ethers.utils.toUtf8Bytes(JSON.stringify(metadata));
    const tx2 = await minter.setLSP4Metadata(metadataBytes);
    await tx2.wait();
    console.log("✅ LSP4 Metadata set");
    
    // Add creator
    console.log("\n5️⃣ Adding creator...");
    const tx3 = await minter.addCreator(deployer.address);
    await tx3.wait();
    console.log("✅ Creator added");
    
    // Set Token Metadata Base URI (NEW!)
    console.log("\n6️⃣ Setting Token Metadata Base URI...");
    const baseURI = "https://pokso-ux.github.io/pokso-cyberpunk/nfts/";
    const tx4 = await minter.setTokenMetadataBaseURI(ethers.utils.toUtf8Bytes(baseURI));
    await tx4.wait();
    console.log("✅ Base URI set:", baseURI);
    
    // Verify settings
    console.log("\n7️⃣ Verifying...");
    const storedBaseURI = await minter.getTokenMetadataBaseURI();
    console.log("Base URI stored:", ethers.utils.toUtf8String(storedBaseURI));
    
    // Save deployment
    const deployment = {
        network: "lukso-mainnet",
        chainId: 42,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        lsp8: {
            name: "POKSOLSP8Pure V4",
            address: lsp8.address,
            type: "Pure LSP8 NFT with Token Metadata Support",
            maxSupply: 500
        },
        minter: {
            name: "POKSOMinterV4",
            address: minter.address,
            type: "Payment Handler + Full LSP4/LSP8 Metadata",
            mintPrice: "5 LYX",
            maxPerWallet: 10
        },
        features: {
            lsp4Metadata: true,
            lsp8TokenMetadata: true,  // NEW!
            reentrancyGuard: true,
            batchMint: true,
            refundExcess: true
        }
    };
    
    fs.writeFileSync('./deployment-v4.json', JSON.stringify(deployment, null, 2));
    fs.writeFileSync('./deployment-latest.json', JSON.stringify(deployment, null, 2));
    
    console.log("\n========================================");
    console.log("🎉 V4 DEPLOYMENT COMPLETE!");
    console.log("========================================");
    console.log("LSP8 Contract:", lsp8.address);
    console.log("Minter Contract:", minter.address);
    console.log("");
    console.log("New Features:");
    console.log("  ✅ LSP4 Metadata (collection)");
    console.log("  ✅ LSP8 Token Metadata Base URI (images!)");
    console.log("  ✅ Reentrancy protection");
    console.log("  ✅ Creator registered");
    console.log("");
    console.log("⚠️  UPDATE app.js with:");
    console.log("   NFT_CONTRACT_ADDRESS = '" + minter.address + "'");
    console.log("");
    console.log("Saved to: deployment-v4.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
