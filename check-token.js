const { ethers } = require('ethers');
const fs = require('fs');

const LUKSO_RPC = 'https://42.rpc.thirdweb.com';
const provider = new ethers.providers.JsonRpcProvider(LUKSO_RPC);

// LSP8 contract address
const LSP8_ADDRESS = '0x11Eb80ef335F3E08eAA87c97947e23C0c621708D';

// LSP4 Metadata key
const LSP4_METADATA_KEY = '0x9afb95cacc9f95858ec44aa8c3b685511002e30ae54415823f406128b85b238e';
const LSP4_TOKEN_NAME_KEY = '0xdeba1e292f8fe83e35f43d885f17136e975cf2a2f963ce5af24c77dedc7b556d';
const LSP4_TOKEN_SYMBOL_KEY = '0x2f0a68ab07768e01943a599e79762d54c495b8a7e0440b39cee36c77dee88a88';

// LSP8 Token ID Format key
const LSP8_TOKEN_ID_FORMAT_KEY = '0xe8e4c4619d8ad7e500b8f3152553e966c3f3599f3e9d3cfdb24b4965f7f4bfe2';
const LSP8_TOKEN_METADATA_BASE_URI = '0x1a7628600c3bac7101f53697f48df381ddc36b9015e7d7c9c5633d1252aa2843';

// Minimal LSP8 ABI for getting data
const LSP8_ABI = [
  "function getData(bytes32 dataKey) external view returns (bytes)",
  "function getDataBatch(bytes32[] dataKeys) external view returns (bytes[])",
  "function getDataForTokenId(bytes32 tokenId, bytes32 dataKey) external view returns (bytes)",
  "function owner() external view returns (address)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address tokenOwner) external view returns (uint256)",
  "function tokenOwnerOf(bytes32 tokenId) external view returns (address)",
  "function currentTokenId() external view returns (uint256)"
];

async function checkToken() {
  const contract = new ethers.Contract(LSP8_ADDRESS, LSP8_ABI, provider);
  
  console.log('═══════════════════════════════════════════════════');
  console.log('   POKSO LSP8 V6 Token Verification');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('Contract Address:', LSP8_ADDRESS);
  console.log('Explorer URL: https://explorer.execution.mainnet.lukso.network/token/' + LSP8_ADDRESS);
  console.log('');
  
  // Get basic info
  const owner = await contract.owner();
  console.log('Owner:', owner);
  
  const totalSupply = await contract.totalSupply();
  console.log('Total Supply:', totalSupply.toString());
  
  const currentTokenId = await contract.currentTokenId();
  console.log('Current Token ID:', currentTokenId.toString());
  
  // Get LSP4 data
  console.log('\n--- LSP4 Collection Metadata ---');
  const nameData = await contract.getData(LSP4_TOKEN_NAME_KEY);
  const symbolData = await contract.getData(LSP4_TOKEN_SYMBOL_KEY);
  
  console.log('Name (raw):', nameData);
  console.log('Symbol (raw):', symbolData);
  
  if (nameData && nameData.length > 2) {
    try {
      const decodedName = ethers.utils.toUtf8String(nameData);
      console.log('Name (decoded):', decodedName);
    } catch (e) {
      console.log('Name (hex):', nameData);
    }
  }
  
  if (symbolData && symbolData.length > 2) {
    try {
      const decodedSymbol = ethers.utils.toUtf8String(symbolData);
      console.log('Symbol (decoded):', decodedSymbol);
    } catch (e) {
      console.log('Symbol (hex):', symbolData);
    }
  }
  
  // Get base URI
  console.log('\n--- LSP8 Token Metadata ---');
  const baseURIData = await contract.getData(LSP8_TOKEN_METADATA_BASE_URI);
  console.log('Base URI (raw):', baseURIData);
  
  if (baseURIData && baseURIData.length > 2) {
    try {
      const decodedBaseURI = ethers.utils.toUtf8String(baseURIData);
      console.log('Base URI (decoded):', decodedBaseURI);
    } catch (e) {
      console.log('Base URI (hex):', baseURIData);
    }
  }
  
  // Check token 0 metadata
  console.log('\n--- Token 0 Metadata ---');
  const token0Metadata = await contract.getDataForTokenId(
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    LSP4_METADATA_KEY
  );
  console.log('Token 0 Metadata URL (raw):', token0Metadata);
  
  if (token0Metadata && token0Metadata.length > 2) {
    try {
      const decodedMetadata = ethers.utils.toUtf8String(token0Metadata);
      console.log('Token 0 Metadata URL (decoded):', decodedMetadata);
      console.log('\n✅ Token metadata URL is set correctly!');
      console.log('Expected image URL:', decodedMetadata.replace('.json', '.png'));
    } catch (e) {
      console.log('Token 0 Metadata URL (hex):', token0Metadata);
    }
  } else {
    console.log('❌ Token 0 metadata URL is NOT set!');
  }
  
  // Check who owns token 0
  console.log('\n--- Token Ownership ---');
  try {
    const token0Owner = await contract.tokenOwnerOf('0x0000000000000000000000000000000000000000000000000000000000000000');
    console.log('Token 0 Owner:', token0Owner);
    console.log('Token 0 Owner (formatted):', token0Owner);
  } catch (e) {
    console.log('Error getting token owner:', e.message);
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('Verification complete!');
  console.log('═══════════════════════════════════════════════════');
}

checkToken().catch(console.error);
