require("@nomiclabs/hardhat-waffle");
//.envをインポート
require("dotenv").config();
//hardhatにverifyを追加  verify: Verifies contract on Etherscan
require("@nomiclabs/hardhat-etherscan");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.9",
  //ネットワークの追加
  networks: {
    //接続に必要な情報を設定する必要がある
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
