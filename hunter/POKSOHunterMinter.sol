// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Simplified LSP8 interface
interface ILSP8 {
    function mintTo(address recipient, bytes32 tokenId) external;
    function setDataForTokenId(bytes32 tokenId, bytes32 dataKey, bytes memory dataValue) external;
}

/**
 * @title POKSOHunterMinter
 * @dev Minter contract for POKSO Hunter game
 * Players find NFTs in-game and can mint them here
 */
contract POKSOHunterMinter {
    
    address public owner;
    ILSP8 public lsp8;
    
    // Track which tokens are still available to find
    mapping(bytes32 => bool) public availableTokens;
    mapping(bytes32 => bool) public foundTokens;
    
    // Track who found which token (for first-come-first-served)
    mapping(bytes32 => address) public tokenFinder;
    
    // Clues and answers (simplified - in production, use merkle proofs)
    mapping(bytes32 => string) public tokenClues;
    mapping(bytes32 => string) public tokenAnswers;
    
    // Price per mint (can be 0 for free)
    uint256 public mintPrice;
    
    event TokenFound(bytes32 indexed tokenId, address indexed finder, string location);
    event TokenMinted(bytes32 indexed tokenId, address indexed owner);
    event ClueVerified(bytes32 indexed tokenId, address indexed player, bool correct);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _lsp8, uint256 _mintPrice) {
        lsp8 = ILSP8(_lsp8);
        owner = msg.sender;
        mintPrice = _mintPrice;
    }
    
    /**
     * @dev Set up a token to be found
     * @param tokenId The token ID (0, 1, 2, etc.)
     * @param clue The clue text
     * @param answer The expected answer
     */
    function setupToken(
        bytes32 tokenId,
        string memory clue,
        string memory answer
    ) external onlyOwner {
        availableTokens[tokenId] = true;
        foundTokens[tokenId] = false;
        tokenClues[tokenId] = clue;
        tokenAnswers[tokenId] = answer;
    }
    
    /**
     * @dev Check if a player found the correct answer
     * This would be called from the game frontend after player solves puzzle
     */
    function verifyClue(bytes32 tokenId, string memory playerAnswer) 
        external 
        view 
        returns (bool correct) 
    {
        require(availableTokens[tokenId], "Token not available");
        
        string memory expected = tokenAnswers[tokenId];
        
        // Simple string comparison (case-insensitive in production)
        correct = keccak256(abi.encodePacked(playerAnswer)) == 
                  keccak256(abi.encodePacked(expected));
    }
    
    /**
     * @dev Claim a found token - mints it to the caller
     * First-come-first-served!
     */
    function claimFoundToken(bytes32 tokenId, string memory location) 
        external 
        payable 
    {
        require(availableTokens[tokenId], "Token not available");
        require(!foundTokens[tokenId], "Token already found!");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        // Mark as found by this player
        foundTokens[tokenId] = true;
        tokenFinder[tokenId] = msg.sender;
        
        // Mint the NFT to the player using the game's LSP8
        lsp8.mintTo(msg.sender, tokenId);
        
        // Set metadata (VerifiableURI format)
        bytes memory metadataUrl = abi.encodePacked(
            hex"6f357c6a", // VerifiableURI prefix
            bytes32(0), // hash (empty for now)
            "https://pokso-ux.github.io/pokso-cyberpunk/nfts/",
            _uint256ToString(uint256(tokenId)),
            ".json"
        );
        
        lsp8.setDataForTokenId(
            tokenId,
            0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e, // LSP4Metadata
            metadataUrl
        );
        
        emit TokenFound(tokenId, msg.sender, location);
        emit TokenMinted(tokenId, msg.sender);
        
        // Refund excess
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }
    
    /**
     * @dev Emergency function to allow owner to reset a token
     * (if game needs restart or bug fix)
     */
    function resetToken(bytes32 tokenId) external onlyOwner {
        foundTokens[tokenId] = false;
        tokenFinder[tokenId] = address(0);
    }
    
    /**
     * @dev Update mint price
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }
    
    /**
     * @dev Withdraw funds
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        payable(owner).call{value: balance}("");
    }
    
    /**
     * @dev Helper: convert uint to string
     */
    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
