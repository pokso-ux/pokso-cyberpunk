// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";

/**
 * @title POKSOLSP8Pure
 * @dev Pure LSP8 contract for POKSO Cyberpunk - Owner-only minting (no payments)
 * Standard LSP8 with proper Universal Profile compatibility
 */
contract POKSOLSP8Pure is LSP8IdentifiableDigitalAsset {
    
    uint256 public constant MAX_SUPPLY = 500;
    uint256 public currentTokenId;
    
    constructor(address owner) 
        LSP8IdentifiableDigitalAsset(
            "POKSO Cyberpunk",
            "POKSO",
            owner,
            1, // lsp4TokenType: 1 = NFT
            0  // lsp8TokenIdFormat: 0 = uint256
        ) 
    {}
    
    /**
     * @notice Mint a single NFT to recipient (owner only, free)
     * @param recipient Address to receive the NFT
     * @return tokenId The ID of the minted token
     */
    function mintTo(address recipient) external onlyOwner returns (bytes32 tokenId) {
        require(currentTokenId < MAX_SUPPLY, "POKSOLSP8Pure: max supply reached");
        tokenId = bytes32(currentTokenId);
        _mint(recipient, tokenId, true, "");
        currentTokenId++;
    }
    
    /**
     * @notice Batch mint multiple NFTs to recipient (owner only)
     * @param recipient Address to receive the NFTs
     * @param amount Number of NFTs to mint
     */
    function batchMintTo(address recipient, uint256 amount) external onlyOwner {
        require(currentTokenId + amount <= MAX_SUPPLY, "POKSOLSP8Pure: not enough supply");
        for (uint256 i = 0; i < amount; i++) {
            _mint(recipient, bytes32(currentTokenId), true, "");
            currentTokenId++;
        }
    }
}
