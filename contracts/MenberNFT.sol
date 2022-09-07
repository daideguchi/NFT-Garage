// SPDX-License-Identifier: MIY
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; //オーナーのみ表示させる
import "@openzeppelin/contracts/utils/Counters.sol"; //カウントをインクリメント

contract MemberNFT is ERC721Enumerable, ERC721URIStorage, Ownable {
    //OZのCouterを使う。Countersライブラリの中にある「Counter」を使う。という意味

    /**
     * @dev
     * _tokenIdsはCounterの全関数が利用可能
     */
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    //eventは記録すること。indexedを付けるとether scanで検索しやすくなる
    /**
     * @dev
     * 誰にどのtokenId,URIでNFTをmintしたかを記録する →emitが実行されたタイミングで記録される
     */
    event TokenURIChanged(
        address indexed to,
        uint256 indexed tokenId,
        string uri
    );

    constructor() ERC721("MemberNFT", "MEM") {}

    //NFTを作成するには、送る先のアドレスと、URIを引数で受け取る必要がある
    //データの保存領域には、storage(EVMに永続的に保存)するものと、calldata、memory（一時的に保存）の３つがある
    //calldataは変数データ変更不可、memoryは変更可
    /**
     * @dev
     * このコントラクトをデプロイしたアドレスだけがmint可能 onlyOwner
     */
    function nftMint(address to, string calldata uri) external onlyOwner {
        _tokenIds.increment(); //0を1増やして「1」にする
        uint256 newTokenId = _tokenIds.current(); //さらにここで１増やす
        _mint(to, newTokenId); //NFT作成
        _setTokenURI(newTokenId, uri); //newTokenIdにuriを紐づける
        emit TokenURIChanged(to, newTokenId, uri);
    }

    /**
     * @dev
     * オーバーライド
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
