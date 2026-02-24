// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Vault.sol";

contract VaultTest is Test {
  Vault vault;
  function setUp() public {
    vault = new Vault();
  }

  function testDepositWithdrawYield() public {
    address user = address(0x1);
    vm.deal(user, 20 ether);
    vm.startPrank(user);
    vault.deposit{value: 10 ether}();
    // balances should reflect the deposit
    assertEq(vault.balances(user), 10 ether);
    // yield for 10 ether should be 1 ether
    uint256 y = vault.yield();
    assertEq(y, 1 ether);
    // withdraw back the funds
    vault.withdraw(10 ether);
    vm.stopPrank();
    assertEq(vault.balances(user), 0);
  }
}
