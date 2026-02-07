// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @notice Interface for the POKSOLSP8Pure contract
 */
interface IPOKSOLSP8Pure {
    function mintTo(address recipient) external returns (bytes32);
    function batchMintTo(address recipient, uint256 amount) external;
    function currentTokenId() external view returns (uint256);
    function maxSupply() external pure returns (uint256);
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
}

/**
 * @title POKSOMinter
 * @dev Handles payments (5 LYX) and mints via LSP8 contract
 * Users interact with this contract to mint NFTs
 */
contract POKSOMinter {
    
    uint256 public constant MINT_PRICE = 5 ether;
    uint256 public constant MAX_PER_WALLET = 10;
    
    IPOKSOLSP8Pure public lsp8;
    mapping(address => uint256) public mintedByWallet;
    address public owner;
    
    event Mint(address indexed minter, bytes32 indexed tokenId, uint256 price);
    event BatchMint(address indexed minter, uint256 amount, uint256 totalPrice);
    
    constructor(address lsp8Address) {
        lsp8 = IPOKSOLSP8Pure(lsp8Address);
        owner = msg.sender;
    }
    
    /**
     * @notice Public paid mint - 5 LYX per NFT
     */
    function mint() external payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(mintedByWallet[msg.sender] < MAX_PER_WALLET, "Max per wallet reached");
        require(lsp8.currentTokenId() < 500, "Max supply reached");
        
        bytes32 tokenId = lsp8.mintTo(msg.sender);
        mintedByWallet[msg.sender]++;
        
        // Refund excess
        if (msg.value > MINT_PRICE) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE);
        }
        
        emit Mint(msg.sender, tokenId, MINT_PRICE);
    }
    
    /**
     * @notice Public paid batch mint
     * @param amount Number of NFTs to mint (1-10)
     */
    function batchMint(uint256 amount) external payable {
        require(amount > 0 && amount <= 10, "Invalid amount");
        require(mintedByWallet[msg.sender] + amount <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(lsp8.currentTokenId() + amount <= 500, "Not enough supply");
        
        uint256 totalPrice = MINT_PRICE * amount;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        lsp8.batchMintTo(msg.sender, amount);
        mintedByWallet[msg.sender] += amount;
        
        // Refund excess
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit BatchMint(msg.sender, amount, totalPrice);
    }
    
    /**
     * @notice Get user's minted count
     */
    function getMintedByWallet(address wallet) external view returns (uint256) {
        return mintedByWallet[wallet];
    }
    
    /**
     * @notice Get remaining supply
     */
    function remainingSupply() external view returns (uint256) {
        return 500 - lsp8.currentTokenId();
    }
    
    /**
     * @notice Withdraw all funds to owner
     */
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
