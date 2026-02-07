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

console.log('Deployer address:', wallet.address);

// Load contract ABIs and bytecode
async function loadContractArtifacts() {
  const artifactsDir = path.join(__dirname, 'artifacts', 'contracts');
  
  // POKSOLSP8Pure artifact
  const purePath = path.join(artifactsDir, 'POKSOLSP8Pure.sol', 'POKSOLSP8Pure.json');
  const pureArtifact = JSON.parse(fs.readFileSync(purePath, 'utf8'));
  
  // POKSOMinter artifact
  const minterPath = path.join(artifactsDir, 'POKSOMinter.sol', 'POKSOMinter.json');
  const minterArtifact = JSON.parse(fs.readFileSync(minterPath, 'utf8'));
  
  return { pureArtifact, minterArtifact };
}

async function deploy() {
  try {
    // Check deployer balance
    const balance = await provider.getBalance(wallet.address);
    console.log('Deployer balance:', ethers.utils.formatEther(balance), 'LYX');
    
    if (balance.lt(ethers.utils.parseEther('0.5'))) {
      console.error('Insufficient balance for deployment');
      process.exit(1);
    }
    
    // Load artifacts
    console.log('\n📦 Loading contract artifacts...');
    const { pureArtifact, minterArtifact } = await loadContractArtifacts();
    
    // Step 1: Deploy POKSOLSP8Pure
    console.log('\n🚀 Step 1: Deploying POKSOLSP8Pure...');
    const PureFactory = new ethers.ContractFactory(pureArtifact.abi, pureArtifact.bytecode, wallet);
    const lsp8Contract = await PureFactory.deploy(wallet.address);
    await lsp8Contract.deployed();
    console.log('✅ POKSOLSP8Pure deployed at:', lsp8Contract.address);
    
    // Step 2: Deploy POKSOMinter with LSP8 address
    console.log('\n🚀 Step 2: Deploying POKSOMinter...');
    const MinterFactory = new ethers.ContractFactory(minterArtifact.abi, minterArtifact.bytecode, wallet);
    const minterContract = await MinterFactory.deploy(lsp8Contract.address);
    await minterContract.deployed();
    console.log('✅ POKSOMinter deployed at:', minterContract.address);
    
    // Step 3: Transfer LSP8 ownership to Minter
    console.log('\n🚀 Step 3: Transferring POKSOLSP8Pure ownership to Minter...');
    const transferTx = await lsp8Contract.transferOwnership(minterContract.address);
    await transferTx.wait();
    console.log('✅ Ownership transferred to:', minterContract.address);
    
    // Verify the transfer
    const newOwner = await lsp8Contract.owner();
    console.log('New LSP8 owner:', newOwner);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'lukso-mainnet',
      chainId: 42,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      contracts: {
        POKSOLSP8Pure: {
          address: lsp8Contract.address,
          abi: pureArtifact.abi
        },
        POKSOMinter: {
          address: minterContract.address,
          abi: minterArtifact.abi
        }
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'deployment-clean-lsp8.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('\n📄 Deployment info saved to: deployment-clean-lsp8.json');
    console.log('\n========================================');
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('========================================');
    console.log('LSP8 Contract (POKSOLSP8Pure):', lsp8Contract.address);
    console.log('Minter Contract (POKSOMinter):', minterContract.address);
    console.log('========================================');
    
    // Return for programmatic use
    return {
      lsp8Address: lsp8Contract.address,
      minterAddress: minterContract.address
    };
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deploy();
}

module.exports = { deploy };
