const main = async () => {
  MemberNFT = await ethers.getContractFactory("MemberNFT");
  memberNFT = await MemberNFT.deploy(); //ここでデプロイできる
  await memberNFT.deployed(); //ここまでがデプロイを完了させるまでの流れ

    console.log(`Contract deployed to: ${memberNFT.address}`);
};

const deploy = async () => {
    try {
        await main();
        //process.exit(0)・・・0で正常終了
        process.exit(0);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

deploy();

