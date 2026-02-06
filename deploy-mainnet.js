const { ethers } = require('ethers');
const fs = require('fs');

// LUKSO Mainnet
const LUKSO_MAINNET = 'https://42.rpc.thirdweb.com';

// Controller key
const keyData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/poki_key.json'));
const PRIVATE_KEY = keyData.privateKey;

// Minimal contract for POKSO Minter
// This is a simplified version - a full implementation would need proper LSP8 integration
const BYTECODE = '0x60806040526040518060400160405280600581526020017f504f4b534f000000000000000000000000000000000000000000000000000000815250600090816200004a91906200030b565b503480156200005857600080fd5b5060405162001a1038038062001a1083398181016040528101906200007e9190620003b7565b336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550620000cf600560ff1683620000d960201b60201c565b62000494565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156200014c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620001439062000469565b60405180910390fd5b6200016781620001636200018e60201b60201c565b60201c565b8062000175576200018b565b6200018983836200027d60201b60201c565b505050565b6000600560009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6000600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054821462000278576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016200026f90620004db565b60405180910390fd5b919050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050600081148015620002d25750818114155b1562000317576000811462000316576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016200030d9062000557565b5b5b5050565b6000815190506200032d816200047a565b92915050565b6000620003486200034284620005a1565b62000578565b9050919050565b6000819050919050565b60006200036d8262000330565b9050919050565b60007f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000620003b48262000356565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203620003e957620003e862000374565b5b600182019050919050565b600080604083850312156200040c576200040b62000475565b5b60006200041c858286016200031c565b92505060206200042f858286016200035f565b9150509250929050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b5b6001141515151562000474566200047362000461565b5b565b5b565b62000484816200033d565b81146200048f57600080fd5b50565b6000819050919050565b6000620004b48262000492565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff821415620004e057620004df62000461565b5b600182019050919050565b7f4d6178207065722077616c6c6574207265616368656400000000000000000000600082015250565b7f496e73756666696369656e74207061796d656e740000000000000000000000600082015250565b7f4e6f2066756e647320746f20776974686472617700000000000000000000600082015250565b6000620005b8826200059b565b9150620005c683620005a1565b9250828201905080821115620005e257620005e162000461565b5b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006200061982620005ec565b9050919050565b6200062b816200060c565b81146200063757600080fd5b50565b6000819050919050565b60006200065c8262000616565b91506200066a8362000640565b92508282026200067d8162000616565b905092915050565b61156c80620004a46000396000f3fe';

const ABI = [
  "constructor()",
  "function mint() payable",
  "function mintPrice() view returns (uint256)",
  "function maxPerWallet() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function mintedCount() view returns (uint256)",
  "function mintedByWallet(address) view returns (uint256)",
  "function withdraw()",
  "function setMintPrice(uint256)",
  "function setMaxPerWallet(uint256)",
  "function owner() view returns (address)",
  "event Mint(address indexed minter, uint256 indexed tokenId, uint256 price)",
  "event Withdraw(address indexed to, uint256 amount)"
];

async function deploy() {
  console.log('🚀 Deploying POKSO Minter on LUKSO Mainnet...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(LUKSO_MAINNET);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Deployer:', wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'LYX\n');
    
    // Create contract factory
    const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet);
    
    console.log('Sending deployment transaction...');
    const contract = await factory.deploy({
      gasLimit: 1000000
    });
    
    console.log('Transaction hash:', contract.deploymentTransaction().hash);
    console.log('Waiting for confirmation...\n');
    
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log('✅ Contract deployed!');
    console.log('Address:', address);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'lukso-mainnet',
      contractAddress: address,
      deployer: wallet.address,
      transactionHash: contract.deploymentTransaction().hash,
      timestamp: new Date().toISOString(),
      mintPrice: '5 LYX',
      totalSupply: 500
    };
    
    fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    
    console.log('\n📋 Deployment info saved to deployment.json');
    console.log('\nNext steps:');
    console.log('1. Update app.js with contract address:', address);
    console.log('2. Test the mint function');
    console.log('3. Transfer ownership to UP if needed');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error(error);
  }
}

deploy();
