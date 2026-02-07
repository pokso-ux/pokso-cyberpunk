const { ethers } = require("hardhat");
const fs = require('fs');

const MINTER_ADDRESSES = [
    "0x16addb441f840c261504d9CfAc526B6b1345C6B4", // V2
    "0x9Ff1adC71C97EA7C137bf5454D3E941bFD65a0C4", // V3
    "0xe551195a85CE17A84dF5a59243dFFA161C528C44", // V4
    "0xd776FC4Db5eE0684409229a811246aD6F8146548", // V5
    "0xE566598AB8C00b3D24feD0E7c9C7Fc05901AE547", // V6
    "0x4cf8000588c279DB4F9b67013e6Fa0ab685eA7d0"  // Clean
];

const MINTER_ABI = [
    "function withdraw() external",
    "function owner() view returns (address)",
    "function MINT_PRICE() view returns (uint256)"
];

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Recovering funds from all minters...");
    console.log("Deployer:", deployer.address);
    console.log("");

    let totalRecovered = ethers.BigNumber.from(0);

    for (let i = 0; i < MINTER_ADDRESSES.length; i++) {
        const minterAddress = MINTER_ADDRESSES[i];
        const version = i + 2; // V2, V3, etc.
        
        console.log(`\n${'='.repeat(50)}`);
        console.log(`Minter V${version}: ${minterAddress}`);
        console.log('='.repeat(50));

        try {
            const balance = await ethers.provider.getBalance(minterAddress);
            console.log(`Balance: ${ethers.utils.formatEther(balance)} LYX`);

            if (balance.eq(0)) {
                console.log("⏭️  No funds to withdraw");
                continue;
            }

            const minter = new ethers.Contract(minterAddress, MINTER_ABI, deployer);
            
            try {
                const owner = await minter.owner();
                console.log(`Owner: ${owner}`);
                console.log(`Is deployer: ${owner.toLowerCase() === deployer.address.toLowerCase() ? '✅' : '❌'}`);

                if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
                    console.log("❌ Cannot withdraw - not owner");
                    continue;
                }

                console.log("💸 Withdrawing...");
                const tx = await minter.withdraw();
                await tx.wait();
                
                console.log(`✅ Withdrawn: ${ethers.utils.formatEther(balance)} LYX`);
                totalRecovered = totalRecovered.add(balance);

            } catch (e) {
                console.log("❌ Error:", e.message);
            }

        } catch (e) {
            console.log("❌ Failed to check minter:", e.message);
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log("TOTAL RECOVERED:", ethers.utils.formatEther(totalRecovered), "LYX");
    console.log('='.repeat(50));

    const deployerBalance = await ethers.provider.getBalance(deployer.address);
    console.log("\nDeployer new balance:", ethers.utils.formatEther(deployerBalance), "LYX");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
