# Shell - Project Specification

## Overview

**Shell** 是 OpenCode 的 Web3 扩展包，为 AI 编程助手添加智能合约开发、测试、部署、安全审计能力。

> **注意**: OpenCode 已迁移到 [Crush](https://github.com/charmbracelet/crush)，但 [opencode.ai](https://opencode.ai/docs/) 仍有完整插件和 Server 文档可用。

## Project Info

- **Name**: Shell
- **Type**: OpenCode Extension (Skills + Plugins + Desktop App)
- **Location**: `~/Downloads/oyster/shell/`
- **GitHub**: `howardleegeek/shell`

## Architecture

```
OpenCode 核心 (不动)
    └── Shell 扩展包
        ├── .opencode/skills/       # Skill 层
        │   ├── solidity-write/     # Solidity 合约编写
        │   ├── foundry-run/        # Foundry 任务执行
        │   └── slither-scan/       # 安全扫描
        ├── .opencode/plugins/      # Plugin 层 (新增)
        │   └── web3-tools.ts        # Web3 工具插件
        └── (规划中)
            ├── desktop/             # Tauri 桌面 App
            └── templates/            # 合约模板注册表
```

## Core Principle: Report-Driven Workflow (强制报告驱动)

**Shell 不是普通 AI CLI。所有执行必须落地 JSON 报告。**

### Workflow Mandate

```
任何 Shell action 必须遵循：
1. 执行命令
2. 解析输出
3. 写入 reports/*.json (按 schema)
4. 读取报告做决策
5. 继续或终止
```

### Agent Enforcement

Agent 不能 trust CLI 输出。必须：

- ✅ 读取 `reports/test.*.json` 判断是否通过
- ✅ 读取 `reports/audit.*.json` 获取漏洞列表
- ✅ 读取 `reports/deploy.*.json` 获取部署地址
- ❌ 不能直接 trust stdout/stderr

### Decision Logic

```typescript
// Agent 必须执行的决策树
if (report.ok === false) {
  // 分析失败原因
  const failures = categorizeFailures(report.details.errors);
  // 生成修复 patch
  await generatePatch(failures);
  // 重新测试
  await shell.run('--action=test');
  // 再次读取报告
} else if (report.ok === true) {
  // 继续下一步
}
```

## Capability Layers

### A. Web3 Tooling Layer (Plugins)

基于 OpenCode 插件系统 ([Docs](https://opencode.ai/docs/plugins/))：

| Tool | Chain | Runner | 功能 |
|------|-------|--------|------|
| `solana_anchor_test` | Solana | Anchor | 运行测试，生成报告 |
| `evm_forge_test` | EVM | Foundry | 运行测试，生成报告 |
| `evm_hardhat_test` | EVM | Hardhat | 运行测试，生成报告 |
| `evm_deploy` | EVM | Forge/Hardhat | 部署到测试网 |
| `solana_deploy` | Solana | Anchor | 部署到 Devnet |
| `web3_audit` | Both | Slither | 安全扫描 |

### B. Web3 Agents (配置复用 OpenCode 内置)

使用 OpenCode 的 agent 配置能力：

| Agent | 职责 | 权限 |
|-------|------|------|
| `@web3-architect` | 只出设计（权限 ask，禁止写文件） | ask |
| `@web3-implementer` | 写代码 + 补 tests | allow |
| `@web3-debugger` | 读日志 → 生成 patch | allow (强约束: 必须跑 test) |
| `@web3-release` | 部署前检查清单 | ask |

### C. Template Registry

维护成熟模板的可选项：

**Solana:**
- `solana-counter` - Anchor 基础计数器
- `solana-vault` - 代币托管
- `solana-dex` - DEX 基础

**EVM:**
- `evm-erc20` - ERC20 代币
- `evm-nft` - ERC721 NFT
- `evm-governance` - DAO 治理
- `evm-defi` - 基础 DEX

### D. MCP Integration

通过 MCP (Model Context Protocol) 与链上交互：

#### Solana
使用 [solana-web3js-mcp-server](https://github.com/FrankGenGo/solana-web3js-mcp-server)：

| Tool | 功能 |
|------|------|
| `wallet.getOrCreate` | 创建/获取钱包 |
| `solana.requestAirdrop` | 请求测试币 |
| `anchor.test` | 运行 Anchor 测试 |
| `anchor.deploy` | 部署到 Devnet |

#### EVM
使用 [web3-mcp-hub](https://github.com/rudazy/web3-mcp-hub)：

| Tool | 功能 |
|------|------|
| `eth_getBalance` | 查询余额 |
| `eth_call` | 读合约 |
| `eth_sendTransaction` | 发送交易 |
| `eth_deployContract` | 部署合约 |

#### MCP Configuration

```json
// mcp-servers.json (Shell 桌面配置)
{
  "servers": {
    "solana": {
      "command": "npx",
      "args": ["-y", "solana-web3js-mcp-server"],
      "env": {
        "RPC_URL": "https://api.devnet.solana.com",
        "KEYPAIR_PATH": "~/.config/solana/id.json"
      }
    },
    "evm": {
      "command": "npx", 
      "args": ["-y", "web3-mcp-hub"],
      "env": {
        "RPC_URLS": {
          "sepolia": "https://rpc.sepolia.org",
          "mainnet": "https://eth-mainnet.g.alchemy.com/v2/..."
        }
      }
    }
  }
}
```

#### Tool Interface Standard

统一的工具接口规范（最小集合）：

| Interface | 功能 | Output |
|-----------|------|--------|
| `chain.balance` | 查询余额 | `reports/chain.balance.json` |
| `chain.airdrop` | 请求测试币 | `reports/chain.airdrop.json` |
| `chain.network_status` | 网络状态 | `reports/chain.status.json` |
| `project.test` | 运行测试 | `reports/test.*.json` |
| `project.deploy_testnet` | 部署到测试网 | `reports/deploy.*.json` |
| `report.bundle` | 汇总报告 | `reports/bundle.json` |

### F. Unified Runner

所有 actions 通过单一入口 `shell-run` 执行：

```bash
# 检测项目类型
shell-run detect

# 运行测试
shell-run test --chain evm --runner foundry

# 构建
shell-run build --chain solana --runner anchor

# 部署
shell-run deploy --network sepolia

# 审计
shell-run audit --chain evm

# 查看报告
shell-run report --json
```

**输出**: 所有命令都写入 `reports/*.json`，按统一 schema 格式。

### E. Unified Reports Schema

所有测试/部署输出统一到 `reports/` 目录：

```json
// reports/test.evm.forge.json
{
  "ok": true,
  "chain": "evm",
  "runner": "forge",
  "startedAt": "2024-01-01T00:00:00Z",
  "finishedAt": "2024-01-01T00:00:05Z",
  "command": "forge test",
  "exitCode": 0,
  "summary": "✅ tests passed",
  "details": {
    "passed": 10,
    "failed": 0
  }
}
```

## Features

### Phase 1 (MVP) - 已完成

- [x] Solidity 合约编写 skill
- [x] Foundry 集成 skill
- [x] Slither 安全扫描 skill

### Phase 2 - 当前

- [x] OpenCode 插件 (web3-tools.ts)
- [x] 模板系统
- [ ] 基础测试用例生成
- [x] Hardhat 集成 (in plugin)
- [x] Anchor (Solana) 支持 (in plugin)

### Phase 3 - 桌面 App

- [ ] Tauri macOS App
- [ ] OpenCode Server 集成
- [ ] Web3 面板（模板选择、网络选择、Run Test、Deploy、Reports）

## Dependencies

**Core:**
- OpenCode (已安装)
- Node.js 18+
- TypeScript

**Web3 Tools:**
- Foundry (forge, cast, anvil)
- Hardhat
- Anchor (Solana)
- Slither
- OpenZeppelin Contracts

**Desktop:**
- Rust (for Tauri)
- pnpm

## Desktop App 架构 (Tauri)

```
┌─────────────────────────────────────┐
│       Web3 Dev Studioauri)       (T │
│  - UI: Webview (React/Svelte)       │
│  - Panels: Chat / Diff / Run        │
└────────────────┬────────────────────┘
                 │ Tauri commands (Rust)
                 ▼
┌─────────────────────────────────────┐
│         Local Runtime               │
│  - Launch opencode serve            │
│  - Keychain access (secrets)        │
└────────────────┬────────────────────┘
                 │ HTTP (OpenAPI)
                 ▼
┌─────────────────────────────────────┐
│         OpenCode Server             │
│  - Sessions / Agents                 │
│  - Tools (built-in + Shell plugins) │
└────────────────┬────────────────────┘
                 │ CLI
                 ▼
         Anchor / Forge / Hardhat
```

## Integrations (可直接复用/改造的开源项目)

| Project | 作用 | Shell 集成方式 |
|---------|------|---------------|
| [Web3CLI](https://github.com/shivatmax/web3cli) | AI→Solidity CLI | 参考其自然语言→合约逻辑 |
| [Código](https://github.com/Codigo-io/platform) | AI→Web3 代码生成 | 模板生成逻辑 |
| [Solana Web3.js MCP Server](https://github.com/FrankGenGo/solana-web3js-mcp-server) | AI↔Solana 链桥 | MCP 协议接入 |
| [SolAgent](https://github.com/openpaperz/SolAgent) | Solidity 多 agent 框架 | 验证循环逻辑 |
| [Eclipse Theia](https://github.com/eclipse-theia/theia) | 开源 IDE 框架 | 桌面 IDE 基础 |

## 技术栈组合

```
UI / IDE (Eclipse Theia / Tauri Desktop)
        ↓
AI Agent Layer (OpenCode / AutoGPT)
        ↓
Model Context Bridge (MCP / Solana Web3.js)
        ↓
Web3 DevOps Actions (Shell Skills + Plugins)
        ↓
Reporting + Validation Pipeline
```

## 插件使用

**项目级**: 放在 `.opencode/plugins/` 即自动加载

**全局**: 放在 `~/.config/opencode/plugins/`

**调用示例**:
```
"运行 solana_anchor_test"
"运行 evm_forge_test 并把失败日志总结成修复 patch"
```

## Priority 2: Autonomous Discovery Deliverable Definition

`autonomous discovery` 的交付必须是可验收产物，而不是“持续探索”过程。

### Definition

每次 discovery run 必须同时输出两个工件：

1. `Discovery Spec` (`reports/discovery.spec.json`)
2. `Discovery PAT` (`reports/discovery.pat.json`)

只输出其中一个视为失败。

### Discovery Spec (What was discovered)

`Discovery Spec` 必须包含：

- `problem_statement`: 当前要解决的问题边界
- `constraints`: 时间、依赖、风险、预算约束
- `hypotheses`: 待验证假设列表（每项可证伪）
- `decision_policy`: 选择/淘汰候选方案的规则
- `exit_criteria`: 结束探索的硬条件
- `non_goals`: 明确不做什么
- `recommended_next_action`: 下一步可执行动作

### Discovery PAT (Proof of applicability)

`PAT` = `Proof of Applicability Test`，用于证明 discovery 结果可以落地。

`Discovery PAT` 必须包含：

- `candidate`: 被验证方案名称
- `test_protocol`: 执行步骤（可复现）
- `evidence`: 关键证据（报告、日志、指标）
- `result`: `pass` 或 `fail`
- `failure_mode`: 失败时的主要失效模式
- `follow_up_action`: 对应后续动作（继续/修复/终止）

### Hard Stop Rules (Anti-Drift)

若满足任一条件，必须停止 discovery 并输出失败结论：

- 连续 2 次 PAT 失败且 failure mode 相同
- 发现候选方案都无法满足 `constraints`
- 无法在当前周期内产出 `recommended_next_action`

### Success Criteria

一个 `autonomous discovery` 任务只有在以下条件全部成立时才算完成：

- `discovery.spec.json` 与 `discovery.pat.json` 均存在
- `discovery.pat.json.result == "pass"`
- `recommended_next_action` 可在下一迭代直接执行

## License

MIT
