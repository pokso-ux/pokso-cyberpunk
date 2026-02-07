const hre = require('hardhat');
const fs = require('fs');

async function main() {
  console.log('========================================');
  console.log('  Deploying Clean LSP8 Architecture');
  console.log('========================================\n');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);

  const balance = await deployer.getBalance();
  console.log('Balance:', hre.ethers.utils.formatEther(balance), 'LYX\n');

  // Step 1: Deploy POKSOLSP8Pure (Pure LSP8)
  console.log('Step 1: Deploying POKSOLSP8Pure...');
  const POKSOLSP8Pure = await hre.ethers.getContractFactory('POKSOLSP8Pure');
  const lsp8 = await POKSOLSP8Pure.deploy(deployer.address);
  await lsp8.deployed();
  console.log('✅ LSP8 deployed at:', lsp8.address);

  // Step 2: Deploy POKSOMinterV2
  console.log('\nStep 2: Deploying POKSOMinterV2...');
  const POKSOMinterV2 = await hre.ethers.getContractFactory('POKSOMinterV2');
  const minter = await POKSOMinterV2.deploy(lsp8.address);
  await minter.deployed();
  console.log('✅ Minter deployed at:', minter.address);

  // Step 3: Transfer ownership of LSP8 to Minter
  console.log('\nStep 3: Transferring LSP8 ownership to Minter...');
  const tx = await lsp8.transferOwnership(minter.address);
  await tx.wait();
  console.log('✅ Ownership transferred');

  // Verify
  const newOwner = await lsp8.owner();
  console.log('LSP8 owner is now:', newOwner);
  console.log('Expected (Minter):', minter.address);
  console.log('Match:', newOwner === minter.address ? '✅ YES' : '❌ NO');

  // Save deployment info
  const deploymentInfo = {
    network: 'lukso-mainnet',
    chainId: 42,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    lsp8: {
      name: 'POKSOLSP8Pure',
      address: lsp8.address,
      type: 'Pure LSP8 NFT Contract'
    },
    minter: {
      name: 'POKSOMinterV2',
      address: minter.address,
      type: 'Payment Handler',
      mintPrice: '5 LYX'
    }
  };

  fs.writeFileSync('deployment-clean.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('\n💾 Deployment saved to deployment-clean.json');

  console.log('\n========================================');
  console.log('  DEPLOYMENT COMPLETE');
  console.log('========================================');
  console.log('LSP8 Contract:', lsp8.address);
  console.log('Minter Contract:', minter.address);
  console.log('\n⚠️  IMPORTANT:');
  console.log('Update app.js with MINTER address:', minter.address);
  console.log('========================================');

  return { lsp8: lsp8.address, minter: minter.address };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
