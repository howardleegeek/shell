// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Vault {
  mapping(address => uint256) public balances;

  function deposit() external payable {
    balances[msg.sender] += msg.value;
  }

  function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, "insufficient balance");
    balances[msg.sender] -= amount;
    payable(msg.sender).transfer(amount);
  }

  function yield() external view returns (uint256) {
    return balances[msg.sender] / 10; // simple yield model
  }
}
