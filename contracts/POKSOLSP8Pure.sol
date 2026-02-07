// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {_LSP4_METADATA_KEY, _LSP4_CREATORS_ARRAY_KEY, _LSP4_CREATORS_MAP_KEY_PREFIX} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";

// LSP8 Token Metadata Base URI key (keccak256('LSP8TokenMetadataBaseURI'))
bytes32 constant _LSP8_TOKEN_METADATA_BASE_URI = 0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843;

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
        
        // Set token-specific metadata URL
        _setTokenMetadataURL(tokenId);
        
        currentTokenId++;
    }
    
    /**
     * @dev Internal function to set the metadata URL for a token
     */
    function _setTokenMetadataURL(bytes32 tokenId) internal {
        bytes memory baseURI = _getData(_LSP8_TOKEN_METADATA_BASE_URI);
        if (baseURI.length > 0) {
            // Construct full URL: baseURI + tokenId (as string without 0x) + ".json"
            string memory tokenIdStr = _bytes32ToString(tokenId);
            string memory metadataURL = string(abi.encodePacked(
                baseURI,
                tokenIdStr,
                ".json"
            ));
            // Store in token-specific data - using LSP4 metadata key for token
            _setDataForTokenId(tokenId, _LSP4_METADATA_KEY, bytes(metadataURL));
        }
    }
    
    /**
     * @dev Convert bytes32 to string (removes leading zeros)
     */
    function _bytes32ToString(bytes32 value) internal pure returns (string memory) {
        // Convert to uint256 and then to string
        uint256 intValue = uint256(value);
        return _uintToString(intValue);
    }
    
    /**
     * @dev Convert uint to string
     */
    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @notice Batch mint multiple NFTs to recipient (owner only)
     * @param recipient Address to receive the NFTs
     * @param amount Number of NFTs to mint
     */
    function batchMintTo(address recipient, uint256 amount) external onlyOwner {
        require(currentTokenId + amount <= MAX_SUPPLY, "POKSOLSP8Pure: not enough supply");
        for (uint256 i = 0; i < amount; i++) {
            bytes32 tokenId = bytes32(currentTokenId);
            _mint(recipient, tokenId, true, "");
            _setTokenMetadataURL(tokenId);
            currentTokenId++;
        }
    }

    /**
     * @notice Set LSP4 Metadata for the collection (owner only)
     * @param metadataURI URI pointing to LSP4 metadata JSON (ipfs:// or https://)
     */
    function setLSP4Metadata(bytes memory metadataURI) external onlyOwner {
        _setData(_LSP4_METADATA_KEY, metadataURI);
    }

    /**
     * @notice Add a creator to LSP4Creators array (owner only)
     * @param creatorAddress Address of the creator
     */
    function addCreator(address creatorAddress) external onlyOwner {
        // Get current array length
        bytes memory existingCreators = _getData(_LSP4_CREATORS_ARRAY_KEY);
        uint256 newIndex = 0;
        
        if (existingCreators.length >= 32) {
            assembly {
                newIndex := mload(add(existingCreators, 32))
            }
        }
        
        // Add creator to array
        bytes32 indexKey = keccak256(abi.encodePacked(_LSP4_CREATORS_ARRAY_KEY, newIndex));
        _setData(indexKey, abi.encodePacked(creatorAddress));
        
        // Update array length
        _setData(_LSP4_CREATORS_ARRAY_KEY, abi.encodePacked(uint128(newIndex + 1), uint128(newIndex + 1)));
        
        // Set creator map
        bytes32 creatorMapKey = bytes32(bytes.concat(_LSP4_CREATORS_MAP_KEY_PREFIX, bytes20(creatorAddress)));
        _setData(creatorMapKey, hex"01");
    }

    /**
     * @notice Set the base URI for token metadata (owner only)
     * @param baseURI Base URI pointing to token metadata JSONs (must end with /)
     */
    function setTokenMetadataBaseURI(bytes memory baseURI) external onlyOwner {
        _setData(_LSP8_TOKEN_METADATA_BASE_URI, baseURI);
    }

    /**
     * @notice Get the base URI for token metadata
     */
    function getTokenMetadataBaseURI() external view returns (bytes memory) {
        return _getData(_LSP8_TOKEN_METADATA_BASE_URI);
    }
}
