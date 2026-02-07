require('@nomicfoundation/hardhat-toolbox');

const fs = require('fs');

// Load private key from file
let privateKey;
try {
  const keyData = JSON.parse(fs.readFileSync('/root/.openclaw/workspace/poki_key.json', 'utf8'));
  privateKey = keyData.privateKey;
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
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: '0.8.19',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
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
