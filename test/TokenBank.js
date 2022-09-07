const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("TokenBankコントラクト", function () {
  let MemberNFT;
  let memberNFT;
  const tokenURI1 = "hoge1";
  const tokenURI2 = "hoge2";
  const tokenURI3 = "hoge3";
  const tokenURI4 = "hoge4";
  const tokenURI5 = "hoge5";

  let TokenBank;
  let tokenBank;
  const name = "Token";
  const symbol = "TBK";
  let owner;
  let addr1;
  let addr2;
  let addr3;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  //何度も同じ処理をしなくて良いように共通化をする。。。beforeEachを使う
  beforeEach(async function () {
    //getSigner"s"は持っているアドレス全部を持ってくるという意味
    //持ってきたアドレスの先頭のものをownerに入れる,二番目はaddr1
    // const [owner] = await ethers.getSigners();
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    /** ここから MemberNFTデプロイの準備 !!先にMemberNFTをデプロイ（TokenBankのdeployのconstructorの第三引数にmemberNFTを使用するため）ーーーーーーーーーーーー*/
    MemberNFT = await ethers.getContractFactory("MemberNFT");
    memberNFT = await MemberNFT.deploy(); //ここでデプロイできる
    await memberNFT.deployed(); //ここまでがデプロイを完了させるまでの流れ
    /**ここまで MemberNFTのデプロイ終わりーーーーーーーーーーーー */
    //NFTを発行して配布
    await memberNFT.nftMint(owner.address, tokenURI1);
    await memberNFT.nftMint(addr1.address, tokenURI2);
    await memberNFT.nftMint(addr1.address, tokenURI3);
    await memberNFT.nftMint(addr2.address, tokenURI4);
    /** ここから TokenBankデプロイの準備ーーーーーーーーーーーー*/
    TokenBank = await ethers.getContractFactory("TokenBank");
    tokenBank = await TokenBank.deploy(name, symbol, memberNFT.address); //ここでデプロイする
    await tokenBank.deployed(); //ここまでがデプロイを完了させるまでの流れ
    /**ここまで TokenBankのデプロイ終わりーーーーーーーーーーーー */
  });

  describe("デプロイ", function () {
    it("トークンの名前とシンボルがセットされるべき", async function () {
      expect(await tokenBank.name()).to.equal(name);
      expect(await tokenBank.symbol()).to.equal(symbol);
    });
    it("デプロイアドレスがownerに設定されるべき", async function () {
      //publicの場合はgetterで呼び出すことができるowner()、18行目、getSignersで署名したオーナーのアドレス
      expect(await tokenBank.owner()).to.equal(owner.address);
    });
    it("ownerに総額が割り当てられるべき", async function () {
      const ownerBalance = await tokenBank.balanceOf(owner.address);
      expect(await tokenBank.totalSupply()).to.equal(ownerBalance);
    });
    //このデプロイのfunctionではtokenbankに預け入れされていないので0となる
    it("預かっているTokenの総額が0であるべき", async function () {
      expect(await tokenBank.bankTotalDeposit()).to.equal(0);
    });
  });

  describe("アドレス間トランザクション", function () {
    beforeEach(async function () {
      await tokenBank.transfer(addr1.address, 500);
    });
    it("トークン移転がされるべき,かつ残高更新されるべき", async function () {
      //addr1、2の残高をstartAddr1Balanceに格納
      const startAddr1Balance = await tokenBank.balanceOf(addr1.address);
      const startAddr2Balance = await tokenBank.balanceOf(addr2.address);
      //addr1としてtransferをする場合はconnectする必要がある。アドレスをスイッチするような意味
      await tokenBank.connect(addr1).transfer(addr2.address, 100);
      const endAddr1Balance = await tokenBank.balanceOf(addr1.address);
      const endAddr2Balance = await tokenBank.balanceOf(addr2.address);
      //subは引き算。start(500)-100 = end(400)となるはず。足し算はadd
      expect(endAddr1Balance).to.equal(startAddr1Balance.sub(100));
      expect(endAddr2Balance).to.equal(startAddr2Balance.add(100));

      //以下でもテストはパスする
      // await startAddr1Balance - 500;
      // await startAddr2Balance + 500;
    });
    it("ゼロアドレス宛の移転は失敗すべき", async function () {
      //失敗を期待する場合はrevertedWithを使う。エラーメッセージを比較する。同じエラーメッセージであればOK
      await expect(tokenBank.transfer(zeroAddress, 100)).to.be.revertedWith(
        "Zero address cannot be specified for 'to'"
      );
    });
    it("残高不足の場合は移転に失敗すべき", async function () {
      await expect(
        tokenBank.connect(addr1).transfer(addr2.address, 510)
      ).to.be.revertedWith("Insufficient balance!");
    });
    it("移転後は'TokenTransfer'イベントが発行されるべき", async function () {
      await expect(
        tokenBank.connect(addr1).transfer(addr2.address, 100)
        //withArgsはイベントの引数を指定するもの
        //emit 第一引数はオブジェクト、第二引数はイベントの名前
      )
        .emit(tokenBank, "TokenTransfer")
        .withArgs(addr1.address, addr2.address, 100);
    });
  });

  describe("Bankトランザクション", function () {
    beforeEach(async function () {
      await tokenBank.transfer(addr1.address, 500);
      await tokenBank.transfer(addr2.address, 200);
      await tokenBank.transfer(addr3.address, 100);
      await tokenBank.connect(addr1).deposit(100);
      await tokenBank.connect(addr2).deposit(200);
    });
    it("トークン預け入れが実行できるべき", async function () {
      const addr1Balance = await tokenBank.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(400);
      const addr1bankBalance = await tokenBank.bankBalanceOf(addr1.address);
      expect(addr1bankBalance).to.equal(100);
    });
    it("トークン預け入れ後もトークンを移転できるべき", async function () {
      const startAddr1Balance = await tokenBank.balanceOf(addr1.address);
      const startAddr2Balance = await tokenBank.balanceOf(addr2.address);
      //addr1としてtransferをする場合はconnectする必要がある。アドレスをスイッチするような意味
      await tokenBank.connect(addr1).transfer(addr2.address, 100);
      const endAddr1Balance = await tokenBank.balanceOf(addr1.address);
      const endAddr2Balance = await tokenBank.balanceOf(addr2.address);
      //subは引き算。start(500)-100 = end(400)となるはず。足し算はadd
      expect(endAddr1Balance).to.equal(startAddr1Balance.sub(100));
      expect(endAddr2Balance).to.equal(startAddr2Balance.add(100));
    });
    it("預け入れ後には'TokenDeposit'イベントが発行されるべき", async function () {
      await expect(
        tokenBank.connect(addr1).deposit(100)
        //withArgsはイベントの引数を指定するもの
        //emit 第一引数はオブジェクト、第二引数はイベントの名前
      )
        .emit(tokenBank, "TokenDeposit")
        .withArgs(addr1.address, 100);
    });
    it("トークン引き出しが実行できるべき", async function () {
      //withdraw前のaddr1の預入残高合計(addr1側から見たaddr1の預入残高)
      const startBankBalance = await tokenBank
        .connect(addr1)
        .bankBalanceOf(addr1.address);
      //withdraw前の銀行の残高合計(銀行側から見たaddr1の預入残高)
      const startTotalBankBalance = await tokenBank
        .connect(addr1)
        .bankTotalDeposit();

      //addr1が100引き出す
      await tokenBank.connect(addr1).withdraw(100);

      //withdraw後のaddr1の預入残高合計
      const endBankBalance = await tokenBank
        .connect(addr1)
        .bankBalanceOf(addr1.address);
      //withdraw後の銀行の残高合計
      const endTotalBankBalance = await tokenBank
        .connect(addr1)
        .bankTotalDeposit();
      expect(endBankBalance).to.equal(startBankBalance.sub(100));
      expect(endTotalBankBalance).to.equal(startTotalBankBalance.sub(100));
    });
    it("預け入れトークンが不足していた場合、引き出しに失敗すべき", async function () {
      await expect(tokenBank.connect(addr1).withdraw(101)).to.be.revertedWith(
        "An amount greater than your tokenBank balance!"
      );
    });
    it("引き出し後には、'TokenWithdraw'が発行されるべき", async function () {
      await expect(
        tokenBank.connect(addr1).withdraw(100)
        //withArgsはイベントの引数を指定するもの
        //emit 第一引数はオブジェクト、第二引数はイベントの名前
      )
        .emit(tokenBank, "TokenWithdraw")
        .withArgs(addr1.address, 100);
    });
      it("オーナー(銀行)による預入は失敗すべき", async function () {
          await expect(tokenBank.deposit(1))
              .to.be.revertedWith("Owner cannot execute")
      });
      it("オーナーによる引き出しは失敗すべき", async function () {
          await expect(tokenBank.withdraw(1)).to.be.revertedWith(
            "Owner cannot execute"
          );
      });
      it("トータル預入トークン数より大きな数はオーナーであっても移転に失敗すべき", async function () {
          await expect(tokenBank.transfer(addr1.address, 201)).to.be.revertedWith(
            "Amounts greater than the total supply cannot be transferred"
          );
      });
      it("NFTメンバー以外の移転は失敗すべき", async function () {
          await expect(
            tokenBank.connect(addr3).transfer(addr1.address, 100)
          ).to.be.revertedWith("not NFT member");
      });
      it("NFTメンバー以外の預入は失敗すべき", async function () {
          await expect(
            tokenBank.connect(addr3).deposit(1)
          ).to.be.revertedWith("not NFT member");
      });
      it("NFTメンバー以外の引き出しは失敗すべき", async function () {
          await expect(tokenBank.connect(addr3).withdraw(1)).to.be.revertedWith(
            "not NFT member"
          );
      });
  });
});
