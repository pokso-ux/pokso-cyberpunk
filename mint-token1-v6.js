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

console.log('Minting with address:', wallet.address);

async function mint() {
  try {
    // Load deployment info
    const deploymentPath = path.join(__dirname, 'deployment-v6.json');
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    
    const minterAddress = deployment.contracts.POKSOMinterV6.address;
    const minterABI = deployment.contracts.POKSOMinterV6.abi;
    
    console.log('Minter address:', minterAddress);
    
    // Connect to minter contract
    const minterContract = new ethers.Contract(minterAddress, minterABI, wallet);
    
    // Check mint info before
    const mintInfoBefore = await minterContract.getMintInfo(wallet.address);
    console.log('\nMint info BEFORE:');
    console.log('  Minted:', mintInfoBefore.minted.toString());
    console.log('  Remaining:', mintInfoBefore.remaining.toString());
    console.log('  Current Token ID:', mintInfoBefore.currentId.toString());
    
    // Mint 1 token (FREE - 0 LYX)
    console.log('\n🚀 Minting 1 POKSO NFT (Token 1) for FREE (0 LYX)...');
    const mintTx = await minterContract.mint({ value: 0 });
    console.log('Transaction sent:', mintTx.hash);
    
    const receipt = await mintTx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Parse Mint event
    const mintEvent = receipt.events.find(e => e.event === 'Mint');
    if (mintEvent) {
      console.log('🎉 Minted token ID:', mintEvent.args.tokenId.toString());
      console.log('   Minter:', mintEvent.args.minter);
      console.log('   Price:', ethers.utils.formatEther(mintEvent.args.price), 'LYX');
    }
    
    // Check mint info after
    const mintInfoAfter = await minterContract.getMintInfo(wallet.address);
    console.log('\nMint info AFTER:');
    console.log('  Minted:', mintInfoAfter.minted.toString());
    console.log('  Remaining:', mintInfoAfter.remaining.toString());
    console.log('  Current Token ID:', mintInfoAfter.currentId.toString());
    
    console.log('\n========================================');
    console.log('🎉 MINT COMPLETE!');
    console.log('========================================');
    console.log('Token 1 should have metadata at:');
    console.log('https://pokso-ux.github.io/pokso-cyberpunk/nfts/1.json');
    console.log('Token 1 image:');
    console.log('https://pokso-ux.github.io/pokso-cyberpunk/nfts/1.png');
    console.log('\nView on LUKSO Explorer:');
    console.log(`https://explorer.execution.mainnet.lukso.network/token/${deployment.contracts.POKSOLSP8PureV6.address}`);
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Mint failed:', error.message);
    process.exit(1);
  }
}

mint();
