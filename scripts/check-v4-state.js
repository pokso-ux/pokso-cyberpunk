const { ethers } = require("hardhat");
const fs = require('fs');

const LSP8_TOKEN_METADATA_BASE_URI = "0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843";

async function main() {
    const deployment = JSON.parse(fs.readFileSync('./deployment-v4.json', 'utf8'));
    const lsp8Address = deployment.lsp8.address;
    const minterAddress = deployment.minter.address;
    
    console.log("Checking LSP8 V4 state...");
    console.log("LSP8:", lsp8Address);
    console.log("Minter:", minterAddress);
    
    const provider = new ethers.providers.JsonRpcProvider("https://42.rpc.thirdweb.com");
    
    // Minimal ABI for LSP8
    const lsp8Abi = [
        "function currentTokenId() view returns (uint256)",
        "function owner() view returns (address)",
        "function getData(bytes32 dataKey) view returns (bytes memory)",
        "function tokenIdsOf(address tokenOwner) view returns (bytes32[] memory)"
    ];
    
    const lsp8 = new ethers.Contract(lsp8Address, lsp8Abi, provider);
    
    // Check Base URI
    console.log("\n1️⃣ Checking LSP8TokenMetadataBaseURI...");
    const baseURIRaw = await lsp8.getData(LSP8_TOKEN_METADATA_BASE_URI);
    console.log("Raw:", baseURIRaw);
    if (baseURIRaw && baseURIRaw !== '0x') {
        const baseURI = ethers.utils.toUtf8String(baseURIRaw);
        console.log("✅ Base URI:", baseURI);
    } else {
        console.log("❌ No Base URI set!");
    }
    
    // Check token state
    const currentId = await lsp8.currentTokenId();
    console.log("\n2️⃣ Current Token ID:", currentId.toString());
    
    // Check token 0 owner
    console.log("\n3️⃣ Checking token #0...");
    const token0Id = ethers.utils.hexZeroPad("0x0", 32);
    
    // Try to find who owns token 0
    // This requires knowing the owner address first, let's skip
    
    // Check if there's a way to get token URI
    console.log("\n4️⃣ Testing metadata URL construction...");
    if (baseURIRaw && baseURIRaw !== '0x') {
        const baseURI = ethers.utils.toUtf8String(baseURIRaw);
        const token0MetadataURL = baseURI + "0.json";
        console.log("Token #0 metadata URL:", token0MetadataURL);
        
        // Test if URL is accessible
        console.log("\n5️⃣ Testing URL accessibility...");
        try {
            const response = await fetch(token0MetadataURL);
            if (response.ok) {
                const data = await response.json();
                console.log("✅ Metadata accessible");
                console.log("Name:", data.LSP4Metadata?.name);
                console.log("Image:", data.LSP4Metadata?.images?.[0]?.[0]?.url);
            } else {
                console.log("❌ HTTP", response.status);
            }
        } catch(e) {
            console.log("❌ Fetch error:", e.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
