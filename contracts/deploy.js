// Deploy script for POKSO Minter
const hre = require("hardhat");

async function main() {
  // LSP8 NFT Contract address (to be created)
  const NFT_CONTRACT = "0x0000000000000000000000000000000000000000";
  
  console.log("Deploying POKSO Minter...");
  
  const Minter = await hre.ethers.getContractFactory("POKSOMinter");
  const minter = await Minter.deploy(NFT_CONTRACT);
  
  await minter.deployed();
  
  console.log("POKSOMinter deployed to:", minter.address);
  console.log("Mint price:", (await minter.mintPrice()).toString(), "wei (5 LYX)");
  console.log("Total supply:", (await minter.totalSupply()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
