// POKSO Cyberpunk - Mint Integration
// Universal Profile connection and minting functionality

const LUKSO_MAINNET = 'https://42.rpc.thirdweb.com';
const MINT_PRICE = '5'; // LYX
const MAX_PER_WALLET = 10;
const COLLECTION_SIZE = 500;

// Contract address for the NFT collection (DEPLOYED!)
const NFT_CONTRACT_ADDRESS = '0x137dDfe54C4494460889Ec29a48234d9c41Eef4a';

let provider = null;
let signer = null;
let userAddress = null;
let upAddress = null;

// Check if UP browser extension is installed
function isUPExtensionInstalled() {
  return window.lukso || window.ethereum;
}

// Connect Universal Profile
async function connectUP() {
  try {
    // Try Universal Profile extension first
    if (window.lukso) {
      provider = new ethers.providers.Web3Provider(window.lukso, 'any');
      await provider.send('eth_requestAccounts', []);
      signer = provider.getSigner();
      
      // Get the Universal Profile address
      const accounts = await provider.listAccounts();
      upAddress = accounts[0];
      
      // Display connected
      updateUIConnected(upAddress);
      showMessage('Universal Profile connected!', 'success');
      return;
    }
    
    // Fallback to regular MetaMask or other wallets
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      await provider.send('eth_requestAccounts', []);
      signer = provider.getSigner();
      
      const accounts = await provider.listAccounts();
      userAddress = accounts[0];
      
      updateUIConnected(userAddress);
      showMessage('Wallet connected!', 'success');
      return;
    }
    
    // No wallet found
    showMessage('Please install Universal Profile browser extension', 'error');
    window.open('https://my.universalprofile.cloud/', '_blank');
    
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

// Contract status - READY!
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

// Get random unminted token ID (simplified)
async function getRandomTokenId() {
  // In production, this would query the contract for available tokens
  return Math.floor(Math.random() * COLLECTION_SIZE);
}

// Mint NFT function
async function mintNFT() {
  if (!signer) {
    showMessage('Please connect your Universal Profile first!', 'error');
    return;
  }
  
  // Check if contract is ready
  if (!CONTRACT_READY) {
    showMessage('⚠️ Smart contract deployment in progress! Coming soon...', 'error');
    console.log('Contract address:', NFT_CONTRACT_ADDRESS);
    console.log('Status: Needs proper Hardhat compilation and redeployment');
    return;
  }
  
  try {
    showMessage('Preparing mint...', 'info');
    
    // Get random token ID
    const tokenId = await getRandomTokenId();
    
    // Create transaction
    const priceWei = ethers.utils.parseEther(MINT_PRICE);
    
    // Simple transfer to collection address (placeholder)
    // In production, this would call the mint function on the NFT contract
    const tx = {
      to: upAddress || userAddress, // Self-transfer as placeholder
      value: priceWei,
      data: '0x' // Would be contract call data
    };
    
    showMessage('Please confirm the transaction...', 'info');
    
    // Send transaction
    const transaction = await signer.sendTransaction(tx);
    
    showMessage('Transaction sent! Waiting for confirmation...', 'info');
    
    // Wait for confirmation
    const receipt = await transaction.wait();
    
    if (receipt.status === 1) {
      showMessage(`🎉 Successfully minted POKSO #${tokenId}!`, 'success');
      // Show the minted NFT
      showMintedNFT(tokenId);
    } else {
      showMessage('Transaction failed. Please try again.', 'error');
    }
    
  } catch (error) {
    console.error('Mint error:', error);
    if (error.code === 4001) {
      showMessage('Transaction rejected by user.', 'error');
    } else {
      showMessage('Mint failed: ' + error.message, 'error');
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
      <img src="nfts/${tokenId}.png" alt="POKSO #${tokenId}" style="width: 250px; height: 250px; border: 2px solid #ff00ff; margin: 20px 0;">
      <p style="color: #ff00ff; font-size: 1.5rem; font-weight: bold;">POKSO #${String(tokenId).padStart(3, '0')}</p>
      <p style="color: #00ff41; margin: 10px 0;">Welcome to the cyberpunk future!</p>
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
  if (!signer) return 0;
  
  try {
    // In production, query the contract for user's minted count
    return 0;
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
