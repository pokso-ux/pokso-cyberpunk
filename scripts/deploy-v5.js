const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("========================================");
    console.log("🚀 POKSO LSP8 V5 - Token Metadata Fix");
    console.log("========================================");
    console.log("Fix: Set LSP4 metadata URL per token at mint time");
    console.log("Deployer:", deployer.address);
    console.log("");
    
    // Deploy LSP8 Pure V5
    console.log("1️⃣ Deploying POKSOLSP8Pure V5...");
    const POKSOLSP8Pure = await ethers.getContractFactory("POKSOLSP8Pure");
    const lsp8 = await POKSOLSP8Pure.deploy(deployer.address);
    await lsp8.deployed();
    console.log("✅ LSP8 V5 deployed:", lsp8.address);
    
    // Deploy Minter V5
    console.log("\n2️⃣ Deploying POKSOMinterV2...");
    const POKSOMinterV2 = await ethers.getContractFactory("POKSOMinterV2");
    const minter = await POKSOMinterV2.deploy(lsp8.address);
    await minter.deployed();
    console.log("✅ Minter deployed:", minter.address);
    
    // Transfer ownership to Minter first (so Minter can mint)
    console.log("\n3️⃣ Transferring LSP8 ownership to Minter...");
    const tx1 = await lsp8.transferOwnership(minter.address);
    await tx1.wait();
    console.log("✅ Ownership transferred");
    
    // Set LSP4 Collection Metadata
    console.log("\n4️⃣ Setting LSP4 Collection Metadata...");
    const metadata = JSON.parse(fs.readFileSync('./lsp4-metadata.json', 'utf8'));
    const metadataBytes = ethers.utils.toUtf8Bytes(JSON.stringify(metadata));
    const tx2 = await minter.setLSP4Metadata(metadataBytes);
    await tx2.wait();
    console.log("✅ LSP4 Collection Metadata set");
    
    // Add creator
    console.log("\n5️⃣ Adding creator...");
    const tx3 = await minter.addCreator(deployer.address);
    await tx3.wait();
    console.log("✅ Creator added");
    
    // Set Token Metadata Base URI (important for the mint function)
    console.log("\n6️⃣ Setting Token Metadata Base URI...");
    const baseURI = "https://pokso-ux.github.io/pokso-cyberpunk/nfts/";
    const tx4 = await minter.setTokenMetadataBaseURI(ethers.utils.toUtf8Bytes(baseURI));
    await tx4.wait();
    console.log("✅ Base URI set:", baseURI);
    
    // Verify settings
    console.log("\n7️⃣ Verifying...");
    const storedBaseURI = await minter.getTokenMetadataBaseURI();
    console.log("Base URI:", ethers.utils.toUtf8String(storedBaseURI));
    
    // Save deployment
    const deployment = {
        network: "lukso-mainnet",
        chainId: 42,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        lsp8: {
            name: "POKSOLSP8Pure V5",
            address: lsp8.address,
            type: "LSP8 with per-token metadata auto-set",
            maxSupply: 500
        },
        minter: {
            name: "POKSOMinterV5",
            address: minter.address,
            type: "Payment Handler with LSP4/LSP8 Metadata",
            mintPrice: "5 LYX",
            maxPerWallet: 10
        },
        features: {
            lsp4Metadata: true,
            lsp8TokenMetadataAutoSet: true,  // NEW!
            reentrancyGuard: true,
            batchMint: true,
            refundExcess: true
        }
    };
    
    fs.writeFileSync('./deployment-v5.json', JSON.stringify(deployment, null, 2));
    fs.writeFileSync('./deployment-latest.json', JSON.stringify(deployment, null, 2));
    
    console.log("\n========================================");
    console.log("🎉 V5 DEPLOYMENT COMPLETE!");
    console.log("========================================");
    console.log("LSP8 Contract:", lsp8.address);
    console.log("Minter Contract:", minter.address);
    console.log("");
    console.log("Key Fix:");
    console.log("  ✅ Each token gets its metadata URL set AT MINT TIME");
    console.log("  ✅ LSP4 Metadata key populated per token");
    console.log("  ✅ Images should now display on explorers!");
    console.log("");
    console.log("⚠️  UPDATE app.js with:");
    console.log("   NFT_CONTRACT_ADDRESS = '" + minter.address + "'");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
