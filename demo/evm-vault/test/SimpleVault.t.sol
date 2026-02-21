// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SimpleVault.sol";

contract SimpleVaultTest is Test {
    SimpleVault public vault;

    function setUp() public {
        vault = new SimpleVault();
    }

    function testDeposit() public {
        vm.deal(address(this), 10 ether);
        vault.deposit{value: 1 ether}();
        assertEq(vault.getUserBalance(address(this)), 1 ether);
    }

    function testDepositZeroFails() public {
        vm.deal(address(this), 10 ether);
        vm.expectRevert("Must send ETH");
        vault.deposit{value: 0}();
    }
}
