// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "src/Vault.sol";
import "forge-std/Script.sol";

contract Deploy is Script {
  function run() external {
    vm.startBroadcast();
    new Vault();
    vm.stopBroadcast();
  }
}
