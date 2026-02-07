// POKSO Cyberpunk - Mint Integration (REAL LSP8 Version)
// Universal Profile connection and batch minting functionality

const LUKSO_MAINNET = 'https://42.rpc.thirdweb.com';
const MINT_PRICE = '5'; // LYX
const MAX_PER_WALLET = 10;
const COLLECTION_SIZE = 500;

// CLEAN ARCHITECTURE: Minter Contract (handles payments)
const NFT_CONTRACT_ADDRESS = '0x16addb441f840c261504d9CfAc526B6b1345C6B4';
const LSP8_CONTRACT_ADDRESS = '0x88Bc1269F85C6Bb83DC229ef9Cb45108F0947474'; // Pure LSP8 (for reference)

// POKSOMinterV2 ABI (Payment Handler)
const NFT_ABI = [
  "constructor(address)",
  "function mint() payable",
  "function batchMint(uint256 amount) payable",
  "function mintPrice() view returns (uint256)",
  "function MAX_PER_WALLET() view returns (uint256)",
  "function mintedByWallet(address) view returns (uint256)",
  "function lsp8() view returns (address)",
  "function owner() view returns (address)",
  "function withdraw()",
  "function getMintInfo(address user) view returns (uint256 minted, uint256 remaining, uint256 currentId)",
  "event Mint(address indexed minter, bytes32 indexed tokenId, uint256 price)",
  "event BatchMint(address indexed minter, uint256 amount, uint256 totalPrice)",
  "event Withdrawal(address indexed owner, uint256 amount)"
];

let provider = null;
let signer = null;
let userAddress = null;
let upAddress = null;
let nftContract = null;
let mintQuantity = 1;

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isUPExtensionInstalled() {
  return window.lukso || window.ethereum;
}

function showMobileModal() {
  const modal = document.createElement('div');
  modal.id = 'mobile-modal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(10,10,15,0.98); display: flex; flex-direction: column;
    justify-content: center; align-items: center; z-index: 100000; padding: 20px;
  `;
  modal.innerHTML = `
    <div style="text-align: center; max-width: 400px;">
      <h2 style="color: #00ff41; margin-bottom: 20px; font-size: 1.8rem;">📱 Mobile Detected</h2>
      <p style="color: #fff; margin-bottom: 30px; line-height: 1.6;">
        Pour te connecter sur mobile, ouvre ce site dans une app wallet :
      </p>
      <a href="https://metamask.app.link/dapp/pokso-ux.github.io/pokso-cyberpunk/" style="
        display: block; background: #ff00ff; color: white; padding: 15px 30px;
        text-decoration: none; border-radius: 8px; margin-bottom: 15px; font-weight: bold;
      ">🦊 Ouvrir dans MetaMask</a>
      <div style="background: #1a1a2e; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
        <h3 style="color: #ff00ff; margin-bottom: 10px;">📋 Instructions :</h3>
        <ol style="color: #00ff41; line-height: 1.8; padding-left: 20px;">
          <li>Installe <strong>MetaMask</strong> ou <strong>Universal Profile</strong> app</li>
          <li>Ouvre le <strong>navigateur intégré</strong> dans l'app</li>
          <li>Va sur <code style="background:#333;padding:2px 5px;">pokso-ux.github.io/pokso-cyberpunk</code></li>
          <li>Connecte-toi et mint !</li>
        </ol>
      </div>
      <button onclick="document.getElementById('mobile-modal').remove()" style="
        background: transparent; border: 1px solid #666; color: #666;
        padding: 10px 30px; cursor: pointer; font-family: 'Courier New', monospace;
      ">Fermer</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function updateQuantity(change) {
  const quantityDisplay = document.getElementById('quantity-display');
  if (!quantityDisplay) return;
  mintQuantity += change;
  if (mintQuantity < 1) mintQuantity = 1;
  if (mintQuantity > 10) mintQuantity = 10;
  quantityDisplay.textContent = mintQuantity;
  updateTotalPrice();
}

function updateTotalPrice() {
  const totalPriceEl = document.getElementById('total-price');
  if (totalPriceEl) {
    const total = parseFloat(MINT_PRICE) * mintQuantity;
    totalPriceEl.textContent = total + ' LYX';
  }
}

async function connectUP() {
  try {
    if (isMobile() && !isUPExtensionInstalled()) {
      showMobileModal();
      return;
    }
    
    if (window.lukso) {
      provider = new ethers.providers.Web3Provider(window.lukso, 'any');
      await provider.send('eth_requestAccounts', []);
      signer = provider.getSigner();
      const accounts = await provider.listAccounts();
      upAddress = accounts[0];
      userAddress = upAddress;
      nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      updateUIConnected(upAddress);
      showMessage('Universal Profile connected!', 'success');
      await updateContractInfo();
      return;
    }
    
    if (window.ethereum) {
      provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      await provider.send('eth_requestAccounts', []);
      signer = provider.getSigner();
      const accounts = await provider.listAccounts();
      userAddress = accounts[0];
      nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      updateUIConnected(userAddress);
      showMessage('Wallet connected!', 'success');
      await updateContractInfo();
      return;
    }
    
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

function updateUIConnected(address) {
  const btn = document.querySelector('.connect-btn');
  if (btn) {
    btn.textContent = address.slice(0, 6) + '...' + address.slice(-4);
    btn.style.background = '#00ff41';
    btn.style.color = '#0a0a0f';
  }
}

async function updateContractInfo() {
  if (!nftContract) return;
  try {
    const mintPrice = await nftContract.mintPrice();
    const maxPerWallet = await nftContract.MAX_PER_WALLET();
    const mintInfo = await nftContract.getMintInfo(userAddress || upAddress);
    
    const priceEl = document.getElementById('mint-price');
    const supplyEl = document.getElementById('minted-count');
    const maxEl = document.getElementById('max-per-wallet');
    
    if (priceEl) priceEl.textContent = ethers.utils.formatEther(mintPrice) + ' LYX';
    if (supplyEl) supplyEl.textContent = mintInfo.currentId + '/500';
    if (maxEl) maxEl.textContent = maxPerWallet.toString();
  } catch (e) {
    console.error('Error fetching contract info:', e);
  }
}

function showMessage(text, type) {
  const existing = document.querySelector('.message-toast');
  if (existing) existing.remove();
  
  const msg = document.createElement('div');
  msg.className = 'message-toast';
  msg.textContent = text;
  msg.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    padding: 15px 30px; border-radius: 8px; font-family: 'Courier New', monospace;
    font-weight: bold; z-index: 10000; animation: slideDown 0.3s ease;
    ${type === 'success' ? 'background: #00ff41; color: #0a0a0f;' : ''}
    ${type === 'error' ? 'background: #ff0040; color: white;' : ''}
    ${type === 'info' ? 'background: #00f5ff; color: #0a0a0f;' : ''}
  `;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 5000);
}

async function mintNFT() {
  if (!signer || !nftContract) {
    showMessage('Please connect your wallet first!', 'error');
    return;
  }
  
  try {
    const address = upAddress || userAddress;
    const userMinted = await nftContract.mintedByWallet(address);
    
    if (parseInt(userMinted) + mintQuantity > MAX_PER_WALLET) {
      showMessage('❌ Max reached! You can only mint ' + MAX_PER_WALLET + ' total.', 'error');
      return;
    }
    
    const mintPriceWei = ethers.utils.parseEther(MINT_PRICE);
    const totalPrice = mintPriceWei.mul(mintQuantity);
    
    showMessage('Please confirm the transaction...', 'info');
    
    let tx;
    // Use batchMint - it automatically uses the next available tokenId
    tx = await nftContract.batchMint(mintQuantity, { value: totalPrice, gasLimit: 500000 });
    
    console.log('Transaction sent:', tx.hash);
    showMessage('Transaction sent! Waiting...', 'info');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      showMessage(`🎉 Successfully minted ${mintQuantity} POKSO!`, 'success');
      await updateContractInfo();
    } else {
      showMessage('Transaction failed.', 'error');
    }
  } catch (error) {
    console.error('Mint error:', error);
    if (error.code === 4001) {
      showMessage('Transaction rejected.', 'error');
    } else {
      showMessage('❌ Mint failed: ' + (error.reason || error.message), 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.lukso && window.lukso.selectedAddress) {
    connectUP();
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translate(-50%, -100%); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
});

window.connectUP = connectUP;
window.mintNFT = mintNFT;
window.updateQuantity = updateQuantity;
