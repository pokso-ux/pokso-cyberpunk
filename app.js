// POKSO Cyberpunk - Mint Integration
// Universal Profile connection and minting functionality

const LUKSO_MAINNET = 'https://42.rpc.thirdweb.com';
const MINT_PRICE = '5'; // LYX
const MAX_PER_WALLET = 10;
const COLLECTION_SIZE = 500;

// NEW REAL CONTRACT ADDRESS (COMPILED!)
const NFT_CONTRACT_ADDRESS = '0x77c33Cb3283Af1e3241b333AFd00A341Fa464795';

// POKSOMinter ABI
const NFT_ABI = [
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

let provider = null;
let signer = null;
let userAddress = null;
let upAddress = null;
let nftContract = null;

// Check if mobile device
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if UP browser extension is installed
function isUPExtensionInstalled() {
  return window.lukso || window.ethereum;
}

// Show mobile connection modal
function showMobileModal() {
  const modal = document.createElement('div');
  modal.id = 'mobile-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(10,10,15,0.98);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 100000;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="text-align: center; max-width: 400px;">
      <h2 style="color: #00ff41; margin-bottom: 20px; font-size: 1.8rem;">📱 Mobile Detected</h2>
      <p style="color: #fff; margin-bottom: 30px; line-height: 1.6;">
        Pour te connecter sur mobile, tu dois ouvrir ce site dans une app wallet :
      </p>
      
      <div style="margin-bottom: 20px;">
        <a href="https://metamask.app.link/dapp/pokso-ux.github.io/pokso-cyberpunk/" style="
          display: block;
          background: #ff00ff;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          margin-bottom: 15px;
          font-weight: bold;
        ">🦊 Ouvrir dans MetaMask</a>
        
        <a href="https://r.jina.ai/http://pokso-ux.github.io/pokso-cyberpunk/" style="
          display: block;
          background: #1a1a2e;
          color: #00ff41;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          border: 2px solid #00ff41;
          margin-bottom: 15px;
          font-weight: bold;
        ">🆙 Guide LUKSO Mobile</a>
      </div>
      
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
        <h3 style="color: #ff00ff; margin-bottom: 10px;">📋 Instructions :</h3>
        <ol style="color: #00ff41; line-height: 1.8; padding-left: 20px;">
          <li>Installe <strong>MetaMask</strong> ou <strong>Universal Profile</strong> app</li>
          <li>Crée/importe ton wallet</li>
          <li>Ouvre le <strong>navigateur intégré</strong> dans l'app</li>
          <li>Va sur <code style="background:#333;padding:2px 5px;">pokso-ux.github.io/pokso-cyberpunk</code></li>
          <li>Connecte-toi et mint !</li>
        </ol>
      </div>
      
      <button onclick="document.getElementById('mobile-modal').remove()" style="
        background: transparent;
        border: 1px solid #666;
        color: #666;
        padding: 10px 30px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
      ">Fermer</button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Connect Universal Profile
async function connectUP() {
  try {
    // Check if mobile
    if (isMobile() && !isUPExtensionInstalled()) {
      showMobileModal();
      return;
    }
    
    // Try Universal Profile extension first
    if (window.lukso) {
      provider = new ethers.providers.Web3Provider(window.lukso, 'any');
      await provider.send('eth_requestAccounts', []);
      signer = provider.getSigner();
      
      // Get the Universal Profile address
      const accounts = await provider.listAccounts();
      upAddress = accounts[0];
      
      // Initialize NFT contract
      nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      
      // Display connected
      updateUIConnected(upAddress);
      showMessage('Universal Profile connected!', 'success');
      
      // Update contract info
      await updateContractInfo();
      return;
    }
    
    // Fallback to regular MetaMask or other wallets
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      await provider.send('eth_requestAccounts', []);
      signer = provider.getSigner();
      
      const accounts = await provider.listAccounts();
      userAddress = accounts[0];
      
      // Initialize NFT contract
      nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      
      updateUIConnected(userAddress);
      showMessage('Wallet connected!', 'success');
      
      // Update contract info
      await updateContractInfo();
      return;
    }
    
    // No wallet found - show install message
    if (isMobile()) {
      showMobileModal();
    } else {
      showMessage('Please install Universal Profile browser extension', 'error');
      window.open('https://my.universalprofile.cloud/', '_blank');
    }
    
  } catch (error) {
    console.error('Connection error:', error);
    showMessage('Failed to connect: ' + error.message, 'error');
  }
}

// Update UI when connected
function updateUIConnected(address) {
  const btn = document.querySelector('.connect-btn');
  if (btn) {
    btn.textContent = address.slice(0, 6) + '...' + address.slice(-4);
    btn.style.background = '#00ff41';
    btn.style.color = '#0a0a0f';
  }
}

// Update contract info display
async function updateContractInfo() {
  if (!nftContract) return;
  
  try {
    const mintPrice = await nftContract.mintPrice();
    const totalSupply = await nftContract.totalSupply();
    const mintedCount = await nftContract.mintedCount();
    const maxPerWallet = await nftContract.maxPerWallet();
    
    // Update UI elements if they exist
    const priceEl = document.getElementById('mint-price');
    const supplyEl = document.getElementById('minted-count');
    const maxEl = document.getElementById('max-per-wallet');
    
    if (priceEl) priceEl.textContent = ethers.utils.formatEther(mintPrice) + ' LYX';
    if (supplyEl) supplyEl.textContent = `${mintedCount}/${totalSupply}`;
    if (maxEl) maxEl.textContent = maxPerWallet;
    
  } catch (e) {
    console.error('Error fetching contract info:', e);
  }
}

// Contract status - NOW READY!
const CONTRACT_READY = true;

// Show message to user
function showMessage(text, type = 'info') {
  // Remove existing messages
  const existing = document.querySelector('.message-toast');
  if (existing) existing.remove();
  
  const msg = document.createElement('div');
  msg.className = 'message-toast';
  msg.textContent = text;
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 15px 30px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    z-index: 10000;
    animation: slideDown 0.3s ease;
    ${type === 'success' ? 'background: #00ff41; color: #0a0a0f; border: 2px solid #00ff41;' : ''}
    ${type === 'error' ? 'background: #ff0040; color: white; border: 2px solid #ff0040;' : ''}
    ${type === 'info' ? 'background: #00f5ff; color: #0a0a0f; border: 2px solid #00f5ff;' : ''}
  `;
  
  document.body.appendChild(msg);
  
  setTimeout(() => {
    msg.remove();
  }, 5000);
}

// Get random unminted token ID
async function getRandomTokenId() {
  return Math.floor(Math.random() * COLLECTION_SIZE);
}

// Mint NFT function
async function mintNFT() {
  if (!signer || !nftContract) {
    showMessage('Please connect your wallet first!', 'error');
    return;
  }
  
  try {
    showMessage('Preparing mint...', 'info');
    
    // Check how many user has minted
    const userMinted = await nftContract.mintedByWallet(upAddress || userAddress);
    if (userMinted >= MAX_PER_WALLET) {
      showMessage('❌ Max minted! You can only mint ' + MAX_PER_WALLET + ' NFTs.', 'error');
      return;
    }
    
    // Get random token ID
    const tokenId = await getRandomTokenId();
    
    // Get mint price from contract
    const mintPrice = await nftContract.mintPrice();
    
    console.log(`Minting token #${tokenId} for ${ethers.utils.formatEther(mintPrice)} LYX...`);
    
    showMessage('Please confirm the transaction...', 'info');
    
    // Call contract mint function
    const tx = await nftContract.mint(tokenId, {
      value: mintPrice,
      gasLimit: 300000
    });
    
    console.log('Transaction sent:', tx.hash);
    showMessage('Transaction sent! Waiting for confirmation...', 'info');
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      showMessage(`🎉 Successfully minted POKSO #${tokenId}!`, 'success');
      // Show the minted NFT
      showMintedNFT(tokenId);
      // Refresh contract info
      await updateContractInfo();
    } else {
      showMessage('Transaction failed. Please try again.', 'error');
    }
    
  } catch (error) {
    console.error('Mint error:', error);
    if (error.code === 4001) {
      showMessage('Transaction rejected by user.', 'error');
    } else {
      showMessage('❌ Mint failed: ' + (error.reason || error.message), 'error');
    }
  }
}

// Show minted NFT preview
function showMintedNFT(tokenId) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="text-align: center; padding: 40px; border: 2px solid #00ff41; background: #0a0a0f; max-width: 400px;">
      <h2 style="color: #00ff41; margin-bottom: 20px;">🎉 MINTED!</h2>
      <img src="nfts/${tokenId}.png" alt="POKSO #${tokenId}" style="width: 250px; height: 250px; border: 2px solid #ff00ff; margin: 20px 0;" onerror="this.src='https://pokso-ux.github.io/pokso-cyberpunk/${tokenId}.png'">
      <p style="color: #ff00ff; font-size: 1.5rem; font-weight: bold;">POKSO #${String(tokenId).padStart(3, '0')}</p>
      <p style="color: #00ff41; margin: 10px 0;">Welcome to the cyberpunk future!</p>
      <p style="color: #666; font-size: 0.8rem; margin-top: 10px;">Contract: ${NFT_CONTRACT_ADDRESS.slice(0,10)}...</p>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: #ff00ff;
        border: none;
        color: white;
        padding: 15px 40px;
        font-size: 1.2rem;
        cursor: pointer;
        margin-top: 20px;
        font-family: 'Courier New', monospace;
      ">CLOSE</button>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Check if user has minted before
async function checkMintedCount() {
  if (!signer || !nftContract) return 0;
  
  try {
    const count = await nftContract.mintedByWallet(upAddress || userAddress);
    return count;
  } catch (error) {
    console.error('Error checking minted count:', error);
    return 0;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if already connected
  if (window.lukso && window.lukso.selectedAddress) {
    connectUP();
  }
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
});

// Export functions for global access
window.connectUP = connectUP;
window.mintNFT = mintNFT;
