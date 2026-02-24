# Shell + OpenCrabs Integration Design

## Overview

**Goal**: Use OpenCrabs as the AI orchestration kernel, with Shell providing Web3 tools.

## Architecture

```
Shell Project
├── opencrabs/              # Forked/cloned OpenCrabs
│   └── src/tools/         # Add Web3 tools here
├── shell-runner/           # Existing runner (test/build/deploy)
├── reports/               # Unified JSON reports
└── .opencode/             # Skills (optional backup)
```

## Integration Points

### 1. Add Web3 Tools to OpenCrabs

Create new tools in OpenCrabs' tool system:

```rust
// In opencrabs/src/tools/web3.rs

pub struct Web3Detect;
pub struct Web3Test;
pub struct Web3Build;
pub struct Web3Deploy;
pub struct Web3Audit;
pub struct Web3ReportRead;
```

Each tool calls `shell-run` commands:
- `web3_test` → calls `shell-run test --chain evm`
- `web3_deploy` → calls `shell-run deploy --network anvil`
- `web3_report_read` → reads `reports/*.json` and returns summary

### 2. Report-Driven Workflow

Configure OpenCrabs agent to enforce report reading:

```markdown
# In AGENTS.md or brain file

RULES:
1. After web3_test, MUST call web3_report_read
2. If report.ok == false, analyze failures and patch
3. Only continue if report.ok == true
```

### 3. Tool Definitions

| Tool | Command | Output |
|------|---------|--------|
| `web3_detect` | `shell-run detect` | `evm` or `solana` |
| `web3_test` | `shell-run test --chain {chain}` | `reports/test.*.json` |
| `web3_build` | `shell-run build --chain {chain}` | `reports/build.*.json` |
| `web3_deploy` | `shell-run deploy --network {network}` | `reports/deploy.*.json` |
| `web3_audit` | `shell-run audit --chain {chain}` | `reports/audit.*.json` |
| `web3_report_read` | Read `reports/*.json` | Structured summary |

## Implementation Steps

### Step 1: Fork OpenCrabs

```bash
gh repo fork adolfousier/opencrabs
# or clone for reference
git clone https://github.com/adolfousier/opencrabs.git ~/Downloads/opencrabs
```

### Step 2: Add Web3 Tools

Add tool implementations in `src/tools/`:
- Read existing tool patterns (bash, grep, etc.)
- Create web3_*.rs files
- Register in tool registry

### Step 3: Configure Brain

Add Web3-specific brain files:
- `WEB3.md`: Web3-specific rules
- `CONTRACTS.md`: Contract patterns
- `NETWORKS.md`: Network configs

### Step 4: Test Integration

```bash
cd opencrabs
cargo build

# Test Web3 tools
opencrabs chat
# > Test the vault contract
# > web3_test --chain evm
# > web3_report_read
```

## Benefits

| From OpenCrabs | From Shell |
|----------------|------------|
| TUI experience | Unified reports |
| Plan mode | Web3 runner |
| Memory system | Skills |
| Multi-provider | Schema validation |
| Tool approval | Desktop UI (future) |

## Future: Hybrid UI

- **TUI**: OpenCrabs for power users
- **Desktop**: Shell Tauri app calls OpenCrabs via HTTP API
- **Both**: Share same tools + reports
