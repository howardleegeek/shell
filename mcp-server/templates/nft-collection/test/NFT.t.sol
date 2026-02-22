// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/NFT.sol";

contract NFTTest is Test {
  NFT nft;
  function setUp() public {
    nft = new NFT();
  }
  function testMintAndURI() public {
    uint256 id = nft.mint(address(this), "https://example.com/1");
    assertEq(nft.ownerOf(id), address(this));
    assertEq(nft.tokenURI(id), "https://example.com/1");
  }
}
