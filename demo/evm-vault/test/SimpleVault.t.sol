// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SimpleVault.sol";

contract SimpleVaultTest is Test {
    SimpleVault public vault;
    
    address user1 = address(0x1);
    address user2 = address(0x2);
    
    event Deposit(address indexed user, uint256 amount);
    
    function setUp() public {
        vault = new SimpleVault();
    }
    
    function testDeposit() public {
        vm.deal(user1, 10 ether);
        
        vm.prank(user1);
        vault.deposit{value: 1 ether}();
        
        assertEq(vault.getUserBalance(user1), 1 ether);
    }
    
    /// @notice This test expects Deposit event but contract doesn't emit it
    /// @dev DELIBERATE FAILURE for demo - will fail until agent fixes contract
    function testDepositEmitsEvent() public {
        vm.deal(user1, 10 ether);
        
        vm.prank(user1);
        // This will FAIL because contract doesn't emit Deposit event
        vm.expectEmit(true, true, true, true);
        emit Deposit(user1, 1 ether);
        vault.deposit{value: 1 ether}();
    }
    
    function testWithdraw() public {
        vm.deal(user1, 10 ether);
        
        vm.prank(user1);
        vault.deposit{value: 1 ether}();
        
        vm.prank(user1);
        vault.withdraw(0.5 ether);
        
        assertEq(vault.getUserBalance(user1), 0.5 ether);
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
