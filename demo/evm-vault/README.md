# Shell Demo: EVM Vault

A minimal EVM vault contract to demonstrate the Shell workflow.

## Purpose

This demo showcases the complete Shell workflow:
1. Generate contract from template
2. Run tests (should pass)
3. Run security audit (should find issues)
4. Auto-fix based on audit report
5. Re-test and verify
6. Deploy to testnet

## Project Structure

```
evm-vault/
├── src/
│   └── SimpleVault.sol       # Vault contract
├── test/
│   └── SimpleVault.t.sol    # Tests
├── foundry.toml             # Foundry config
└── README.md
```

## Usage with Shell

### 1. Detect Project
```bash
cd demo/evm-vault
shell-run detect
# Output: evm
```

### 2. Run Tests
```bash
shell-run test --chain evm --runner forge
# Writes: reports/test.evm.forge.json
```

### 3. Run Audit
```bash
shell-run audit --chain evm
# Writes: reports/audit.evm.slither.json
```

### 4. Build
```bash
shell-run build --chain evm --runner forge
# Writes: reports/build.evm.forge.json
```

### 5. Deploy (requires RPC)
```bash
shell-run deploy --network sepolia --chain evm
# Writes: reports/deploy.evm.sepolia.json
```

## Expected Workflow

1. **test** → PASS (4 tests)
2. **audit** → WARNING: Reentrancy issue in withdraw
3. **fix** → Apply patch (move balance update before transfer)
4. **test** → PASS
5. **deploy** → SUCCESS → reports/deploy.*.json

## Contract Details

- **Chain**: EVM
- **Framework**: Foundry
- **Language**: Solidity 0.8.20
- **Features**: Deposit, Withdraw, Balance tracking

## Known Issues (for demo)

The contract intentionally has a reentrancy pattern that Slither will flag:
- Balance is updated AFTER the external call
- This is the "classic" reentrancy bug pattern

After running audit, Shell should suggest the fix.
