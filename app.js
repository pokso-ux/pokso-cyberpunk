// POKSO Mint App - LUKSO Integration
const UP_BROWSER_EXTENSION = 'https://my.universalprofile.cloud';

// NEW REAL CONTRACT ADDRESS
const POKSO_CONTRACT = '0x77c33Cb3283Af1e3241b333AFd00A341Fa464795';

// POKSOMinter ABI
const POKSO_ABI = [
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

let provider, signer, upAddress, contract;

async function connectUP() {
  if(window.ethereum) {
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      upAddress = accounts[0];
      document.querySelector('.connect-btn').textContent = 'Connected: ' + upAddress.slice(0,6) + '...' + upAddress.slice(-4);
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      
      // Initialize contract
      contract = new ethers.Contract(POKSO_CONTRACT, POKSO_ABI, signer);
      
      // Update UI with contract info
      await updateContractInfo();
      
    } catch(e) {
      alert('Connect your Universal Profile first!');
      window.open(UP_BROWSER_EXTENSION, '_blank');
    }
  } else {
    alert('Install LUKSO Universal Profile Extension');
    window.open(UP_BROWSER_EXTENSION, '_blank');
  }
}

async function updateContractInfo() {
  if (!contract) return;
  
  try {
    const mintPrice = await contract.mintPrice();
    const totalSupply = await contract.totalSupply();
    const mintedCount = await contract.mintedCount();
    const maxPerWallet = await contract.maxPerWallet();
    
    // Update UI elements if they exist
    const infoEl = document.getElementById('contract-info');
    if (infoEl) {
      infoEl.innerHTML = `
        <p>💰 Price: ${ethers.utils.formatEther(mintPrice)} LYX</p>
        <p>📦 Minted: ${mintedCount}/${totalSupply}</p>
        <p>👛 Max per wallet: ${maxPerWallet}</p>
      `;
    }
  } catch (e) {
    console.error('Error fetching contract info:', e);
  }
}

async function mintNFT() {
  if(!signer || !contract) {
    alert('Connect your UP first!');
    return;
  }
  
  try {
    // Get mint price
    const mintPrice = await contract.mintPrice();
    const totalSupply = await contract.totalSupply();
    
    // Generate random tokenId (0 to totalSupply-1)
    const tokenId = Math.floor(Math.random() * totalSupply);
    
    console.log(`Minting token #${tokenId}...`);
    
    // Call mint function with payment
    const tx = await contract.mint(tokenId, {
      value: mintPrice,
      gasLimit: 300000
    });
    
    console.log('Transaction sent:', tx.hash);
    alert(`Minting in progress! TX: ${tx.hash.slice(0, 20)}...`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);
    
    alert('✅ NFT Minted successfully!');
    
    // Refresh contract info
    await updateContractInfo();
    
  } catch (e) {
    console.error('Mint error:', e);
    alert('❌ Mint failed: ' + (e.reason || e.message));
  }
}

// Check if already connected on load
window.addEventListener('load', async () => {
  if (window.ethereum && window.ethereum.selectedAddress) {
    await connectUP();
  }
});
