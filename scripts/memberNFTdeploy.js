const fs = require("fs");

const main = async () => {
  const addr1 = "0x0D8fB2b85200E0fb27Edf9A8C111809A2a85D7D2";
  const addr2 = "0x3801Fc1d43658F8F8BeAdB7dD5b1DE173CeE28B3";
  const addr3 = "0x764C05C8E27339357F7C0952531517E5D1F857B5";

  const tokenURI1 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata1.json";
  const tokenURI2 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata2.json";
  const tokenURI3 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata3.json";
  const tokenURI4 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata4.json";
  const tokenURI5 =
    "ipfs://bafybeigyod7ldrnytkzrw45gw2tjksdct6qaxnsc7jdihegpnk2kskpt7a/metadata5.json";

  //デプロイ
  const MemberNFT = await ethers.getContractFactory("MemberNFT");
  const memberNFT = await MemberNFT.deploy(); //ここでデプロイできる
  await memberNFT.deployed(); //ここまでがデプロイを完了させるまでの流れ

  console.log(
    `Contract deployed to: https://rinkeby.etherscan.io/address/${memberNFT.address}`
  );

  //NFTをmintする
  let tx = await memberNFT.nftMint(addr1, tokenURI1);
  await tx.wait();
  console.log("NFT#1 mited...");
  tx = await memberNFT.nftMint(addr1, tokenURI2);
  await tx.wait();
  console.log("NFT#2 mited...");
  tx = await memberNFT.nftMint(addr2, tokenURI3);
  await tx.wait();
  console.log("NFT#3 mited...");
  tx = await memberNFT.nftMint(addr2, tokenURI4);
  await tx.wait();
  console.log("NFT#4 mited...");

  //コントラクトアドレスの書き出し
  fs.writeFileSync(
    "./memberNFTContract.js",
    `
        module.exports = "${memberNFT.address}"
        `
  );

};

  const memberNFTDeploy = async () => {
    try {
      await main();
      //process.exit(0)・・・0で正常終了
      process.exit(0);
    } catch (err) {
      console.log(err);
      process.exit(1);
    }
  };
  memberNFTDeploy();