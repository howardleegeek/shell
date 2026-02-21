// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Simple Vault - Demo Contract
/// @notice A simple vault contract for demo purposes
/// @dev Has a deliberate bug for testing the workflow
contract SimpleVault {
    
    mapping(address => uint256) public balances;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    
    /// @notice Deposit ETH into the vault
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    /// @notice Withdraw ETH from the vault
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
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
