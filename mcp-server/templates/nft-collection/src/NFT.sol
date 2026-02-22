// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "openzeppelin-contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
  uint256 public nextId;
  constructor() ERC721("NFT", "NTF") { nextId = 1; }
  function mint(address to, string memory tokenURI) public returns (uint256) {
    uint256 id = nextId;
    _mint(to, id);
    _setTokenURI(id, tokenURI);
    nextId++;
    return id;
  }
}
