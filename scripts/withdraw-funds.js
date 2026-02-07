const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const deployment = JSON.parse(fs.readFileSync('./deployment-v5.json', 'utf8'));
    const minterAddress = deployment.minter.address;
    
    console.log("Withdrawing funds from Minter V5...");
    console.log("Minter:", minterAddress);
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    // Connect to minter
    const POKSOMinterV2 = await ethers.getContractFactory("POKSOMinterV2");
    const minter = POKSOMinterV2.attach(minterAddress);
    
    // Check balance
    const balance = await ethers.provider.getBalance(minterAddress);
    console.log("\nMinter balance:", ethers.utils.formatEther(balance), "LYX");
    
    if (balance.eq(0)) {
        console.log("No funds to withdraw");
        return;
    }
    
    // Check owner
    const owner = await minter.owner();
    console.log("Minter owner:", owner);
    console.log("Deployer is owner:", owner.toLowerCase() === deployer.address.toLowerCase());
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("❌ Deployer is not owner, cannot withdraw");
        return;
    }
    
    // Withdraw
    console.log("\nWithdrawing...");
    const tx = await minter.withdraw();
    await tx.wait();
    
    const newBalance = await ethers.provider.getBalance(minterAddress);
    console.log("✅ Withdrawn!");
    console.log("New minter balance:", ethers.utils.formatEther(newBalance), "LYX");
    
    // Show deployer new balance
    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.utils.formatEther(deployerBalance), "LYX");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
