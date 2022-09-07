const fs = require("fs");
const memberNFTAddress = (address = require("../memberNFTContract"));

const main = async () => {
  const addr1 = "0x0D8fB2b85200E0fb27Edf9A8C111809A2a85D7D2";
  const addr2 = "0x3801Fc1d43658F8F8BeAdB7dD5b1DE173CeE28B3";
  const addr3 = "0x764C05C8E27339357F7C0952531517E5D1F857B5";
  const addr4 = "0x0F74cA35049c0E26b8CC2370aDc0FeeF856C81B0";

  //デプロイ
  const TokenBank = await ethers.getContractFactory("TokenBank");
  const tokenBank = await TokenBank.deploy(
    "TokenBank",
    "TBK",
    memberNFTAddress
  ); //ここでデプロイできる
  await tokenBank.deployed(); //ここまでがデプロイを完了させるまでの流れ

  console.log(
    `Contract deployed to: https://rinkeby.etherscan.io/address/${tokenBank.address}`
  );

  //トークンを移転(配布)する
    let tx = await tokenBank.transfer(addr2, 300);
    await tx.wait();
    console.log("transferred to addr2");
    tx = await tokenBank.transfer(addr3, 200);
    await tx.wait();
    console.log("transferred to addr3");
    tx = await tokenBank.transfer(addr4, 100);
    await tx.wait();
    console.log("transferred to addr4");

  //Verifyで読み込むargument.jsを生成
  fs.writeFileSync(
    "./argument.js",
    `
    module.exports = [
        "TokenBank",
        "TBK",
        "${memberNFTAddress}"
    ]
    `
  );

  // フロントエンドアプリが読み込むcontracts.jsを生成
  fs.writeFileSync(
    "./contracts.js",
    `
    export const memberNFTAddress = "${memberNFTAddress}"
    export const tokenBankAddress = "${tokenBank.address}"
    `
  );
};

const tokenBankDeploy = async () => {
  try {
    await main();
    //process.exit(0)・・・0で正常終了
    process.exit(0);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
tokenBankDeploy();
