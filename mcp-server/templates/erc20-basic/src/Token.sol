// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "openzeppelin-contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
  constructor() ERC20("TemplateToken", "TTKN") {
    // initial supply minted to contract deployer in tests if needed via mint function
  }

  // Simple mint function for tests/template usage
  function mint(address to, uint256 amount) public {
    _mint(to, amount);
  }

  // Simple burn function for tests/template usage
  function burn(uint256 amount) public {
    _burn(msg.sender, amount);
  }
}
