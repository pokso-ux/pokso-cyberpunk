// POKSO NFT Mint Contract - LUKSO LSP8
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// Interfaces LUKSO
interface ILSP8IdentifiableDigitalAsset {
    function mint(
        address to,
        bytes32 tokenId,
        bool force,
        bytes memory data
    ) external;
}

contract POKSOMinter {
    address public owner;
    address public nftContract;
    uint256 public mintPrice = 5 ether; // 5 LYX
    uint256 public maxPerWallet = 10;
    uint256 public totalSupply = 500;
    uint256 public mintedCount = 0;
    
    mapping(address => uint256) public mintedByWallet;
    mapping(uint256 => bool) public tokenMinted;
    
    event Mint(address indexed minter, uint256 indexed tokenId, uint256 price);
    event Withdraw(address indexed to, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _nftContract) {
        owner = msg.sender;
        nftContract = _nftContract;
    }
    
    // Mint a random NFT
    function mint() external payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(mintedCount < totalSupply, "All NFTs minted");
        require(mintedByWallet[msg.sender] < maxPerWallet, "Max per wallet reached");
        
        // Get random available token ID
        uint256 tokenId = getRandomAvailableId();
        require(!tokenMinted[tokenId], "Token already minted");
        
        // Mark as minted
        tokenMinted[tokenId] = true;
        mintedByWallet[msg.sender]++;
        mintedCount++;
        
        // Mint NFT (simplified - would integrate with LSP8)
        // In production, this would call the LSP8 contract
        
        emit Mint(msg.sender, tokenId, mintPrice);
        
        // Refund excess
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }
    
    // Get random available token ID
    function getRandomAvailableId() internal view returns (uint256) {
        // Simplified random - in production use Chainlink VRF
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            mintedCount
        )));
        return random % totalSupply;
    }
    
    // Withdraw funds
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        
        payable(owner).transfer(balance);
        emit Withdraw(owner, balance);
    }
    
    // Update mint price
    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }
    
    // Update max per wallet
    function setMaxPerWallet(uint256 _max) external onlyOwner {
        maxPerWallet = _max;
    }
    
    // Receive function
    receive() external payable {}
}

// Deployment instructions:
// 1. Deploy this contract with the LSP8 NFT contract address
// 2. Set the NFT contract address
// 3. Users can call mint() with 5 LYX
// 4. Owner can withdraw funds
