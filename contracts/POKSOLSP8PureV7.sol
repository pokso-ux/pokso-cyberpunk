// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LSP8IdentifiableDigitalAsset} from "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";
import {_LSP4_METADATA_KEY, _LSP4_CREATORS_ARRAY_KEY, _LSP4_CREATORS_MAP_KEY_PREFIX} from "@lukso/lsp-smart-contracts/contracts/LSP4DigitalAssetMetadata/LSP4Constants.sol";

// LSP8 Token Metadata Base URI key
bytes32 constant _LSP8_TOKEN_METADATA_BASE_URI = 0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843;

/**
 * @title POKSOLSP8PureV7
 * @dev LSP8 with PROPER VerifiableURI format for LSP4Metadata
 */
contract POKSOLSP8PureV7 is LSP8IdentifiableDigitalAsset {
    
    uint256 public constant MAX_SUPPLY = 500;
    uint256 public currentTokenId;
    
    // VerifiableURI prefix (0x6f357c6a = keccak256("VerifiableURI"))
    bytes4 constant VERIFIABLE_URI_PREFIX = 0x6f357c6a;
    
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
     * @notice Mint a single NFT with proper VerifiableURI metadata
     */
    function mintTo(address recipient) external onlyOwner returns (bytes32 tokenId) {
        require(currentTokenId < MAX_SUPPLY, "Max supply reached");
        tokenId = bytes32(currentTokenId);
        _mint(recipient, tokenId, true, "");
        _setTokenMetadata(tokenId);
        currentTokenId++;
    }
    
    /**
     * @notice Batch mint with proper metadata
     */
    function batchMintTo(address recipient, uint256 amount) external onlyOwner {
        require(currentTokenId + amount <= MAX_SUPPLY, "Not enough supply");
        for (uint256 i = 0; i < amount; i++) {
            bytes32 tokenId = bytes32(currentTokenId);
            _mint(recipient, tokenId, true, "");
            _setTokenMetadata(tokenId);
            currentTokenId++;
        }
    }
    
    /**
     * @dev Set token metadata with VerifiableURI format
     * Format: 0x6f357c6a + hash(32 bytes) + url(UTF8)
     */
    function _setTokenMetadata(bytes32 tokenId) internal {
        bytes memory baseURI = _getData(_LSP8_TOKEN_METADATA_BASE_URI);
        if (baseURI.length == 0) return;
        
        string memory tokenIdStr = _uintToString(uint256(tokenId));
        string memory metadataURL = string(abi.encodePacked(
            baseURI,
            tokenIdStr,
            ".json"
        ));
        
        // Create VerifiableURI: prefix + hash + url
        // For now, hash is 0x00...00 (32 bytes) - explorer will accept
        bytes memory verifiableURI = abi.encodePacked(
            VERIFIABLE_URI_PREFIX,
            bytes32(0), // hash placeholder - 32 bytes
            metadataURL
        );
        
        _setDataForTokenId(tokenId, _LSP4_METADATA_KEY, verifiableURI);
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
     * @notice Set LSP4 Collection Metadata with VerifiableURI format
     */
    function setLSP4Metadata(bytes32 metadataHash, bytes memory metadataURI) external onlyOwner {
        bytes memory verifiableURI = abi.encodePacked(
            VERIFIABLE_URI_PREFIX,
            metadataHash,
            metadataURI
        );
        _setData(_LSP4_METADATA_KEY, verifiableURI);
    }
    
    /**
     * @notice Set base URI for token metadata
     */
    function setTokenMetadataBaseURI(bytes memory baseURI) external onlyOwner {
        _setData(_LSP8_TOKEN_METADATA_BASE_URI, baseURI);
    }
    
    /**
     * @notice Add a creator
     */
    function addCreator(address creatorAddress) external onlyOwner {
        bytes memory existingCreators = _getData(_LSP4_CREATORS_ARRAY_KEY);
        uint256 newIndex = 0;
        
        if (existingCreators.length >= 32) {
            assembly {
                newIndex := mload(add(existingCreators, 32))
            }
        }
        
        bytes32 indexKey = keccak256(abi.encodePacked(_LSP4_CREATORS_ARRAY_KEY, newIndex));
        _setData(indexKey, abi.encodePacked(creatorAddress));
        _setData(_LSP4_CREATORS_ARRAY_KEY, abi.encodePacked(uint128(newIndex + 1), uint128(newIndex + 1)));
        
        bytes32 creatorMapKey = bytes32(bytes.concat(_LSP4_CREATORS_MAP_KEY_PREFIX, bytes20(creatorAddress)));
        _setData(creatorMapKey, hex"01");
    }
}
