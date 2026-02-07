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
  
  // POKSOLSP8PureV6 artifact
  const purePath = path.join(artifactsDir, 'POKSOLSP8PureV6.sol', 'POKSOLSP8PureV6.json');
  const pureArtifact = JSON.parse(fs.readFileSync(purePath, 'utf8'));
  
  // POKSOMinterV6 artifact
  const minterPath = path.join(artifactsDir, 'POKSOMinterV6.sol', 'POKSOMinterV6.json');
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
    
    // Step 1: Deploy POKSOLSP8PureV6
    console.log('\n🚀 Step 1: Deploying POKSOLSP8PureV6...');
    const PureFactory = new ethers.ContractFactory(pureArtifact.abi, pureArtifact.bytecode, wallet);
    const lsp8Contract = await PureFactory.deploy(wallet.address);
    await lsp8Contract.deployed();
    console.log('✅ POKSOLSP8PureV6 deployed at:', lsp8Contract.address);
    
    // Step 2: Deploy POKSOMinterV6 with LSP8 address
    console.log('\n🚀 Step 2: Deploying POKSOMinterV6...');
    const MinterFactory = new ethers.ContractFactory(minterArtifact.abi, minterArtifact.bytecode, wallet);
    const minterContract = await MinterFactory.deploy(lsp8Contract.address);
    await minterContract.deployed();
    console.log('✅ POKSOMinterV6 deployed at:', minterContract.address);
    
    // Step 3: Transfer LSP8 ownership to Minter
    console.log('\n🚀 Step 3: Transferring POKSOLSP8PureV6 ownership to Minter...');
    const transferTx = await lsp8Contract.transferOwnership(minterContract.address);
    await transferTx.wait();
    console.log('✅ Ownership transferred to:', minterContract.address);
    
    // Verify the transfer
    const newOwner = await lsp8Contract.owner();
    console.log('New LSP8 owner:', newOwner);
    
    // Step 4: Set token metadata base URI
    console.log('\n🚀 Step 4: Setting token metadata base URI...');
    const baseURI = 'https://pokso-ux.github.io/pokso-mint-site/nfts/';
    const setBaseURITx = await minterContract.setTokenMetadataBaseURI(ethers.utils.toUtf8Bytes(baseURI));
    await setBaseURITx.wait();
    console.log('✅ Base URI set to:', baseURI);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'lukso-mainnet',
      chainId: 42,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      version: 'V6',
      features: {
        freeMint: true,
        mintPrice: '0 LYX'
      },
      contracts: {
        POKSOLSP8PureV6: {
          address: lsp8Contract.address,
          abi: pureArtifact.abi
        },
        POKSOMinterV6: {
          address: minterContract.address,
          abi: minterArtifact.abi
        }
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'deployment-v6.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('\n📄 Deployment info saved to: deployment-v6.json');
    console.log('\n========================================');
    console.log('🎉 V6 DEPLOYMENT COMPLETE!');
    console.log('========================================');
    console.log('LSP8 Contract (POKSOLSP8PureV6):', lsp8Contract.address);
    console.log('Minter Contract (POKSOMinterV6):', minterContract.address);
    console.log('Mint Price: FREE (0 LYX)');
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
