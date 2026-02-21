// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SimpleVault.sol";

contract SimpleVaultTest is Test {
    SimpleVault public vault;
    
    address user1 = address(0x1);
    address user2 = address(0x2);
    
    function setUp() public {
        vault = new SimpleVault();
    }
    
    function testDeposit() public {
        vm.deal(user1, 10 ether);
        
        vm.prank(user1);
        vault.deposit{value: 1 ether}();
        
        assertEq(vault.getUserBalance(user1), 1 ether);
    }
    
    function testWithdraw() public {
        vm.deal(user1, 10 ether);
        
        vm.prank(user1);
        vault.deposit{value: 1 ether}();
        
        vm.prank(user1);
        vault.withdraw(0.5 ether);
        
        assertEq(vault.getUserBalance(user1), 0.5 ether);
    }
    
    function testWithdrawAll() public {
        vm.deal(user1, 10 ether);
        
        vm.prank(user1);
        vault.deposit{value: 1 ether}();
        
        vm.prank(user1);
        vault.withdraw(1 ether);
        
        assertEq(vault.getUserBalance(user1), 0);
    }
    
    function testInsufficientBalance() public {
        vm.deal(user1, 10 ether);
        
        vm.prank(user1);
        vault.deposit{value: 1 ether}();
        
        vm.prank(user1);
        vm.expectRevert("Insufficient balance");
        vault.withdraw(2 ether);
    }
}
