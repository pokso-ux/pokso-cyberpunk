const { ethers } = require('ethers');
const fs = require('fs');

// LUKSO networks
const LUKSO_TESTNET = 'https://rpc.testnet.lukso.network';
const LUKSO_MAINNET = 'https://42.rpc.thirdweb.com';

// Controller key
const keyData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/poki_key.json'));
const PRIVATE_KEY = keyData.privateKey;
const CONTROLLER_ADDRESS = keyData.address;

async function checkBalances() {
  console.log('🔍 Checking LUKSO balances...\n');
  console.log('Controller Address:', CONTROLLER_ADDRESS);
  
  try {
    // Testnet
    const testnetProvider = new ethers.JsonRpcProvider(LUKSO_TESTNET);
    const testnetBalance = await testnetProvider.getBalance(CONTROLLER_ADDRESS);
    console.log('Testnet Balance:', ethers.formatEther(testnetBalance), 'LYXt');
    
    // Mainnet
    const mainnetProvider = new ethers.JsonRpcProvider(LUKSO_MAINNET);
    const mainnetBalance = await mainnetProvider.getBalance(CONTROLLER_ADDRESS);
    console.log('Mainnet Balance:', ethers.formatEther(mainnetBalance), 'LYX');
    
    // UP address
    const upAddress = '0xBb045B6C2cA92984e8b6e8A4cc32f4236adEE37b';
    const upBalance = await mainnetProvider.getBalance(upAddress);
    console.log('UP Balance:', ethers.formatEther(upBalance), 'LYX');
    
    console.log('\n---');
    
    // Check if we can deploy
    const minRequired = ethers.parseEther('0.1');
    
    if (testnetBalance >= minRequired) {
      console.log('✅ Can deploy on TESTNET');
      return 'testnet';
    } else if (mainnetBalance >= minRequired) {
      console.log('✅ Can deploy on MAINNET');
      return 'mainnet';
    } else {
      console.log('❌ Insufficient balance for deployment');
      console.log('Need at least 0.1 LYX for gas fees');
      return 'none';
    }
  } catch (error) {
    console.error('Error:', error.message);
    return 'error';
  }
}

checkBalances().then(result => {
  console.log('\nResult:', result);
});
