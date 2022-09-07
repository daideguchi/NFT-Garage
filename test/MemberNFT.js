const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MemberNFTコントラクト", function () {
  let MemberNFT;
  let memberNFT;
  const name = "MemberNFT";
  const symbol = "MEM";
  const tokenURI1 = "hoge1";
  const tokenURI2 = "hoge2";
  let owner;
  let addr1;

  //何度も同じ処理をしなくて良いように共通化をする。。。beforeEachを使う
  beforeEach(async function () {
    //getSigner"s"は持っているアドレス全部を持ってくるという意味
    //持ってきたアドレスの先頭のものをownerに入れる,二番目はaddr1
    // const [owner] = await ethers.getSigners();
    [owner, addr1] = await ethers.getSigners();
    /** ここからデプロイの準備ーーーーーーーーーーーー*/
    MemberNFT = await ethers.getContractFactory("MemberNFT");
    memberNFT = await MemberNFT.deploy(); //ここでデプロイできる
    await memberNFT.deployed(); //ここまでがデプロイを完了させるまでの流れ
    /**ここまでーーーーーーーーーーーー */
  });

  it("トークンの名前とシンボルがセットされるべき", async function () {
    // expect().to.equal(0);//引数の内容が.toの後と一致することを期待する。一致しないとundifindになる
    /** ここからテストの準備ーーーーーーーーーーーー*/
    expect(await memberNFT.name()).to.equal(name); //上で定義したnameと一致するか確認。menberNFT.nameには「MemberNFT」が入っているはず
    expect(await memberNFT.symbol()).to.equal(symbol);
    /**ここまでーーーーーーーーーーーー */
  });
  it("デプロイアドレスがownerに設定されるべき", async function () {
    /** ここからテストの準備ーーーーーーーーーーーー*/
    expect(await memberNFT.owner()).to.equal(owner.address); //.addressを記述する必要あり
    /**ここまでーーーーーーーーーーーー */
  });
  it("onwerはNFTを作成できるべき", async function () {
    await memberNFT.nftMint(addr1.address, tokenURI1);
    expect(await memberNFT.ownerOf(1)).to.equal(addr1.address);
  });
  it("NFT作成のたびにtokenIdがインクリメントされるべき", async function () {
    await memberNFT.nftMint(addr1.address, tokenURI1);
    await memberNFT.nftMint(addr1.address, tokenURI2);
    expect(await memberNFT.tokenURI(1)).to.equal(tokenURI1);
    expect(await memberNFT.tokenURI(2)).to.equal(tokenURI2);
  });
    it("owner以外はNFT作成に失敗すべき", async function () {
      //connectでアドレスを指定
      await expect(
        memberNFT.connect(addr1).nftMint(addr1.address, tokenURI1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("NFT作成後に”TokenURIChangedイベントが発行されるべき", async function () {
      await expect(memberNFT.nftMint(addr1.address, tokenURI1))
        .to.emit(memberNFT, "TokenURIChanged")//第二引数はイベントの名前
        .withArgs(addr1.address, 1, tokenURI1);
    });
});
