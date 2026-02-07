const { ethers } = require("hardhat");

const LSP8_ADDRESS = "0x7f58492f42C4B0F95D680B1c5562bCA76E74acf3";
const LSP4_METADATA_KEY = "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";

const LSP8_ABI = [
    "function getDataForTokenId(bytes32 tokenId, bytes32 dataKey) external view returns (bytes)",
    "function getData(bytes32 dataKey) external view returns (bytes)",
    "function tokenOwnerOf(bytes32 tokenId) external view returns (address)",
    "function totalSupply() external view returns (uint256)"
];

async function main() {
    const provider = new ethers.providers.JsonRpcProvider("https://42.rpc.thirdweb.com");
    const lsp8 = new ethers.Contract(LSP8_ADDRESS, LSP8_ABI, provider);

    console.log("Checking V7 Token 0 metadata...\n");

    const tokenId = ethers.utils.hexZeroPad("0x0", 32);
    
    // Check token metadata
    console.log("=== Token 0 Metadata ===");
    const metadata = await lsp8.getDataForTokenId(tokenId, LSP4_METADATA_KEY);
    console.log("Raw bytes:", metadata);
    console.log("Length:", (metadata.length - 2) / 2, "bytes");
    
    if (metadata && metadata.length > 10) {
        // Parse VerifiableURI
        // Format: 0x6f357c6a + hash(32 bytes) + url
        const prefix = metadata.slice(0, 10); // 0x6f357c6a
        const hash = metadata.slice(10, 74); // 32 bytes
        const urlBytes = "0x" + metadata.slice(74);
        
        console.log("\nVerifiableURI breakdown:");
        console.log("  Prefix:", prefix, "(expected: 0x6f357c6a)");
        console.log("  Hash:", hash);
        
        if (urlBytes.length > 2) {
            try {
                const url = ethers.utils.toUtf8String(urlBytes);
                console.log("  URL:", url);
            } catch (e) {
                console.log("  URL bytes:", urlBytes);
            }
        }
    }
    
    // Check collection metadata
    console.log("\n=== Collection Metadata ===");
    const collectionMeta = await lsp8.getData(LSP4_METADATA_KEY);
    console.log("Raw bytes:", collectionMeta);
    
    if (collectionMeta && collectionMeta.length > 10) {
        const prefix = collectionMeta.slice(0, 10);
        const hash = collectionMeta.slice(10, 74);
        const urlBytes = "0x" + collectionMeta.slice(74);
        
        console.log("\nVerifiableURI breakdown:");
        console.log("  Prefix:", prefix);
        console.log("  Hash:", hash);
        
        if (urlBytes.length > 2) {
            try {
                const url = ethers.utils.toUtf8String(urlBytes);
                console.log("  URL:", url);
            } catch (e) {
                console.log("  URL bytes:", urlBytes);
            }
        }
    }
    
    // Check owner
    console.log("\n=== Token Info ===");
    const owner = await lsp8.tokenOwnerOf(tokenId);
    console.log("Token 0 owner:", owner);
    
    const totalSupply = await lsp8.totalSupply();
    console.log("Total supply:", totalSupply.toString());
}

main().catch(console.error);
