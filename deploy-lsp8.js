// Compile and Deploy POKSO LSP8 Contract
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const { ethers } = require('ethers');

// LUKSO Mainnet
const LUKSO_RPC = 'https://42.rpc.thirdweb.com';
const CHAIN_ID = 42;

// Contract parameters
const COLLECTION_NAME = 'POKSO Cyberpunk';
const COLLECTION_SYMBOL = 'POKSO';
const BASE_URI = 'https://pokso-ux.github.io/pokso-cyberpunk/metadata/';

function extractPrivateKey(pemContent) {
  // Remove PEM headers and whitespace
  const base64Content = pemContent
    .replace('-----BEGIN EC PRIVATE KEY-----', '')
    .replace('-----END EC PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  // Decode base64
  const decoded = Buffer.from(base64Content, 'base64');
  
  // SEC1 format: sequence containing version, private key, [optional params], [optional public key]
  // For secp256k1, the private key is typically at a specific offset
  // The structure is: 0x30 (sequence) + length + 0x02 (integer) + 0x01 (version length) + 0x01 (version=1) + 
  //                   0x04 (octet string) + length + private key bytes
  
  // Find the private key (after version and tag)
  let offset = 0;
  if (decoded[offset] === 0x30) { // SEQUENCE
    offset += 2; // skip sequence tag and length
    if (decoded[offset] === 0x02) { // INTEGER (version)
      offset += 3; // skip integer tag, length, and version value
      if (decoded[offset] === 0x04) { // OCTET STRING (private key)
        offset += 2; // skip octet string tag
        const keyLength = decoded[offset];
        offset += 1;
        const privateKeyBytes = decoded.slice(offset, offset + keyLength);
        return '0x' + privateKeyBytes.toString('hex');
      }
    }
  }
  
  // Fallback: try to find the 32-byte private key after common headers
  // Most ETH/LUKSO private keys are 32 bytes
  if (decoded.length >= 32) {
    // Try last 32 bytes (common in some formats)
    const privateKeyBytes = decoded.slice(-32);
    return '0x' + privateKeyBytes.toString('hex');
  }
  
  throw new Error('Could not extract private key from PEM');
}

function findImports(importPath) {
  // Handle OpenZeppelin imports
  if (importPath.startsWith('@openzeppelin/')) {
    const fullPath = path.join(__dirname, 'node_modules', importPath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      return { contents: content };
    } catch (e) {
      return { error: `File not found: ${fullPath}` };
    }
  }
  return { error: `File not found: ${importPath}` };
}

function compileContract() {
  const contractPath = path.join(__dirname, 'contracts', 'POKSOLSP8.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'POKSOLSP8.sol': {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };

  console.log('Compiling contract...');
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    const hasError = output.errors.some(e => e.severity === 'error');
    if (hasError) {
      console.error('Compilation errors:', output.errors);
      throw new Error('Contract compilation failed');
    }
    console.warn('Compilation warnings:', output.errors);
  }

  const contract = output.contracts['POKSOLSP8.sol']['POKSOLSP8'];
  
  // Save artifacts
  fs.mkdirSync(path.join(__dirname, 'artifacts'), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, 'artifacts', 'POKSOLSP8.json'),
    JSON.stringify({
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    }, null, 2)
  );

  console.log('✅ Contract compiled successfully');
  return {
    abi: contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object
  };
}

async function deploy() {
  // Load private key from JSON
  const keyData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/poki_key.json'));
  const privateKey = keyData.privateKey;
  console.log('Deployer address:', keyData.address);
  
  const provider = new ethers.providers.JsonRpcProvider(LUKSO_RPC, {
    name: 'lukso',
    chainId: CHAIN_ID
  });
  
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log('Deploying with address:', wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.utils.formatEther(balance), 'LYX');
  
  if (balance.lt(ethers.utils.parseEther('0.1'))) {
    console.warn('⚠️ Low balance! Deployment may fail.');
  }
  
  // Compile contract
  const { abi, bytecode } = compileContract();
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  console.log('\nDeploying POKSOLSP8...');
  console.log('Name:', COLLECTION_NAME);
  console.log('Symbol:', COLLECTION_SYMBOL);
  console.log('Owner:', wallet.address);
  console.log('Base URI:', BASE_URI);
  
  const contract = await factory.deploy(
    COLLECTION_NAME,
    COLLECTION_SYMBOL,
    wallet.address,
    BASE_URI
  );
  
  await contract.deployed();
  
  console.log('\n✅ Contract deployed!');
  console.log('Address:', contract.address);
  console.log('Transaction:', contract.deployTransaction.hash);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: contract.address,
    transactionHash: contract.deployTransaction.hash,
    deployer: wallet.address,
    name: COLLECTION_NAME,
    symbol: COLLECTION_SYMBOL,
    timestamp: new Date().toISOString(),
    network: 'LUKSO Mainnet',
    abi: abi
  };
  
  fs.writeFileSync('deployment-lsp8.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('\nDeployment info saved to deployment-lsp8.json');
  
  return contract.address;
}

deploy()
  .then(addr => {
    console.log('\n🎉 Deployment complete!');
    console.log('New contract address:', addr);
    console.log('\n⚠️ IMPORTANT: Update app.js with this address:');
    console.log(`const NFT_CONTRACT_ADDRESS = '${addr}';`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Deployment failed:', err);
    process.exit(1);
  });
