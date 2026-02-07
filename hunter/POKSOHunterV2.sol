// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ILSP8 {
    function mintTo(address recipient, bytes32 tokenId) external;
    function setDataForTokenId(bytes32 tokenId, bytes32 dataKey, bytes memory dataValue) external;
}

/**
 * @title POKSOHunterV2
 * @dev Advanced NFT hunt game with rarity, skills, and fees
 */
contract POKSOHunterV2 {
    
    address public owner;
    ILSP8 public lsp8;
    
    // Fee configuration
    uint256 public claimFee = 0.1 ether; // 0.1 LYX per claim
    uint256 public totalFeesCollected;
    
    // NFT Rarity tiers
    enum Rarity { 
        COMMON,     // 60% - Easy to find, low value
        UNCOMMON,   // 25% - Medium difficulty
        RARE,       // 10% - Hard to find
        LEGENDARY,  // 4%  - Very hard
        MYTHIC      // 1%  - Extremely rare
    }
    
    struct NFTData {
        string name;
        Rarity rarity;
        bool found;
        address finder;
        uint256 findTime;
        string locationHint; // Encrypted or hashed location
        uint256 x; // X coordinate (hidden from players)
        uint256 y; // Y coordinate (hidden from players)
        uint256 skillBoost; // 0 = no boost, 1 = speed, 2 = vision, etc.
        uint256 boostValue; // How much boost (e.g., +20% speed)
    }
    
    // All NFTs in the game
    mapping(bytes32 => NFTData) public nfts;
    bytes32[] public allNFTIds;
    
    // Player data
    struct Player {
        uint256 nftsFound;
        uint256[] foundTokenIds;
        uint256 speedBoost; // Percentage (0-100)
        uint256 visionBoost; // Reveal radius boost
        uint256 luckBoost; // Better drop rates (for future)
        uint256 totalPlayTime;
        uint256 firstFindTime; // When they found their first NFT
    }
    
    mapping(address => Player) public players;
    
    // Events
    event NFTFound(bytes32 indexed tokenId, address indexed finder, Rarity rarity, uint256 timestamp);
    event NFTClaimed(bytes32 indexed tokenId, address indexed owner, uint256 feePaid);
    event SkillActivated(address indexed player, uint256 skillType, uint256 boostValue);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _lsp8) {
        lsp8 = ILSP8(_lsp8);
        owner = msg.sender;
    }
    
    /**
     * @dev Add multiple NFTs to the game
     */
    function addNFTs(
        bytes32[] memory tokenIds,
        string[] memory names,
        Rarity[] memory rarities,
        uint256[] memory xCoords,
        uint256[] memory yCoords,
        string[] memory hints,
        uint256[] memory skillBoosts,
        uint256[] memory boostValues
    ) external onlyOwner {
        require(
            tokenIds.length == names.length && 
            names.length == rarities.length &&
            rarities.length == xCoords.length,
            "Array length mismatch"
        );
        
        for (uint i = 0; i < tokenIds.length; i++) {
            bytes32 tokenId = tokenIds[i];
            
            nfts[tokenId] = NFTData({
                name: names[i],
                rarity: rarities[i],
                found: false,
                finder: address(0),
                findTime: 0,
                locationHint: hints[i],
                x: xCoords[i],
                y: yCoords[i],
                skillBoost: skillBoosts[i],
                boostValue: boostValues[i]
            });
            
            allNFTIds.push(tokenId);
        }
    }
    
    /**
     * @dev Check if player found an NFT (called by game frontend when player is close)
     */
    function checkDiscovery(
        bytes32 tokenId, 
        uint256 playerX, 
        uint256 playerY
    ) external view returns (bool isNear, uint256 distance) {
        NFTData storage nft = nfts[tokenId];
        require(!nft.found, "Already found");
        
        // Calculate distance
        uint256 dx = playerX > nft.x ? playerX - nft.x : nft.x - playerX;
        uint256 dy = playerY > nft.y ? playerY - nft.y : nft.y - playerY;
        distance = dx + dy; // Manhattan distance
        
        // Must be within 50 pixels
        isNear = distance <= 50;
    }
    
    /**
     * @dev Claim found NFT (first come first served!)
     */
    function claimNFT(bytes32 tokenId) external payable {
        NFTData storage nft = nfts[tokenId];
        
        require(!nft.found, "NFT already claimed");
        require(msg.value >= claimFee, "Insufficient fee");
        
        // Mark as found
        nft.found = true;
        nft.finder = msg.sender;
        nft.findTime = block.timestamp;
        
        // Update player stats
        Player storage player = players[msg.sender];
        player.nftsFound++;
        player.foundTokenIds.push(uint256(tokenId));
        
        // Apply skill boost from this NFT
        if (nft.skillBoost > 0) {
            _applySkillBoost(msg.sender, nft.skillBoost, nft.boostValue);
        }
        
        // Collect fee
        totalFeesCollected += msg.value;
        
        // Mint NFT to player
        lsp8.mintTo(msg.sender, tokenId);
        
        // Set metadata (VerifiableURI)
        bytes memory metadataUrl = abi.encodePacked(
            hex"6f357c6a",
            bytes32(0),
            "https://pokso-ux.github.io/pokso-cyberpunk/nfts/",
            _uintToString(uint256(tokenId)),
            ".json"
        );
        
        lsp8.setDataForTokenId(
            tokenId,
            0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e,
            metadataUrl
        );
        
        emit NFTFound(tokenId, msg.sender, nft.rarity, block.timestamp);
        emit NFTClaimed(tokenId, msg.sender, msg.value);
        
        // Refund excess
        if (msg.value > claimFee) {
            payable(msg.sender).transfer(msg.value - claimFee);
        }
    }
    
    /**
     * @dev Apply skill boost to player
     */
    function _applySkillBoost(address playerAddr, uint256 skillType, uint256 value) internal {
        Player storage player = players[playerAddr];
        
        if (skillType == 1) {
            player.speedBoost = value; // +X% speed
        } else if (skillType == 2) {
            player.visionBoost = value; // +X% vision radius
        } else if (skillType == 3) {
            player.luckBoost = value; // +X% luck
        }
        
        emit SkillActivated(playerAddr, skillType, value);
    }
    
    /**
     * @dev Get player stats with active boosts
     */
    function getPlayerStats(address playerAddr) external view returns (
        uint256 nftsFound,
        uint256 speed,
        uint256 vision,
        uint256 luck,
        uint256[] memory tokenIds
    ) {
        Player storage p = players[playerAddr];
        return (
            p.nftsFound,
            100 + p.speedBoost, // Base 100% + boost
            100 + p.visionBoost,
            100 + p.luckBoost,
            p.foundTokenIds
        );
    }
    
    /**
     * @dev Get hint for a specific NFT (costs small fee or requires item)
     */
    function getHint(bytes32 tokenId) external view returns (string memory) {
        // In full version, could require payment or specific NFT
        return nfts[tokenId].locationHint;
    }
    
    /**
     * @dev Get leaderboard (top hunters)
     */
    function getLeaderboard(uint256 count) external view returns (
        address[] memory hunters,
        uint256[] memory scores
    ) {
        // Simplified - in production, maintain sorted list
        hunters = new address[](count);
        scores = new uint256[](count);
        // Implementation would track top players
        return (hunters, scores);
    }
    
    /**
     * @dev Owner: Update claim fee
     */
    function setClaimFee(uint256 newFee) external onlyOwner {
        claimFee = newFee;
    }
    
    /**
     * @dev Owner: Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        payable(owner).transfer(amount);
        emit FeesWithdrawn(owner, amount);
    }
    
    /**
     * @dev Helper: uint to string
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
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @dev Get all available (unfound) NFTs count
     */
    function getAvailableNFTsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint i = 0; i < allNFTIds.length; i++) {
            if (!nfts[allNFTIds[i]].found) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Get total NFTs in game
     */
    function getTotalNFTs() external view returns (uint256) {
        return allNFTIds.length;
    }
}
