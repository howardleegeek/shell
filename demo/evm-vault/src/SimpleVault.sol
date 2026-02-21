// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal vault contract
contract SimpleVault {
    
    mapping(address => uint256) public balances;
    
    event Deposit(address indexed user, uint256 amount);
    
    function deposit() external payable {
        require(msg.value > 0, "Must send ETH");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function getUserBalance(address user) external view returns (uint256) {
        return balances[user];
    }
}
