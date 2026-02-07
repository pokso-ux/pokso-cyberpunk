const { ethers } = require('ethers');

const LUKSO_RPC = 'https://42.rpc.thirdweb.com';
const provider = new ethers.providers.JsonRpcProvider(LUKSO_RPC);

// LSP8 contract address
const LSP8_ADDRESS = '0x11Eb80ef335F3E08eAA87c97947e23C0c621708D';

// LSP4 Metadata key
const LSP4_METADATA_KEY = '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e';

// LSP8 ABI
const LSP8_ABI = [
  "function getDataForTokenId(bytes32 tokenId, bytes32 dataKey) external view returns (bytes)",
  "function tokenOwnerOf(bytes32 tokenId) external view returns (address)",
  "function totalSupply() external view returns (uint256)",
  "function currentTokenId() external view returns (uint256)"
];

async function verifyTokens() {
  const contract = new ethers.Contract(LSP8_ADDRESS, LSP8_ABI, provider);
  
  console.log('═══════════════════════════════════════════════════');
  console.log('   POKSO LSP8 V6 Token Verification');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('Contract Address:', LSP8_ADDRESS);
  console.log('');
  
  const totalSupply = await contract.totalSupply();
  const currentTokenId = await contract.currentTokenId();
  console.log('Total Supply:', totalSupply.toString());
  console.log('Current Token ID:', currentTokenId.toString());
  console.log('');
  
  // Check both tokens
  for (let i = 0; i < 2; i++) {
    const tokenId = '0x' + i.toString(16).padStart(64, '0');
    console.log(`--- Token ${i} ---`);
    
    const metadata = await contract.getDataForTokenId(tokenId, LSP4_METADATA_KEY);
    if (metadata && metadata.length > 2) {
      try {
        const url = ethers.utils.toUtf8String(metadata);
        console.log('Metadata URL:', url);
        
        // Check if URL is accessible
        console.log('Checking URL accessibility...');
        const response = await fetch(url);
        if (response.ok) {
          const json = await response.json();
          console.log('✅ Metadata JSON is accessible');
          if (json.LSP4Metadata && json.LSP4Metadata.images) {
            const imageUrl = json.LSP4Metadata.images[0][0].url;
            console.log('Image URL:', imageUrl);
            
            // Check image
            const imgResponse = await fetch(imageUrl, { method: 'HEAD' });
            if (imgResponse.ok) {
              console.log('✅ Image is accessible');
            } else {
              console.log('❌ Image is NOT accessible');
            }
          }
        } else {
          console.log('❌ Metadata JSON is NOT accessible (Status:', response.status + ')');
        }
      } catch (e) {
        console.log('Error:', e.message);
      }
    } else {
      console.log('❌ No metadata set');
    }
    
    try {
      const owner = await contract.tokenOwnerOf(tokenId);
      console.log('Owner:', owner);
    } catch (e) {
      console.log('Owner: Error -', e.message);
    }
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════');
}

verifyTokens().catch(console.error);
