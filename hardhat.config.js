require('dotenv').config();
require('@nomiclabs/hardhat-ethers');

const { PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.11",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
};
