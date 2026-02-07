// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title POKSOLSP8
 * @dev LSP8-compatible NFT collection for POKSO Cyberpunk
 * Simplified implementation for LUKSO blockchain
 * Compatible with Universal Profile (LSP8 standard events)
 */
contract POKSOLSP8 is Ownable, ReentrancyGuard {
    
    // Token metadata
    string public name;
    string public symbol;
    
    // Minting parameters
    uint256 public constant MINT_PRICE = 5 ether; // 5 LYX
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public constant TOTAL_SUPPLY = 500;
    
    // Tracking
    uint256 public currentTokenId;
    mapping(address => uint256) public mintedByWallet;
    mapping(uint256 => address) public tokenOwner;
    mapping(uint256 => bool) public tokenExists;
    mapping(address => uint256[]) public ownedTokens;
    mapping(uint256 => uint256) public ownedTokenIndex;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // LSP8 Events (for Universal Profile compatibility)
    event Transfer(address indexed operator, address indexed from, address indexed to, bytes32 tokenId, bool force, bytes data);
    event Mint(address indexed minter, bytes32 indexed tokenId, uint256 price);
    event BatchMint(address indexed minter, uint256 amount, uint256 totalPrice);
    event Withdrawal(address indexed owner, uint256 amount);
    event AuthorizedOperator(address indexed operator, address indexed tokenOwner, bytes32 indexed tokenId);
    event RevokedOperator(address indexed operator, address indexed tokenOwner, bytes32 indexed tokenId);
    
    constructor(
        string memory name_,
        string memory symbol_,
        address newOwner_,
        string memory baseURI_
    ) {
        name = name_;
        symbol = symbol_;
        _baseTokenURI = baseURI_;
        
        if (newOwner_ != msg.sender) {
            transferOwnership(newOwner_);
        }
    }
    
    /**
     * @notice Mint a single POKSO NFT
     * @param tokenId The unique token ID to mint
     */
    function mint(uint256 tokenId) external payable nonReentrant {
        require(msg.value >= MINT_PRICE, "POKSOLSP8: insufficient payment");
        require(currentTokenId < TOTAL_SUPPLY, "POKSOLSP8: max supply reached");
        require(mintedByWallet[msg.sender] < MAX_PER_WALLET, "POKSOLSP8: max per wallet reached");
        require(!tokenExists[tokenId], "POKSOLSP8: token already minted");
        require(tokenId < TOTAL_SUPPLY, "POKSOLSP8: invalid token ID");
        
        // Mint the token
        tokenOwner[tokenId] = msg.sender;
        tokenExists[tokenId] = true;
        ownedTokenIndex[tokenId] = ownedTokens[msg.sender].length;
        ownedTokens[msg.sender].push(tokenId);
        
        // Update tracking
        currentTokenId++;
        mintedByWallet[msg.sender]++;
        
        // Refund excess
        if (msg.value > MINT_PRICE) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE);
        }
        
        // Emit LSP8-compatible Transfer event
        emit Transfer(msg.sender, address(0), msg.sender, bytes32(tokenId), true, "");
        emit Mint(msg.sender, bytes32(tokenId), MINT_PRICE);
    }
    
    /**
     * @notice Batch mint multiple POKSO NFTs
     * @param amount Number of NFTs to mint (1-10)
     */
    function batchMint(uint256 amount) external payable nonReentrant {
        require(amount > 0 && amount <= 10, "POKSOLSP8: invalid amount");
        require(currentTokenId + amount <= TOTAL_SUPPLY, "POKSOLSP8: not enough supply");
        require(mintedByWallet[msg.sender] + amount <= MAX_PER_WALLET, "POKSOLSP8: exceeds max per wallet");
        
        uint256 totalPrice = MINT_PRICE * amount;
        require(msg.value >= totalPrice, "POKSOLSP8: insufficient payment");
        
        // Mint each token
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = currentTokenId;
            
            tokenOwner[tokenId] = msg.sender;
            tokenExists[tokenId] = true;
            ownedTokenIndex[tokenId] = ownedTokens[msg.sender].length;
            ownedTokens[msg.sender].push(tokenId);
            
            currentTokenId++;
            
            emit Transfer(msg.sender, address(0), msg.sender, bytes32(tokenId), true, "");
            emit Mint(msg.sender, bytes32(tokenId), MINT_PRICE);
        }
        
        // Update wallet count
        mintedByWallet[msg.sender] += amount;
        
        // Refund excess
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit BatchMint(msg.sender, amount, totalPrice);
    }
    
    /**
     * @notice Get the owner of a token
     */
    function tokenOwnerOf(uint256 tokenId) external view returns (address) {
        require(tokenExists[tokenId], "POKSOLSP8: token does not exist");
        return tokenOwner[tokenId];
    }
    
    /**
     * @notice Get all tokens owned by an address
     */
    function tokenIdsOf(address owner_) external view returns (uint256[] memory) {
        return ownedTokens[owner_];
    }
    
    /**
     * @notice Check if a token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenExists[tokenId];
    }
    
    /**
     * @notice Get the total number of minted tokens
     */
    function mintedCount() external view returns (uint256) {
        return currentTokenId;
    }
    
    /**
     * @notice Get the base URI for token metadata
     */
    function getBaseURI() external view returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @notice Update the base URI (owner only)
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    /**
     * @notice Withdraw all funds to the owner
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "POKSOLSP8: no funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "POKSOLSP8: withdrawal failed");
        
        emit Withdrawal(owner(), balance);
    }
    
    /**
     * @notice Get the mint price
     */
    function mintPrice() external pure returns (uint256) {
        return MINT_PRICE;
    }
    
    /**
     * @notice Get the max mint per wallet
     */
    function maxPerWallet() external pure returns (uint256) {
        return MAX_PER_WALLET;
    }
    
    /**
     * @notice Get the total supply
     */
    function totalSupply() external pure returns (uint256) {
        return TOTAL_SUPPLY;
    }
    
    /**
     * @notice Get tokens owned by an address (alias)
     */
    function getTokensOwned(address tokenOwner_) external view returns (uint256[] memory) {
        return ownedTokens[tokenOwner_];
    }
    
    /**
     * @notice Get contract information
     */
    function getContractInfo() external view returns (
        uint256 _mintPrice,
        uint256 _maxPerWallet,
        uint256 _totalSupply,
        uint256 _mintedCount,
        uint256 _availableSupply
    ) {
        return (
            MINT_PRICE,
            MAX_PER_WALLET,
            TOTAL_SUPPLY,
            currentTokenId,
            TOTAL_SUPPLY - currentTokenId
        );
    }
    
    /**
     * @notice Get balance of tokens for an address
     */
    function balanceOf(address owner_) external view returns (uint256) {
        return ownedTokens[owner_].length;
    }
    
    /**
     * @notice Check if an address is the owner of a token
     */
    function isOwnerOf(address owner_, uint256 tokenId) external view returns (bool) {
        return tokenExists[tokenId] && tokenOwner[tokenId] == owner_;
    }
    
    /**
     * @notice Get token URI (for metadata)
     */
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        require(tokenExists[tokenId], "POKSOLSP8: token does not exist");
        return string(abi.encodePacked(_baseTokenURI, uint2str(tokenId), ".json"));
    }
    
    /**
     * @notice Convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        return string(bstr);
    }
    
    receive() external payable {}
}
