// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IPOKSOLSP8Pure {
    function mintTo(address recipient) external returns (bytes32 tokenId);
    function batchMintTo(address recipient, uint256 amount) external;
    function currentTokenId() external view returns (uint256);
}

/**
 * @title POKSOMinterV2
 * @dev Handles payments (5 LYX) and mints via POKSOLSP8Pure
 * Clean separation: LSP8 contract stays pure, this contract handles payments
 */
contract POKSOMinterV2 {
    
    uint256 public constant MINT_PRICE = 5 ether;
    uint256 public constant MAX_PER_WALLET = 10;
    
    IPOKSOLSP8Pure public lsp8;
    mapping(address => uint256) public mintedByWallet;
    address public owner;
    
    event Mint(address indexed minter, bytes32 indexed tokenId, uint256 price);
    event BatchMint(address indexed minter, uint256 amount, uint256 totalPrice);
    event Withdrawal(address indexed owner, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "POKSOMinterV2: not owner");
        _;
    }
    
    constructor(address lsp8Address) {
        lsp8 = IPOKSOLSP8Pure(lsp8Address);
        owner = msg.sender;
    }
    
    /**
     * @notice Mint a single POKSO NFT for 5 LYX
     */
    function mint() external payable {
        require(msg.value >= MINT_PRICE, "POKSOMinterV2: insufficient payment");
        require(mintedByWallet[msg.sender] < MAX_PER_WALLET, "POKSOMinterV2: max per wallet");
        require(lsp8.currentTokenId() < 500, "POKSOMinterV2: max supply reached");
        
        bytes32 tokenId = lsp8.mintTo(msg.sender);
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
        require(amount > 0 && amount <= 10, "POKSOMinterV2: invalid amount");
        require(mintedByWallet[msg.sender] + amount <= MAX_PER_WALLET, "POKSOMinterV2: exceeds max per wallet");
        require(lsp8.currentTokenId() + amount <= 500, "POKSOMinterV2: not enough supply");
        
        uint256 totalPrice = MINT_PRICE * amount;
        require(msg.value >= totalPrice, "POKSOMinterV2: insufficient payment");
        
        lsp8.batchMintTo(msg.sender, amount);
        mintedByWallet[msg.sender] += amount;
        
        // Refund excess
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit BatchMint(msg.sender, amount, totalPrice);
    }
    
    /**
     * @notice Withdraw all collected funds
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "POKSOMinterV2: no funds");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "POKSOMinterV2: transfer failed");
        
        emit Withdrawal(owner, balance);
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
    
    receive() external payable {
        revert("POKSOMinterV2: use mint() or batchMint()");
    }
}
