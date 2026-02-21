// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Simple Vault - Demo Contract
/// @notice A simple vault contract for demo purposes
/// @dev Has a deliberate bug for testing the workflow
contract SimpleVault is ReentrancyGuard, Ownable {
    
    mapping(address => uint256) public balances;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /// @notice Deposit ETH into the vault
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    /// @notice Withdraw ETH from the vault
    /// @dev BUG: Missing reentrancy guard on withdraw
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        // BUG: Effects after transfers (will be fixed)
        balances[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /// @notice Get the vault balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /// @notice Get user balance
    function getUserBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}
