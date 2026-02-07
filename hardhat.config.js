require('@nomicfoundation/hardhat-toolbox');

const fs = require('fs');

// Load private key from file
let privateKey;
try {
  privateKey = fs.readFileSync('/root/.openclaw/workspace/lukso_private_key.pem', 'utf8').trim();
  // Ensure it starts with 0x
  if (!privateKey.startsWith('0x')) {
    privateKey = '0x' + privateKey;
  }
} catch (e) {
  console.error('Could not load private key:', e.message);
  process.exit(1);
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    lukso: {
      url: 'https://42.rpc.thirdweb.com',
      accounts: [privateKey],
      chainId: 42
    }
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts'
  }
};
