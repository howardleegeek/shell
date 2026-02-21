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

## License

MIT
