# Web3 Tools for OpenCrabs

- Agent flows
  - web3_detect: Detect project type (EVM/Solana) via shell-run detect
  - web3_test: Run smart contract tests via shell-run test --chain
  - web3_build: Build project via shell-run build --chain
  - web3_deploy: Deploy to testnet via shell-run deploy --network
  - web3_report: Read reports/*.json and return a structured summary

- Rules
  - All actions go through the shell-run wrapper; never call Foundry/Anchor directly
  - Reports drive workflow: after web3_test, an agent should call web3_report to fetch results
  - If OPENCRABS_DRY_RUN is set, commands should return a synthetic dry-run payload

## Workflow example
- Detect project → Determine chain (EVM vs Solana)
- Run tests for chain → Produce reports at reports/{chain}.json
- Build and Deploy in sequence using the appropriate network/chain
- Read reports via web3_report to summarize results for the agent
