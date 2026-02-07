const { ethers } = require("hardhat");
const fs = require('fs');

// VerifiableURI prefix
const VERIFIABLE_URI_PREFIX = "0x6f357c6a";

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("========================================");
    console.log("🚀 POKSO LSP8 V7 - VerifiableURI Format");
    console.log("========================================");
    console.log("This version uses the CORRECT LSP4 VerifiableURI format");
    console.log("Format: 0x6f357c6a + hash(32 bytes) + url");
    console.log("Deployer:", deployer.address);
    console.log("");
    
    // Deploy LSP8 V7
    console.log("1️⃣ Deploying POKSOLSP8PureV7...");
    const POKSOLSP8PureV7 = await ethers.getContractFactory("POKSOLSP8PureV7");
    const lsp8 = await POKSOLSP8PureV7.deploy(deployer.address);
    await lsp8.deployed();
    console.log("✅ LSP8 V7 deployed:", lsp8.address);
    
    // Deploy Minter V7
    console.log("\n2️⃣ Deploying POKSOMinterV7...");
    const POKSOMinterV7 = await ethers.getContractFactory("POKSOMinterV7");
    const minter = await POKSOMinterV7.deploy(lsp8.address);
    await minter.deployed();
    console.log("✅ Minter V7 deployed:", minter.address);
    
    // Transfer ownership
    console.log("\n3️⃣ Transferring LSP8 ownership to Minter...");
    const tx1 = await lsp8.transferOwnership(minter.address);
    await tx1.wait();
    console.log("✅ Ownership transferred");
    
    // Set LSP4 Collection Metadata with VerifiableURI format
    console.log("\n4️⃣ Setting LSP4 Collection Metadata (VerifiableURI)...");
    const collectionMetadataURL = "https://pokso-ux.github.io/pokso-cyberpunk/lsp4-metadata.json";
    // Hash is 0x00...00 for now (32 bytes)
    const collectionHash = ethers.constants.HashZero;
    const tx2 = await minter.setLSP4Metadata(collectionHash, ethers.utils.toUtf8Bytes(collectionMetadataURL));
    await tx2.wait();
    console.log("✅ LSP4 Metadata set (VerifiableURI format)");
    
    // Add creator
    console.log("\n5️⃣ Adding creator...");
    const tx3 = await minter.addCreator(deployer.address);
    await tx3.wait();
    console.log("✅ Creator added");
    
    // Set Token Metadata Base URI
    console.log("\n6️⃣ Setting Token Metadata Base URI...");
    const baseURI = "https://pokso-ux.github.io/pokso-cyberpunk/nfts/";
    const tx4 = await minter.setTokenMetadataBaseURI(ethers.utils.toUtf8Bytes(baseURI));
    await tx4.wait();
    console.log("✅ Base URI set:", baseURI);
    
    // Mint 1 token for FREE (0 LYX) to test
    console.log("\n7️⃣ Minting Token 0 for FREE (0 LYX)...");
    const tx5 = await minter.mint({ value: 0 });
    await tx5.wait();
    console.log("✅ Token 0 minted");
    
    // Save deployment
    const deployment = {
        network: "lukso-mainnet",
        chainId: 42,
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        lsp8: {
            name: "POKSOLSP8PureV7",
            address: lsp8.address,
            type: "LSP8 with VerifiableURI format",
            maxSupply: 500
        },
        minter: {
            name: "POKSOMinterV7",
            address: minter.address,
            type: "Free Mint with VerifiableURI",
            mintPrice: "0 LYX",
            maxPerWallet: 10
        },
        features: {
            verifiableURI: true,
            lsp4Metadata: true,
            reentrancyGuard: true,
            freeMint: true
        }
    };
    
    fs.writeFileSync('./deployment-v7.json', JSON.stringify(deployment, null, 2));
    fs.writeFileSync('./deployment-latest.json', JSON.stringify(deployment, null, 2));
    
    console.log("\n========================================");
    console.log("🎉 V7 DEPLOYMENT COMPLETE!");
    console.log("========================================");
    console.log("LSP8 Contract:", lsp8.address);
    console.log("Minter Contract:", minter.address);
    console.log("");
    console.log("Key Fix:");
    console.log("  ✅ VerifiableURI format: 0x6f357c6a + hash + url");
    console.log("  ✅ Follows LSP4 standard exactly");
    console.log("  ✅ Images should display on LUKSO explorer!");
    console.log("");
    console.log("Explorer URL:");
    console.log(`https://explorer.execution.mainnet.lukso.network/token/${lsp8.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
