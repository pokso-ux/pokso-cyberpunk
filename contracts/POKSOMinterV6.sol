// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IPOKSOLSP8PureV6 {
    function mintTo(address recipient) external returns (bytes32 tokenId);
    function batchMintTo(address recipient, uint256 amount) external;
    function currentTokenId() external view returns (uint256);
    function setLSP4Metadata(bytes memory metadataURI) external;
    function addCreator(address creatorAddress) external;
    function setTokenMetadataBaseURI(bytes memory baseURI) external;
    function getTokenMetadataBaseURI() external view returns (bytes memory);
}

/**
 * @dev Simple reentrancy guard
 */
abstract contract ReentrancyGuard {
    uint256 private _status;
    
    modifier nonReentrant() {
        require(_status != 1, "ReentrancyGuard: reentrant call");
        _status = 1;
        _;
        _status = 0;
    }
}

/**
 * @title POKSOMinterV6
 * @dev Handles FREE minting (0 LYX) via POKSOLSP8PureV6
 * V6: Free mint version - no payment required
 * Clean separation: LSP8 contract stays pure, this contract handles minting logic
 */
contract POKSOMinterV6 is ReentrancyGuard {
    
    uint256 public constant MINT_PRICE = 0 ether; // FREE MINT
    uint256 public constant MAX_PER_WALLET = 10;
    
    IPOKSOLSP8PureV6 public lsp8;
    mapping(address => uint256) public mintedByWallet;
    address public owner;
    
    event Mint(address indexed minter, bytes32 indexed tokenId, uint256 price);
    event BatchMint(address indexed minter, uint256 amount, uint256 totalPrice);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "POKSOMinterV6: not owner");
        _;
    }
    
    constructor(address lsp8Address) {
        lsp8 = IPOKSOLSP8PureV6(lsp8Address);
        owner = msg.sender;
    }
    
    /**
     * @notice Mint a single POKSO NFT for FREE (0 LYX)
     */
    function mint() external payable nonReentrant {
        // No payment required for V6 (free mint)
        require(mintedByWallet[msg.sender] < MAX_PER_WALLET, "POKSOMinterV6: max per wallet");
        require(lsp8.currentTokenId() < 500, "POKSOMinterV6: max supply reached");
        
        bytes32 tokenId = lsp8.mintTo(msg.sender);
        mintedByWallet[msg.sender]++;
        
        // Refund any accidentally sent ETH
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
        
        emit Mint(msg.sender, tokenId, 0);
    }
    
    /**
     * @notice Batch mint multiple POKSO NFTs for FREE
     * @param amount Number of NFTs to mint (1-10)
     */
    function batchMint(uint256 amount) external payable nonReentrant {
        require(amount > 0 && amount <= 10, "POKSOMinterV6: invalid amount");
        require(mintedByWallet[msg.sender] + amount <= MAX_PER_WALLET, "POKSOMinterV6: exceeds max per wallet");
        require(lsp8.currentTokenId() + amount <= 500, "POKSOMinterV6: not enough supply");
        
        lsp8.batchMintTo(msg.sender, amount);
        mintedByWallet[msg.sender] += amount;
        
        // Refund any accidentally sent ETH
        if (msg.value > 0) {
            payable(msg.sender).transfer(msg.value);
        }
        
        emit BatchMint(msg.sender, amount, 0);
    }
    
    /**
     * @notice Get mint info for an address
     */
    function getMintInfo(address user) external view returns (
        uint256 minted,
        uint256 remaining,
        uint256 currentId
    ) {
        minted = mintedByWallet[user];
        remaining = MAX_PER_WALLET - minted;
        currentId = lsp8.currentTokenId();
    }
    
    /**
     * @notice Set LSP4 Metadata for the collection (owner only)
     * @param metadataURI URI pointing to LSP4 metadata JSON
     */
    function setLSP4Metadata(bytes memory metadataURI) external onlyOwner {
        lsp8.setLSP4Metadata(metadataURI);
    }
    
    /**
     * @notice Add a creator to LSP4Creators array (owner only)
     * @param creatorAddress Address of the creator
     */
    function addCreator(address creatorAddress) external onlyOwner {
        lsp8.addCreator(creatorAddress);
    }

    /**
     * @notice Set the base URI for LSP8 token metadata (owner only)
     * @param baseURI Base URI like "https://pokso-ux.github.io/pokso-cyberpunk/nfts/"
     */
    function setTokenMetadataBaseURI(bytes memory baseURI) external onlyOwner {
        lsp8.setTokenMetadataBaseURI(baseURI);
    }

    /**
     * @notice Get the base URI for token metadata
     */
    function getTokenMetadataBaseURI() external view returns (bytes memory) {
        return lsp8.getTokenMetadataBaseURI();
    }
    
    receive() external payable {
        revert("POKSOMinterV6: use mint() or batchMint()");
    }
}
