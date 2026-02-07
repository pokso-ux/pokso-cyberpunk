// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";

/**
 * @title POKSOLSP8Real
 * @dev REAL LSP8 NFT collection for POKSO Cyberpunk
 * Inherits from LSP8IdentifiableDigitalAsset for full Universal Profile compatibility
 */
contract POKSOLSP8Real is LSP8IdentifiableDigitalAsset {
    
    // Minting parameters
    uint256 public constant MINT_PRICE = 5 ether; // 5 LYX
    uint256 public constant MAX_PER_WALLET = 10;
    uint256 public constant MAX_SUPPLY = 500;
    
    // Tracking
    uint256 public currentTokenId;
    mapping(address => uint256) public mintedByWallet;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Events
    event Mint(address indexed minter, bytes32 indexed tokenId, uint256 price);
    event BatchMint(address indexed minter, uint256 amount, uint256 totalPrice);
    event Withdrawal(address indexed owner, uint256 amount);
    
    constructor(
        string memory name_,
        string memory symbol_,
        address newOwner_,
        string memory baseURI_
    ) LSP8IdentifiableDigitalAsset(
        name_,
        symbol_,
        newOwner_,
        1, // lsp4TokenType: 1 = NFT
        0  // lsp8TokenIdFormat: 0 = uint256 (LSP8TokenIdFormat.UINT256)
    ) {
        _baseTokenURI = baseURI_;
    }
    
    /**
     * @notice Mint a single POKSO NFT
     * @param tokenId The unique token ID to mint (as bytes32 for LSP8 compatibility)
     */
    function mint(bytes32 tokenId) external payable {
        require(msg.value >= MINT_PRICE, "POKSOLSP8Real: insufficient payment");
        require(currentTokenId < MAX_SUPPLY, "POKSOLSP8Real: max supply reached");
        require(mintedByWallet[msg.sender] < MAX_PER_WALLET, "POKSOLSP8Real: max per wallet reached");
        require(!_tokenExists(tokenId), "POKSOLSP8Real: token already minted");
        
        // Mint the token using LSP8 internal function
        _mint(msg.sender, tokenId, true, "");
        
        // Update tracking
        currentTokenId++;
        mintedByWallet[msg.sender]++;
        
        // Refund excess
        if (msg.value > MINT_PRICE) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE);
        }
        
        emit Mint(msg.sender, tokenId, MINT_PRICE);
    }
    
    /**
     * @notice Batch mint multiple POKSO NFTs
     * @param amount Number of NFTs to mint (1-10)
     */
    function batchMint(uint256 amount) external payable {
        require(amount > 0 && amount <= 10, "POKSOLSP8Real: invalid amount");
        require(currentTokenId + amount <= MAX_SUPPLY, "POKSOLSP8Real: not enough supply");
        require(mintedByWallet[msg.sender] + amount <= MAX_PER_WALLET, "POKSOLSP8Real: exceeds max per wallet");
        
        uint256 totalPrice = MINT_PRICE * amount;
        require(msg.value >= totalPrice, "POKSOLSP8Real: insufficient payment");
        
        // Mint each token
        for (uint256 i = 0; i < amount; i++) {
            // Generate tokenId from current index
            bytes32 tokenId = bytes32(currentTokenId);
            
            _mint(msg.sender, tokenId, true, "");
            
            currentTokenId++;
            
            emit Mint(msg.sender, tokenId, MINT_PRICE);
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
     * @notice Check if a token exists
     */
    function _tokenExists(bytes32 tokenId) internal view returns (bool) {
        // Try to get the owner - if it reverts, token doesn't exist
        try this.tokenOwnerOf(tokenId) returns (address) {
            return true;
        } catch {
            return false;
        }
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
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "POKSOLSP8Real: no funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "POKSOLSP8Real: withdrawal failed");
        
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
     * @notice Get the max supply
     */
    function maxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
    
    /**
     * @notice Get contract information
     */
    function getContractInfo() external view returns (
        uint256 _mintPrice,
        uint256 _maxPerWallet,
        uint256 _maxSupply,
        uint256 _mintedCount,
        uint256 _availableSupply
    ) {
        return (
            MINT_PRICE,
            MAX_PER_WALLET,
            MAX_SUPPLY,
            currentTokenId,
            MAX_SUPPLY - currentTokenId
        );
    }
    
    /**
     * @notice Get token URI (for metadata)
     */
    function tokenURI(bytes32 tokenId) external view returns (string memory) {
        require(_tokenExists(tokenId), "POKSOLSP8Real: token does not exist");
        return string(abi.encodePacked(_baseTokenURI, uint2str(uint256(tokenId)), ".json"));
    }
    
    /**
     * @notice Get all tokens owned by an address (helper function)
     */
    function getTokensOf(address tokenOwner_) external view returns (bytes32[] memory) {
        return tokenIdsOf(tokenOwner_);
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
    
    receive() external payable override {}
}
