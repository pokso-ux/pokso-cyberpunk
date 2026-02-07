// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IPOKSOLSP8PureV7 {
    function mintTo(address recipient) external returns (bytes32 tokenId);
    function batchMintTo(address recipient, uint256 amount) external;
    function currentTokenId() external view returns (uint256);
    function setLSP4Metadata(bytes32 metadataHash, bytes memory metadataURI) external;
    function addCreator(address creatorAddress) external;
    function setTokenMetadataBaseURI(bytes memory baseURI) external;
    function getTokenMetadataBaseURI() external view returns (bytes memory);
}

abstract contract ReentrancyGuard {
    uint256 private _status;
    modifier nonReentrant() {
        require(_status != 1, "Reentrant call");
        _status = 1;
        _;
        _status = 0;
    }
}

/**
 * @title POKSOMinterV7
 * @dev Free mint with proper VerifiableURI support
 */
contract POKSOMinterV7 is ReentrancyGuard {
    
    uint256 public MINT_PRICE = 0; // Free mint for testing
    uint256 public constant MAX_PER_WALLET = 10;
    
    IPOKSOLSP8PureV7 public lsp8;
    mapping(address => uint256) public mintedByWallet;
    address public owner;
    
    event Mint(address indexed minter, bytes32 indexed tokenId, uint256 price);
    event BatchMint(address indexed minter, uint256 amount, uint256 totalPrice);
    event MintPriceChanged(uint256 oldPrice, uint256 newPrice);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address lsp8Address) {
        lsp8 = IPOKSOLSP8PureV7(lsp8Address);
        owner = msg.sender;
    }
    
    function mint() external payable nonReentrant {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(mintedByWallet[msg.sender] < MAX_PER_WALLET, "Max per wallet reached");
        require(lsp8.currentTokenId() < 500, "Max supply reached");
        
        bytes32 tokenId = lsp8.mintTo(msg.sender);
        mintedByWallet[msg.sender]++;
        
        if (msg.value > MINT_PRICE) {
            payable(msg.sender).transfer(msg.value - MINT_PRICE);
        }
        
        emit Mint(msg.sender, tokenId, MINT_PRICE);
    }
    
    function batchMint(uint256 amount) external payable nonReentrant {
        require(amount > 0 && amount <= 10, "Invalid amount");
        require(mintedByWallet[msg.sender] + amount <= MAX_PER_WALLET, "Exceeds max per wallet");
        require(lsp8.currentTokenId() + amount <= 500, "Not enough supply");
        
        uint256 totalPrice = MINT_PRICE * amount;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        lsp8.batchMintTo(msg.sender, amount);
        mintedByWallet[msg.sender] += amount;
        
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit BatchMint(msg.sender, amount, totalPrice);
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds");
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    function getMintInfo(address user) external view returns (
        uint256 minted,
        uint256 remaining,
        uint256 currentId
    ) {
        minted = mintedByWallet[user];
        remaining = MAX_PER_WALLET - minted;
        currentId = lsp8.currentTokenId();
    }
    
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = MINT_PRICE;
        MINT_PRICE = newPrice;
        emit MintPriceChanged(oldPrice, newPrice);
    }
    
    function setLSP4Metadata(bytes32 metadataHash, bytes memory metadataURI) external onlyOwner {
        lsp8.setLSP4Metadata(metadataHash, metadataURI);
    }
    
    function addCreator(address creatorAddress) external onlyOwner {
        lsp8.addCreator(creatorAddress);
    }
    
    function setTokenMetadataBaseURI(bytes memory baseURI) external onlyOwner {
        lsp8.setTokenMetadataBaseURI(baseURI);
    }
    
    receive() external payable {
        revert("Use mint() or batchMint()");
    }
}
