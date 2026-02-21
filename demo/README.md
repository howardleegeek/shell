# Shell Demos

This directory contains demo projects to test the Shell workflow.

## Available Demos

### evm-vault
A minimal EVM vault contract demonstrating:
- Foundry test framework
- Slither security audit
- Report-driven workflow

## Quick Start

```bash
# Navigate to demo
cd demo/evm-vault

# Install dependencies
forge install

# Run full workflow via Shell
shell-run detect
shell-run test --chain evm --runner forge
shell-run audit --chain evm
shell-run build --chain evm --runner forge
shell-run deploy --network sepolia --chain evm
```

## Expected Output

Each command generates a JSON report in `reports/`:
- `test.evm.forge.json` - Test results
- `audit.evm.slither.json` - Security audit
- `build.evm.forge.json` - Build results
- `deploy.evm.sepolia.json` - Deployment info
