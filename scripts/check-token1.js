const { ethers } = require("hardhat");

const LSP8_ADDRESS = "0x11Eb80ef335F3E08eAA87c97947e23C0c621708D";
const LSP4_METADATA_KEY = "0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e";

const LSP8_ABI = [
    "function getDataForTokenId(bytes32 tokenId, bytes32 dataKey) external view returns (bytes)",
    "function tokenOwnerOf(bytes32 tokenId) external view returns (address)"
];

async function main() {
    const provider = new ethers.providers.JsonRpcProvider("https://42.rpc.thirdweb.com");
    const lsp8 = new ethers.Contract(LSP8_ADDRESS, LSP8_ABI, provider);

    console.log("Checking Token 1 metadata...\n");

    const tokenId = ethers.utils.hexZeroPad("0x1", 32);
    
    try {
        const metadata = await lsp8.getDataForTokenId(tokenId, LSP4_METADATA_KEY);
        console.log("Raw metadata:", metadata);
        
        if (metadata && metadata !== "0x") {
            const url = ethers.utils.toUtf8String(metadata);
            console.log("\nMetadata URL:", url);
            
            // Check if URL is accessible
            console.log("\nFetching metadata JSON...");
            const response = await fetch(url);
            if (response.ok) {
                const json = await response.json();
                console.log("✅ JSON accessible");
                console.log("JSON content:", JSON.stringify(json, null, 2));
                
                if (json.LSP4Metadata && json.LSP4Metadata.images) {
                    const imageUrl = json.LSP4Metadata.images[0][0].url;
                    console.log("\nImage URL:", imageUrl);
                    
                    const imgResponse = await fetch(imageUrl, { method: "HEAD" });
                    console.log("Image status:", imgResponse.status, imgResponse.statusText);
                }
            } else {
                console.log("❌ JSON not accessible:", response.status);
            }
        } else {
            console.log("❌ No metadata set for token 1");
        }
        
        const owner = await lsp8.tokenOwnerOf(tokenId);
        console.log("\nToken 1 owner:", owner);
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
