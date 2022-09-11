import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Dropdown } from "flowbite-react";
// import { Dropdown } from "flowbite";
// import { account, chainId } from "../pages/index";

export default function Layout({ children, title = "NFT-Garage" }) {
  return (
    <div>
      <Head>
        <script src="../path/to/flowbite/dist/flowbite.js"></script>
        <title>{title}</title>
      </Head>

      <nav class="bg-white border-gray-200 px-2 sm:px-4 py-2.5 dark:bg-gray-900">
        <div class="container flex flex-wrap justify-between items-center mx-auto">
          <div className="flex justify-center aline-center">
            <Image
              src="/logo.png"
              class="mr-3 h-6 sm:h-9"
              alt="Flowbite Logo"
              width={30}
              height={30}
            />
            <Link href="/">
              <a>
                <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white ml-3">
                  NFT-Garage
                </span>
              </a>
            </Link>
          </div>
          <button
            data-collapse-toggle="navbar-default"
            type="button"
            class="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-default"
            aria-expanded="false"
          >
            <span class="sr-only">Open main menu</span>
            <svg
              class="w-6 h-6"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </button>
          <div class="hidden w-full md:block md:w-auto" id="navbar-default">
            <ul class="flex flex-col p-4 mt-4 bg-gray-50 rounded-lg border border-gray-100 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700 items-center">
              <li>
                <a
                  href="/"
                  class="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  aria-current="page"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/"
                  class="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                >
                  Docs（準備中）
                </a>
              </li>
              <li>
                <a
                  href="/"
                  class="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                >
                  Japanese
                </a>
              </li>
              <li>
                <a
                  href="/"
                  class="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                >
                  English（準備中）
                </a>
              </li>
              <li>
                <Link href="/contact">
                  <a class="block py-2 pr-4 pl-3 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">
                    Contact
                  </a>
                </Link>
              </li>

              <li>
                <Dropdown label="Wallet接続（実装予定）">
                  <Dropdown.Item>Dashboard</Dropdown.Item>
                  <Dropdown.Item>Settings</Dropdown.Item>
                </Dropdown>
              </li>
              {/* ウォレット接続ーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーーー */}
              {/* {account === "" ? (
                  <button
                    className={
                      "bg-transparent text-blue-700 font-semibold py-2 px-4 border border-blue-500 rounded hover:border-transparent hover:text-white hover:bg-blue-500 hover:cursor-pointer"
                    }
                    onClick={connectWallet}
                    value="conect"
                  >
                    MetaMaskを接続
                  </button>
                ) : chainId ? (
                  <></>
                ) : (
                  <div className=""></div>
                )} */}
            </ul>
          </div>
        </div>
      </nav>

      {/* ----body------------------------ */}

      <main>{children}</main>

      {/* ----footer------------------------ */}

      <footer class="p-4 bg-white shadow md:px-6 md:py-8 dark:bg-gray-900">
        <div class="sm:flex sm:items-center sm:justify-between">
          {/* <a
            href="https://flowbite.com/"
            class="flex items-center mb-4 sm:mb-0"
          >
            <Image
              //   src="https://flowbite.com/docs/images/logo.svg"
              class="mr-3 h-8"
              alt="Flowbite Logo"
              witth={32}
              height={32}
            />
            <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
              NFT-Garege
            </span>
          </a> */}
          <ul class="flex flex-wrap items-center mb-6 text-sm text-gray-500 sm:mb-0 dark:text-gray-400">
            <li>
              <a href="#" class="mr-4 hover:underline md:mr-6 ">
                About
              </a>
            </li>
            <li>
              <a href="#" class="mr-4 hover:underline md:mr-6">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" class="mr-4 hover:underline md:mr-6 ">
                Licensing
              </a>
            </li>
            <li>
              <a href="/contact" class="hover:underline">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8"></hr>
        <span class="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
          © 2022{" "}
          <a href="https://flowbite.com/" class="hover:underline">
            NFT-Garage
          </a>
          . All Rights Reserved.
        </span>
      </footer>
    </div>
  );
}
