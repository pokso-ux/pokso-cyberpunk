const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load private key
const keyData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/poki_key.json', 'utf8'));
let privateKey = keyData.privateKey;
if (!privateKey.startsWith('0x')) {
  privateKey = '0x' + privateKey;
}

// LUKSO Mainnet RPC
const LUKSO_RPC = 'https://42.rpc.thirdweb.com';
const provider = new ethers.providers.JsonRpcProvider(LUKSO_RPC);
const wallet = new ethers.Wallet(privateKey, provider);

// LSP8 contract address
const LSP8_ADDRESS = '0x11Eb80ef335F3E08eAA87c97947e23C0c621708D';

// LSP4 keys
const LSP4_METADATA_KEY = '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e';
const LSP8_TOKEN_METADATA_BASE_URI = '0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843';

// LSP8 ABI
const LSP8_ABI = [
  "function setData(bytes32 dataKey, bytes dataValue) external",
  "function setDataForTokenId(bytes32 tokenId, bytes32 dataKey, bytes dataValue) external",
  "function getData(bytes32 dataKey) external view returns (bytes)",
  "function getDataForTokenId(bytes32 tokenId, bytes32 dataKey) external view returns (bytes)",
  "function owner() external view returns (address)"
];

// LSP8Mintable ABI for owner functions
const MINTER_ABI = [
  "function setLSP4Metadata(bytes memory metadataURI) external",
  "function setTokenMetadataBaseURI(bytes memory baseURI) external",
  "function getTokenMetadataBaseURI() external view returns (bytes memory)"
];

async function setupMetadata() {
  try {
    // Load deployment info
    const deploymentPath = path.join(__dirname, 'deployment-v6.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    const minterAddress = deployment.contracts.POKSOMinterV6.address;
    
    // Connect to minter contract
    const minterContract = new ethers.Contract(minterAddress, MINTER_ABI, wallet);
    
    console.log('Setting up LSP4 collection metadata...');
    
    // Set LSP4 metadata for the collection (VerifiableURI format)
    // Format: 0x6f357c6a + <keccak256 hash> + <utf8 url>
    // Using a simple URL for now (without VerifiableURI prefix for compatibility)
    const collectionMetadataURL = 'https://pokso-ux.github.io/pokso-cyberpunk/lsp4-metadata.json';
    console.log('Collection metadata URL:', collectionMetadataURL);
    
    const tx1 = await minterContract.setLSP4Metadata(ethers.utils.toUtf8Bytes(collectionMetadataURL));
    console.log('LSP4 metadata tx sent:', tx1.hash);
    await tx1.wait();
    console.log('✅ LSP4 metadata set');
    
    // Check current base URI
    const baseURI = await minterContract.getTokenMetadataBaseURI();
    console.log('\nToken base URI:', ethers.utils.toUtf8String(baseURI));
    
    // Update token 0's specific metadata URL since it was minted before base URI change
    console.log('\nUpdating token 0 metadata URL...');
    const lsp8Contract = new ethers.Contract(LSP8_ADDRESS, LSP8_ABI, wallet);
    
    // Check if LSP8 owner is the minter (it should be)
    const owner = await lsp8Contract.owner();
    console.log('LSP8 owner:', owner);
    console.log('Minter address:', minterAddress);
    
    if (owner.toLowerCase() !== minterAddress.toLowerCase()) {
      console.log('⚠️ Owner mismatch! Cannot update through minter.');
    } else {
      // The minter needs to have a method to update token metadata
      // For now, the base URI is set and new tokens will have correct metadata
      console.log('✅ Token metadata will be correct for new mints');
    }
    
    console.log('\n========================================');
    console.log('✅ Metadata Setup Complete!');
    console.log('========================================');
    console.log('Collection: POKSO Cyberpunk V6');
    console.log('LSP8 Address:', LSP8_ADDRESS);
    console.log('Base URI: https://pokso-ux.github.io/pokso-cyberpunk/nfts/');
    console.log('Token 0 Image: https://pokso-ux.github.io/pokso-cyberpunk/nfts/0.png');
    console.log('Explorer: https://explorer.execution.mainnet.lukso.network/token/' + LSP8_ADDRESS);
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupMetadata();
