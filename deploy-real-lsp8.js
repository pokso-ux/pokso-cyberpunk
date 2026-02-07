const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('========================================');
  console.log('  Deploying REAL LSP8 POKSO Contract');
  console.log('========================================\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await deployer.getBalance();
  console.log('Account balance:', hre.ethers.utils.formatEther(balance), 'LYX\n');

  // Contract parameters
  const name = 'POKSO Cyberpunk';
  const symbol = 'POKSO';
  const baseURI = 'https://pokso-ux.github.io/pokso-cyberpunk/nfts/';

  console.log('Contract Parameters:');
  console.log('  Name:', name);
  console.log('  Symbol:', symbol);
  console.log('  Base URI:', baseURI);
  console.log('  Mint Price: 5 LYX');
  console.log('  Total Supply: 500');
  console.log('  Max Per Wallet: 10\n');

  // Deploy the contract
  console.log('Deploying POKSOLSP8Real...');
  
  const POKSOLSP8Real = await hre.ethers.getContractFactory('POKSOLSP8Real');
  const contract = await POKSOLSP8Real.deploy(
    name,
    symbol,
    deployer.address, // owner
    baseURI
  );

  await contract.deployed();

  console.log('\n========================================');
  console.log('  Contract Deployed Successfully!');
  console.log('========================================');
  console.log('Contract Address:', contract.address);
  console.log('Transaction Hash:', contract.deployTransaction.hash);
  console.log('Block Number:', contract.deployTransaction.blockNumber);
  console.log('========================================\n');

  // Save deployment info
  const deploymentInfo = {
    contractName: 'POKSOLSP8Real',
    address: contract.address,
    transactionHash: contract.deployTransaction.hash,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    network: 'lukso-mainnet',
    chainId: 42,
    name: name,
    symbol: symbol,
    baseURI: baseURI,
    mintPrice: '5',
    totalSupply: 500,
    maxPerWallet: 10
  };

  const deploymentPath = path.join(__dirname, 'deployment-real-lsp8.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('Deployment info saved to:', deploymentPath);

  // Get contract info
  console.log('\nVerifying contract info...');
  const info = await contract.getContractInfo();
  console.log('  Mint Price:', hre.ethers.utils.formatEther(info._mintPrice), 'LYX');
  console.log('  Max Per Wallet:', info._maxPerWallet.toString());
  console.log('  Total Supply:', info._totalSupply.toString());
  console.log('  Current Minted:', info._mintedCount.toString());
  console.log('  Available:', info._availableSupply.toString());

  // Save ABI for frontend
  const artifact = await hre.artifacts.readArtifact('POKSOLSP8Real');
  const abiPath = path.join(__dirname, 'POKSOLSP8Real-abi.json');
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log('\nABI saved to:', abiPath);

  console.log('\n========================================');
  console.log('  Next Steps:');
  console.log('========================================');
  console.log('1. Contract will appear on https://universaleverything.io/');
  console.log('2. Update app.js with the new contract address');
  console.log('3. Test minting functionality');
  console.log('4. Verify on LUKSO Explorer');
  console.log('\nContract Address:', contract.address);
  console.log('========================================');

  return contract.address;
}

main()
  .then((address) => {
    console.log('\nDeployment complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nDeployment failed:', error);
    process.exit(1);
  });
