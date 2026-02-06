const { ethers } = require('ethers');
const fs = require('fs');

// LUKSO Mainnet RPC
const LUKSO_RPC = 'https://42.rpc.thirdweb.com';

// Load controller key
const keyData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/poki_key.json'));
const PRIVATE_KEY = keyData.privateKey;

// Simple contract bytecode for testing (minimal contract)
// This is a placeholder - in production would compile actual Solidity
const CONTRACT_BYTECODE = '0x608060405234801561001057600080fd5b5060';

async function deploy() {
  try {
    console.log('Connecting to LUKSO Mainnet...');
    
    const provider = new ethers.providers.JsonRpcProvider(LUKSO_RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Deployer address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.utils.formatEther(balance), 'LYX');
    
    if (balance.lt(ethers.utils.parseEther('0.1'))) {
      console.error('Insufficient balance! Need at least 0.1 LYX for gas.');
      process.exit(1);
    }
    
    // For now, create a simple deployment transaction
    // In production, this would compile and deploy the actual POKSOMinter contract
    console.log('Creating deployment transaction...');
    
    const deployTx = {
      from: wallet.address,
      data: CONTRACT_BYTECODE,
      gasLimit: 1000000
    };
    
    console.log('Sending deployment transaction...');
    const tx = await wallet.sendTransaction(deployTx);
    
    console.log('Transaction hash:', tx.hash);
    console.log('Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('Contract deployed at:', receipt.contractAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'lukso-mainnet',
      contractAddress: receipt.contractAddress,
      deployer: wallet.address,
      transactionHash: tx.hash,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('Deployment info saved to deployment.json');
    
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy();
