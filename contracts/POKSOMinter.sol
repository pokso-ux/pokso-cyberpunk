// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract POKSOMinter {
    address public owner;
    uint256 public mintPrice = 5 ether;
    uint256 public maxPerWallet = 10;
    uint256 public totalSupply = 500;
    uint256 public mintedCount = 0;
    
    mapping(address => uint256) public mintedByWallet;
    
    event Mint(address indexed minter, uint256 indexed tokenId, uint256 price);
    
    constructor() {
        owner = msg.sender;
    }
    
    function mint(uint256 tokenId) external payable {
        require(msg.value >= mintPrice, "Insufficient payment");
        require(mintedCount < totalSupply, "All minted");
        require(mintedByWallet[msg.sender] < maxPerWallet, "Max reached");
        require(tokenId < totalSupply, "Invalid token");
        
        mintedByWallet[msg.sender]++;
        mintedCount++;
        
        emit Mint(msg.sender, tokenId, msg.value);
        
        // Refund excess
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }
    }
    
    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
