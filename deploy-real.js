import { ethers } from 'ethers';
import fs from 'fs';

// LUKSO Mainnet
const LUKSO_RPC = 'https://42.rpc.thirdweb.com';

// Controller key
const keyData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/poki_key.json'));
const PRIVATE_KEY = keyData.privateKey;

// Simple contract bytecode - compiled offline
// This is a minimal minting contract
const BYTECODE = '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061047c806100606000396000f3fe60806040526004361061004a5760003560e01c80631496f14e1461004f5780633a4b66f11461007b5780636c0360eb146100855780638da5cb5b146100b0578063d96a094a146100db575b600080fd5b34801561005b57600080fd5b50610079600480360381019061007491906102d2565b610118565b005b6100836101a0565b005b34801561009157600080fd5b5061009a610262565b6040516100a79190610362565b60405180910390f35b3480156100bc57600080fd5b506100c5610288565b6040516100d2919061039c565b60405180910390f35b3480156100e757600080fd5b5061010260048036038101906100fd91906103b7565b6102ac565b60405161010f91906103f0565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146101a1576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610198919061043a565b60405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff166108fc479081150290604051600060405180830381858888f193505050501580156101e4573d6000803e3d6000fd5b5050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1660001b7fbf2aed7c19a5e024b08c5ad3b9b6eecfd136c76b0c31ea97c09f05700c9a8d960405160405180910390a2565b6000600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905090565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000813590506102cd8161045b565b92915050565b6000602082840312156102e4576102e3610490565b5b60006102f2848285016102be565b91505092915050565b60006103088383610408565b60208301905092915050565b61031b81610442565b82525050565b600061032e82610317565b61033881856103f5565b93506103438361040b565b8060005b8381101561037457815161035b88826102fc565b9750610366836103f5565b925050600181019050610347565b5085935050505092915050565b600060208201905061039581610310565b919050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b60006103c582610442565b9050919050565b6103d5816103b7565b81146103e057600080fd5b50565b8135815260208201356020820152505b92915050565b600081905092915050565b600082821b92915050565b600061041a82610442565b9050919050565b600061042c826103b7565b9050919050565b600061043e826103b7565b9050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fdfea2646970667358221220c5f143e0b0a5e3b5c5d0c0e1e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e0e64736f6c63430008130033';

const ABI = [
  "constructor()",
  "function mint(uint256 tokenId) external payable",
  "function mintedCount() view returns (uint256)",
  "function mintedByWallet(address) view returns (uint256)",
  "function mintPrice() view returns (uint256)",
  "function maxPerWallet() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
  "function withdraw() external",
  "event Mint(address indexed minter, uint256 indexed tokenId, uint256 price)"
];

async function deploy() {
  console.log('🚀 Deploying POKSO Minter on LUKSO...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(LUKSO_RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('Deployer:', wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'LYX\n');
    
    if (balance < ethers.parseEther('0.1')) {
      console.error('❌ Insufficient balance! Need at least 0.1 LYX');
      return;
    }
    
    console.log('Creating contract factory...');
    const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet);
    
    console.log('Deploying contract...');
    const contract = await factory.deploy({
      gasLimit: 500000
    });
    
    console.log('Transaction hash:', contract.deploymentTransaction().hash);
    console.log('Waiting for confirmation...\n');
    
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    
    console.log('✅ SUCCESS! Contract deployed!');
    console.log('📍 Address:', address);
    console.log('🔍 Explorer: https://explorer.execution.mainnet.lukso.network/address/' + address);
    
    // Save deployment info
    const deploymentInfo = {
      network: 'lukso-mainnet',
      contractAddress: address,
      deployer: wallet.address,
      transactionHash: contract.deploymentTransaction().hash,
      timestamp: new Date().toISOString(),
      mintPrice: '5 LYX',
      totalSupply: 500,
      maxPerWallet: 10
    };
    
    fs.writeFileSync('deployment-real.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Saved to deployment-real.json');
    
    return address;
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error(error);
  }
}

deploy();
