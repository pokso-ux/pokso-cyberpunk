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

console.log('Updating base URI with address:', wallet.address);

async function updateBaseURI() {
  try {
    // Load deployment info
    const deploymentPath = path.join(__dirname, 'deployment-v6.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    const minterAddress = deployment.contracts.POKSOMinterV6.address;
    const minterABI = deployment.contracts.POKSOMinterV6.abi;
    
    // Connect to minter contract
    const minterContract = new ethers.Contract(minterAddress, minterABI, wallet);
    
    // Update base URI to the working URL
    const newBaseURI = 'https://pokso-ux.github.io/pokso-cyberpunk/nfts/';
    console.log('Setting new base URI:', newBaseURI);
    
    const tx = await minterContract.setTokenMetadataBaseURI(ethers.utils.toUtf8Bytes(newBaseURI));
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Verify the change
    const currentBaseURI = await minterContract.getTokenMetadataBaseURI();
    console.log('New base URI (verified):', ethers.utils.toUtf8String(currentBaseURI));
    
    console.log('\n========================================');
    console.log('✅ Base URI Updated Successfully!');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

updateBaseURI();
