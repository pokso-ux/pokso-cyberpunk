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

console.log('========================================');
console.log('  DEPLOYING POKSO OFFICIAL V7');
console.log('========================================');
console.log('Deployer:', wallet.address);
console.log('');

// Configuration
const BASE_URI = 'https://pokso-ux.github.io/pokso-cyberpunk/official/metadata/';

async function deploy() {
  try {
    // Check deployer balance
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.utils.formatEther(balance), 'LYX\n');
    
    if (balance.lt(ethers.utils.parseEther('0.5'))) {
      console.error('❌ Insufficient balance (need 0.5 LYX minimum)');
      process.exit(1);
    }
    
    // Load artifacts
    console.log('📦 Loading V6 artifacts...\n');
    const artifactsDir = path.join(__dirname, 'artifacts', 'contracts');
    
    const purePath = path.join(artifactsDir, 'POKSOLSP8PureV6.sol', 'POKSOLSP8PureV6.json');
    const minterPath = path.join(artifactsDir, 'POKSOMinterV6.sol', 'POKSOMinterV6.json');
    
    const pureArtifact = JSON.parse(fs.readFileSync(purePath, 'utf8'));
    const minterArtifact = JSON.parse(fs.readFileSync(minterPath, 'utf8'));
    
    // Step 1: Deploy LSP8
    console.log('🚀 Step 1/4: Deploying LSP8 (POKSO Cyberpunk OFFICIAL)...');
    const PureFactory = new ethers.ContractFactory(pureArtifact.abi, pureArtifact.bytecode, wallet);
    const lsp8Contract = await PureFactory.deploy(wallet.address);
    await lsp8Contract.deployed();
    console.log('✅ LSP8 deployed:', lsp8Contract.address);
    
    // Step 2: Deploy Minter
    console.log('\n🚀 Step 2/4: Deploying MinterV7...');
    const MinterFactory = new ethers.ContractFactory(minterArtifact.abi, minterArtifact.bytecode, wallet);
    const minterContract = await MinterFactory.deploy(lsp8Contract.address);
    await minterContract.deployed();
    console.log('✅ Minter deployed:', minterContract.address);
    
    // Step 3: Transfer ownership
    console.log('\n🚀 Step 3/4: Transferring ownership...');
    const transferTx = await lsp8Contract.transferOwnership(minterContract.address);
    await transferTx.wait();
    console.log('✅ Ownership transferred to Minter');
    
    // Step 4: Set BaseURI
    console.log('\n🚀 Step 4/4: Setting Base URI...');
    const setBaseURITx = await minterContract.setTokenMetadataBaseURI(ethers.utils.toUtf8Bytes(BASE_URI));
    await setBaseURITx.wait();
    console.log('✅ Base URI set to:', BASE_URI);
    
    // Save deployment
    const deploymentInfo = {
      name: 'POKSO Cyberpunk OFFICIAL',
      network: 'lukso-mainnet',
      chainId: 42,
      deployer: wallet.address,
      timestamp: new Date().toISOString(),
      version: 'V7-OFFICIAL',
      baseURI: BASE_URI,
      mintPrice: '0 LYX (FREE)',
      contracts: {
        LSP8: {
          address: lsp8Contract.address,
          name: 'POKSO Cyberpunk OFFICIAL'
        },
        Minter: {
          address: minterContract.address
        }
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'official/deployment-v7-official.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('\n========================================');
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('========================================');
    console.log('Collection: POKSO Cyberpunk OFFICIAL');
    console.log('LSP8 Contract:', lsp8Contract.address);
    console.log('Minter Contract:', minterContract.address);
    console.log('Mint Price: 0 LYX (FREE)');
    console.log('Base URI:', BASE_URI);
    console.log('========================================');
    console.log('\n➡️ Update index.html with the Minter address!');
    
    return {
      lsp8: lsp8Contract.address,
      minter: minterContract.address
    };
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.reason) console.error('Reason:', error.reason);
    process.exit(1);
  }
}

deploy();
