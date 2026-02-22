// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Token.sol";

contract TokenTest is Test {
  Token token;

  function setUp() public {
    token = new Token();
  }

  function testMintAndTransfer() public {
    token.mint(address(this), 1000);
    assertEq(token.balanceOf(address(this)), 1000);
  }

  function testBurn() public {
    token.mint(address(this), 1000);
    token.burn(400);
    assertEq(token.balanceOf(address(this)), 600);
  }

  function testTransfer() public {
    token.mint(address(this), 1000);
    address to = address(0x1234);
    token.transfer(to, 250);
    assertEq(token.balanceOf(address(this)), 750);
    assertEq(token.balanceOf(to), 250);
  }
}
