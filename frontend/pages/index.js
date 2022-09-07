import Head from "next/head";
import Layout from "../components/layout";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { memberNFTAddress, tokenBankAddress } from "../../contracts";
import MemberNFT from "../contracts/MemberNFT.json";
import TokenBank from "../contracts/TokenBank.json";

import Image from 'next/image'

export default function Home() {
  const [account, setAccount] = useState(""); //[現在値、更新値]＝初期値
  const [chainId, setChainId] = useState(false);
  const [tokenBalance, setTokenBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const [bankTotalDeposit, setBankTotalDeposit] = useState("");
  const [nftOwner, setNftOwner] = useState(false);
  const [inputData, setInputData] = useState({
    transferAddress: "",
    transferAmount: "",
    depositAmount: "",
    withdrawAmount: "",
  });
  const [items, setItems] = useState([]);
  const rinkebyId = "0x4";
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const checkMetaMaskInstalled = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("MetaMaskをインストールしてください");
    }
  };

  //②
  const checkChainId = async () => {
    const { ethereum } = window;
    if (ethereum) {
      const chain = await ethereum.request({
        method: "eth_chainId",
      });
      console.log(`chain: ${chain}`);

      if (chain != rinkebyId) {
        alert("Rinkebyに接続してください!");
        setChainId(false);
        return;
      } else {
        setChainId(true);
      }
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log(`account: ${accounts[0]}`);
      setAccount(accounts[0]);

      //スマートコントラクトと接続するにはプロバイダを設定する必要がある。
      //metamaskは「インフラ」と言うプロバイダが使われており、「ethereum」と指定する
      const provider = new ethers.providers.Web3Provider(ethereum);
      //メタマスクのアカウントを取得
      const signer = provider.getSigner();
      //TokenBankのコントラクトオブジェクトを作る。ethメソッドでインスタンス化
      const tokenBankContract = new ethers.Contract(
        tokenBankAddress,
        TokenBank.abi,
        signer
      );
      //tokenBankContractを使ってクエリを発行
      const tBalance = await tokenBankContract.balanceOf(accounts[0]);
      console.log(`tBalance: ${tBalance}`);
      //useステートでtBalanceを保存,BigNumberを扱えるようにtoNumberで変換
      setTokenBalance(tBalance.toNumber());

      const bBalance = await tokenBankContract.bankBalanceOf(accounts[0]);
      console.log(`bBalance: ${bBalance}`);
      setBankBalance(bBalance.toNumber());

      //預入残高の更新
      const totalDeposit = await tokenBankContract.bankTotalDeposit();
      console.log(`totalDeposit: ${totalDeposit}`);
      setBankTotalDeposit(totalDeposit.toNumber());

      checkNft(accounts[0]);

      ethereum.on("accountsChanged", checkAccountChanged); //①
      ethereum.on("chainChanged", checkChainId); //②
    } catch (err) {
      console.log(err);
    }
  };

  //①ハンドラー関数  chainId以外初期化
  const checkAccountChanged = () => {
    setAccount("");
    setNftOwner(false);
    setItems([]);
    setTokenBalance("");
    setBankBalance("");
    setBankTotalDeposit("");
    setInputData({
      transferAddress: "",
      transferAmount: "",
      depositAmount: "",
      withdrawAmount: "",
    });
  };

  const checkNft = async (addr) => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const memberNFTContract = new ethers.Contract(
      memberNFTAddress,
      MemberNFT.abi,
      signer
    );
    const balance = await memberNFTContract.balanceOf(addr);
    console.log(`nftBalance: ${balance.toNumber()}`);

    if (balance.toNumber() > 0) {
      setNftOwner(true);
      for (let i = 0; i < balance.toNumber(); i++) {
        //ERC721のfunction tokenOfOwnerByIndex「tokenIdを取得できる」返り値はtokenId
        const tokenId = await memberNFTContract.tokenOfOwnerByIndex(addr, i);
        //メタデータ取得「tokenURIファンクションで取得できる」
        let tokenURI = await memberNFTContract.tokenURI(tokenId);
        //ipfsのデータをhttpに持ってくる 「ipfs.io」を使う
        tokenURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
        const meta = await axios.get(tokenURI);

        const name = meta.data.name;
        const description = meta.data.description;
        const imageURI = meta.data.image.replace(
          "ipfs://",
          "https://ipfs.io/ipfs/"
        );

        const item = {
          tokenId,
          name,
          description,
          tokenURI,
          imageURI,
        };
        //useStateの更新  ...items これまでのアイテムをそのままにして（更新せず）追加する
        setItems((items) => [...items, item]);
      }
    } else {
      ("");
    }
  };

  const tokenTransfer = async (event) => {
    //ボタンを押してもリロードされないようにする https://qiita.com/yokoto/items/27c56ebc4b818167ef9e
    event.preventDefault();
    if (
      tokenBalance >= inputData.transferAmount &&
      zeroAddress != inputData.transferAddress
    ) {
      try {
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const tokenBankContract = new ethers.Contract(
          tokenBankAddress,
          TokenBank.abi,
          signer
        );
        const tx = await tokenBankContract.transfer(
          inputData.transferAddress,
          inputData.transferAmount
        );
        //トランザクションの完了を待つ
        await tx.wait();

        const tBalance = await tokenBankContract.balanceOf(account);
        setTokenBalance(tBalance.toNumber());
        //transferが終わったらinputを空にする
        setInputData((prevData) => ({
          ...prevData,
          transferAddress: "",
          transferAmount: "",
        }));
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("所持残高を超えるトークン及びゼロアドレス宛は指定できません");
    }
  };

  const tokenDeposit = async (event) => {
    //ボタンを押してもリロードされないようにする https://qiita.com/yokoto/items/27c56ebc4b818167ef9e
    event.preventDefault();
    if (tokenBalance >= inputData.depositAmount) {
      try {
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const tokenBankContract = new ethers.Contract(
          tokenBankAddress,
          TokenBank.abi,
          signer
        );
        const tx = await tokenBankContract.deposit(inputData.depositAmount);
        //トランザクションの完了を待つ
        await tx.wait();

        const tBalance = await tokenBankContract.balanceOf(account);
        const bBalance = await tokenBankContract.bankBalanceOf(account);
        const totalDeposit = await tokenBankContract.bankTotalDeposit();

        setTokenBalance(tBalance.toNumber());
        setBankBalance(bBalance.toNumber());
        setBankTotalDeposit(totalDeposit.toNumber());
        //transferが終わったらinputを空にする
        setInputData((prevData) => ({
          ...prevData,
          depositAmount: "",
        }));
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("所持残高を超えるトークンは預入できません");
    }
  };

  const tokenWithdraw = async (event) => {
    //ボタンを押してもリロードされないようにする https://qiita.com/yokoto/items/27c56ebc4b818167ef9e
    event.preventDefault();
    if (bankBalance >= inputData.withdrawAmount) {
      try {
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const tokenBankContract = new ethers.Contract(
          tokenBankAddress,
          TokenBank.abi,
          signer
        );
        const tx = await tokenBankContract.withdraw(inputData.withdrawAmount);
        //トランザクションの完了を待つ
        await tx.wait();

        const tBalance = await tokenBankContract.balanceOf(account);
        const bBalance = await tokenBankContract.bankBalanceOf(account);
        const totalDeposit = await tokenBankContract.bankTotalDeposit();

        setTokenBalance(tBalance.toNumber());
        setBankBalance(bBalance.toNumber());
        setBankTotalDeposit(totalDeposit.toNumber());
        //transferが終わったらinputを空にする
        setInputData((prevData) => ({
          ...prevData,
          withdrawAmount: "",
        }));
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("預入残高を超えるトークンは引き出しできません");
    }
  };

  const handler = (e) => {
    setInputData((prevData) => ({
      //スプレッド構文。変更したいものだけを入れる
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    checkMetaMaskInstalled();
    checkChainId();
  }, []);

  //////////////////// 以下、フロントエンド/////////////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <Layout>
      <div
        className={
          "flex flex-col items-center bg-slate-100 text-blue-900 min-h-screen"
        }
      >
        <Head>
          <title>NFT-Garage</title>
          <meta name="description" content="Generated by create next app" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <h2 className={"text-6xl font-bold my-12 mt-8"}>
          あなただけのNFTガレージ
        </h2>
        {/* ////////カルーセルーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー */}
        <div id="default-carousel" class="relative" data-carousel="static">
          {/* <!-- Carousel wrapper --> */}
          <div class="relative h-56 overflow-hidden rounded-lg md:h-96">
            {/* <!-- Item 1 --> */}
            <div
              class="duration-700 ease-in-out absolute inset-0 transition-all transform translate-x-0 z-20"
              data-carousel-item=""
            >
              <span class="absolute text-2xl font-semibold text-white -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 sm:text-3xl dark:text-gray-800">
                First Slide
              </span>
              <Image
                src="/linkedin_banner_image_1.png"
                class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                alt="..."
                layout="fill"
              />
            </div>
            {/* <!-- Item 2 --> */}
            <div
              class="duration-700 ease-in-out absolute inset-0 transition-all transform translate-x-full z-10"
              data-carousel-item=""
            >
              <Image
                src=""
                class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                alt="..."
                layout="fill"
              />
            </div>
            {/* <!-- Item 3 --> */}
            <div
              class="duration-700 ease-in-out absolute inset-0 transition-all transform -translate-x-full z-10"
              data-carousel-item=""
            >
              <Image
                src=""
                class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                alt="..."
                layout="fill"
              />
            </div>
          </div>
          {/* <!-- Slider indicators --> */}
          <div class="absolute z-30 flex space-x-3 -translate-x-1/2 bottom-5 left-1/2">
            <button
              type="button"
              class="w-3 h-3 rounded-full bg-white dark:bg-gray-800"
              aria-current="true"
              aria-label="Slide 1"
              data-carousel-slide-to="0"
            ></button>
            <button
              type="button"
              class="w-3 h-3 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
              aria-current="false"
              aria-label="Slide 2"
              data-carousel-slide-to="1"
            ></button>
            <button
              type="button"
              class="w-3 h-3 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800"
              aria-current="false"
              aria-label="Slide 3"
              data-carousel-slide-to="2"
            ></button>
          </div>
          {/* <!-- Slider controls --> */}
          <button
            type="button"
            class="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
            data-carousel-prev=""
          >
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full sm:w-10 sm:h-10 bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
              <svg
                aria-hidden="true"
                class="w-5 h-5 text-white sm:w-6 sm:h-6 dark:text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              <span class="sr-only">Previous</span>
            </span>
          </button>
          <button
            type="button"
            class="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
            data-carousel-next=""
          >
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full sm:w-10 sm:h-10 bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
              <svg
                aria-hidden="true"
                class="w-5 h-5 text-white sm:w-6 sm:h-6 dark:text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
              <span class="sr-only">Next</span>
            </span>
          </button>
        </div>

        {/* 説明文ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー */}

        <div id="accordion-collapse" data-accordion="collapse">
          <h2 id="accordion-collapse-heading-1">
            <button
              type="button"
              class="flex items-center justify-between w-full p-5 font-medium text-left border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              data-accordion-target="#accordion-collapse-body-1"
              aria-expanded="true"
              aria-controls="accordion-collapse-body-1"
            >
              <span>What is Flowbite?</span>
              <svg
                data-accordion-icon=""
                class="w-6 h-6 rotate-180 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
          </h2>
          <div
            id="accordion-collapse-body-1"
            class=""
            aria-labelledby="accordion-collapse-heading-1"
          >
            <div class="p-5 font-light border border-b-0 border-gray-200 dark:border-gray-700 dark:bg-gray-900">
              <p class="mb-2 text-gray-500 dark:text-gray-400">
                Flowbite is an open-source library of interactive components
                built on top of Tailwind CSS including buttons, dropdowns,
                modals, navbars, and more.
              </p>
              <p class="text-gray-500 dark:text-gray-400">
                Check out this guide to learn how to{" "}
                <a
                  href="/docs/getting-started/introduction/"
                  class="text-blue-600 dark:text-blue-500 hover:underline"
                >
                  get started
                </a>{" "}
                and start developing websites even faster with components on top
                of Tailwind CSS.
              </p>
            </div>
          </div>
          <h2 id="accordion-collapse-heading-2">
            <button
              type="button"
              class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-b-0 border-gray-200 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              data-accordion-target="#accordion-collapse-body-2"
              aria-expanded="false"
              aria-controls="accordion-collapse-body-2"
            >
              <span>Is there a Figma file available?</span>
              <svg
                data-accordion-icon=""
                class="w-6 h-6 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
          </h2>
          <div
            id="accordion-collapse-body-2"
            class="hidden"
            aria-labelledby="accordion-collapse-heading-2"
          >
            <div class="p-5 font-light border border-b-0 border-gray-200 dark:border-gray-700">
              <p class="mb-2 text-gray-500 dark:text-gray-400">
                Flowbite is first conceptualized and designed using the Figma
                software so everything you see in the library has a design
                equivalent in our Figma file.
              </p>
              <p class="text-gray-500 dark:text-gray-400">
                Check out the{" "}
                <a
                  href="https://flowbite.com/figma/"
                  class="text-blue-600 dark:text-blue-500 hover:underline"
                >
                  Figma design system
                </a>{" "}
                based on the utility classes from Tailwind CSS and components
                from Flowbite.
              </p>
            </div>
          </div>
          <h2 id="accordion-collapse-heading-3">
            <button
              type="button"
              class="flex items-center justify-between w-full p-5 font-medium text-left text-gray-500 border border-gray-200 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              data-accordion-target="#accordion-collapse-body-3"
              aria-expanded="false"
              aria-controls="accordion-collapse-body-3"
            >
              <span>
                What are the differences between Flowbite and Tailwind UI?
              </span>
              <svg
                data-accordion-icon=""
                class="w-6 h-6 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </button>
          </h2>
          <div
            id="accordion-collapse-body-3"
            class="hidden"
            aria-labelledby="accordion-collapse-heading-3"
          >
            <div class="p-5 font-light border border-t-0 border-gray-200 dark:border-gray-700">
              <p class="mb-2 text-gray-500 dark:text-gray-400">
                The main difference is that the core components from Flowbite
                are open source under the MIT license, whereas Tailwind UI is a
                paid product. Another difference is that Flowbite relies on
                smaller and standalone components, whereas Tailwind UI offers
                sections of pages.
              </p>
              <p class="mb-2 text-gray-500 dark:text-gray-400">
                However, we actually recommend using both Flowbite, Flowbite
                Pro, and even Tailwind UI as there is no technical reason
                stopping you from using the best of two worlds.
              </p>
              <p class="mb-2 text-gray-500 dark:text-gray-400">
                Learn more about these technologies:
              </p>
              <ul class="pl-5 text-gray-500 list-disc dark:text-gray-400">
                <li>
                  <a
                    href="https://flowbite.com/pro/"
                    class="text-blue-600 dark:text-blue-500 hover:underline"
                  >
                    Flowbite Pro
                  </a>
                </li>
                <li>
                  <a
                    href="https://tailwindui.com/"
                    rel="nofollow"
                    class="text-blue-600 dark:text-blue-500 hover:underline"
                  >
                    Tailwind UI
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー */}

        <div className="mt-8 mb-16 hover:rotate-180 hover:scale-105 transition duration-700 ease-in-out">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="160"
            height="160"
            viewBox="0 0 350 350"
          >
            <polygon
              points="0 0, 175 0, 175 175, 0 175"
              stroke="black"
              fill="#0000ff"
            />
            <polygon
              points="0 175, 175 175, 175 350, 0 350"
              stroke="black"
              fill="#ffc0cb"
            />
            <polygon
              points="175 0, 350 0, 350 175, 175 175"
              stroke="black"
              fill="#90EE90"
            />
            <polygon
              points="175 175, 350 175, 350 350, 175 350"
              stroke="black"
              fill="#ffff00"
            />
          </svg>
        </div>

        {/* ボタンーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー */}
        <div className={"flex mt-1"}>
          {/* 参考演算子 */}
          {/* 条件が正なら左、負なら右 */}
          {/* accountが体ったらボタンを表示。空じゃなければ何も表示しない「MetaMask接続のボタンを消す」 */}
          {account === "" ? (
            <button
              className={
                "bg-transparent text-blue-700 font-semibold py-2 px-4 border border-blue-500 rounded hover:border-transparent hover:text-white hover:bg-blue-500 hover:cursor-pointer"
              }
              onClick={connectWallet}
            >
              MetaMaskを接続
            </button>
          ) : chainId ? (
            <div>
              <div className="px-2 py-2 bg-transparent">
                <span className="flex flex-col items-left font-semibold">
                  総預かり残高：{bankTotalDeposit}
                </span>
              </div>
              <div className="px-2 py-2 mb-2 bg-white border border-gray-400">
                <span className="flex flex-col items-left font-semibold">
                  アドレス：{account}
                </span>
                <span className="flex flex-col items-left font-semibold">
                  所持残高：{tokenBalance}
                </span>
                <span className="flex flex-col items-left font-semibold">
                  預入残高：{bankBalance}
                </span>
              </div>
              {nftOwner ? (
                <>
                  <form className="flex pl-1 py-1 mb-1 bg-white border border-gray-400">
                    <input
                      type="text"
                      className="w-5/12 ml-2 text-center border border-gray-400"
                      name="transferAddress"
                      placeholder="Wallet Address"
                      onChange={handler}
                      value={inputData.transferAddress}
                    />
                    <input
                      type="text"
                      className="w-5/12 ml-2 text-right border border-gray-400"
                      name="transferAmount"
                      placeholder={`100`}
                      onChange={handler}
                      value={inputData.transferAmount}
                    />
                    <button
                      className="w-2/12 mx-2 bg-white border-blue-500 hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
                      onClick={tokenTransfer}
                    >
                      移転
                    </button>
                  </form>
                  <form className="flex pl-1 py-1 mb-1 bg-white border border-gray-400">
                    <input
                      type="text"
                      className="w-10/12 ml-2 text-right border border-gray-400"
                      name="depositAmount"
                      placeholder={`100`}
                      onChange={handler}
                      value={inputData.depositAmount}
                    />
                    <button
                      className="w-2/12 mx-2 bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
                      onClick={tokenDeposit}
                    >
                      預入
                    </button>
                  </form>
                  <form className="flex pl-1 py-1 mb-1 bg-white border border-gray-400">
                    <input
                      type="text"
                      className="w-10/12 ml-2 text-right border border-gray-400"
                      name="withdrawAmount"
                      placeholder={`100`}
                      onChange={handler}
                      value={inputData.withdrawAmount}
                    />
                    <button
                      className="w-2/12 mx-2 bg-white hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-2 border border-blue-500 hover:border-transparent rounded"
                      onClick={tokenWithdraw}
                    >
                      引出
                    </button>
                  </form>
                  {/* itemsから一つずつ取り出して、itemに格納している */}
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-center pl-1 py-2 mb-1">
                      <div className="flex flex-col md:flex-row md:max-w-xl rounded-lg bg-white shadow-lg">
                        <img
                          className=" w-full h-96 md:h-auto object-cover md:w-48 rounded-t-lg md:rounded-none md:rounded-l-lg"
                          src={item.imageURI}
                          alt=""
                        />
                        <div className="p-6 flex flex-col justify-start">
                          <h5 className="text-gray-900 text-xl font-medium mb-2">
                            {item.name}
                          </h5>
                          <p className="text-gray-700 text-base mb-4">
                            {item.description}
                          </p>
                          {/* tokenIdをjavascriptが扱えるようにtoNumber()を使う */}
                          <p className="text-gray-600 text-xs">
                            所有NFT# {item.tokenId.toNumber()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <></>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center mb-20 font-bold text-2xl gap-y-3">
              <div>Rinkebyに接続してください</div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
