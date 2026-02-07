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

// LSP8 ABI - include owner function and setDataForTokenId
const LSP8_ABI = [
  "function setDataForTokenId(bytes32 tokenId, bytes32 dataKey, bytes dataValue) external",
  "function getDataForTokenId(bytes32 tokenId, bytes32 dataKey) external view returns (bytes)",
  "function owner() external view returns (address)"
];

async function updateToken0Metadata() {
  try {
    // Connect directly to LSP8
    const lsp8Contract = new ethers.Contract(LSP8_ADDRESS, LSP8_ABI, wallet);
    
    console.log('Updating Token 0 metadata URL...');
    
    // Check current owner
    const owner = await lsp8Contract.owner();
    console.log('LSP8 Owner:', owner);
    
    // The minter contract is the owner, so we need to call through the minter
    // or we can try calling directly if the wallet is the owner
    
    if (owner.toLowerCase() === wallet.address.toLowerCase()) {
      console.log('Wallet is owner, updating directly...');
    } else {
      console.log('Wallet is not owner. Owner is:', owner);
      console.log('Need to update through minter contract...');
      
      // Load deployment info
      const deploymentPath = path.join(__dirname, 'deployment-v6.json');
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      
      // Check if minter has update function
      const minterABI = deployment.contracts.POKSOMinterV6.abi;
      const hasUpdateFunction = minterABI.some(item => 
        item.name === 'updateTokenMetadata' || item.name === 'setTokenMetadataForToken'
      );
      
      if (!hasUpdateFunction) {
        console.log('⚠️ Minter does not have token metadata update function.');
        console.log('Token 0 will have the old metadata URL.');
        console.log('New mints will have correct metadata.');
        return;
      }
    }
    
    // Update token 0 metadata URL to point to cyberpunk
    const tokenId = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const newMetadataURL = 'https://pokso-ux.github.io/pokso-cyberpunk/nfts/0.json';
    
    console.log('Setting Token 0 metadata to:', newMetadataURL);
    
    const tx = await lsp8Contract.setDataForTokenId(
      tokenId,
      LSP4_METADATA_KEY,
      ethers.utils.toUtf8Bytes(newMetadataURL)
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Verify
    const updatedMetadata = await lsp8Contract.getDataForTokenId(tokenId, LSP4_METADATA_KEY);
    console.log('Updated metadata URL:', ethers.utils.toUtf8String(updatedMetadata));
    
    console.log('\n✅ Token 0 metadata updated successfully!');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    console.log('\n⚠️ Token 0 metadata was not updated.');
    console.log('Token 0 URL: https://pokso-ux.github.io/pokso-mint-site/nfts/0.json');
    console.log('Token 0 Image: https://pokso-ux.github.io/pokso-cyberpunk/nfts/0.png (exists)');
  }
}

updateToken0Metadata();
