import '@nomicfoundation/hardhat-toolbox';

const PRIVATE_KEY = '0xb440b2fa48ecf77e42562e2093918fa538aee6fe95cf99d4259acf98fc65bca4';

export default {
  solidity: '0.8.19',
  networks: {
    lukso: {
      url: 'https://42.rpc.thirdweb.com',
      accounts: [PRIVATE_KEY],
      chainId: 42
    }
  }
};
