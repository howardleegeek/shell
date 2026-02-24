# Shell - Web3 Developer AI Assistant

> OpenCode 的 Web3 扩展包，让 AI 编程助手具备智能合约开发、测试、部署、安全审计能力。

## 什么是 Shell？

Shell 是 **OpenCode 的扩展包**，不是 fork。它在 OpenCode 基础上增加了 Web3 开发能力：

```
OpenCode 核心
    └── Shell 扩展包
        ├── Solidity 合约编写
        ├── Foundry/Hardhat 集成
        ├── Slither 安全扫描
        ├── MCP 链上交互 (Solana/EVM)
        ├── 多链部署
        └── 合约测试/验证 + 统一报告
```

## 安装

```bash
# 方式 1: 克隆到 OpenCode skills 目录
git clone https://github.com/howardleegeek/shell.git ~/.claude/skills/shell

# 方式 2: 作为独立项目使用
git clone https://github.com/howardleegeek/shell.git
```

## 功能

### ✅ 已完成

- [x] Solidity 合约编写 skill
- [x] Foundry/Hardhat 集成 (plugin)
- [x] Slither 安全扫描 skill
- [x] OpenCode 插件 (web3-tools.ts)
- [x] 模板注册表
- [x] Tauri 桌面 App 骨架
- [x] MCP Server 集成 (Solana/EVM)

### 🏗️ 开发中

- [ ] Theia IDE 扩展
- [ ] 实际模板 repos
- [ ] 完整测试报告 UI

## 架构

```
shell/
├── .opencode/
│   ├── skills/
│   │   ├── solidity-write/      # Solidity 合约编写
│   │   ├── foundry-run/        # Foundry 任务执行
│   │   ├── hardhat-run/        # Hardhat 任务执行
│   │   ├── slither-scan/       # 安全扫描
│   │   └── deploy/             # 多链部署
│   └── plugins/
│       └── web3-tools.ts       # Web3 工具插件
├── desktop/                     # Tauri 桌面 App
│   └── src-tauri/              # Rust backend
├── templates/                   # 合约模板注册表
├── SPEC.md                      # 详细规格
└── README.md
```

## 技术栈

- **AI 核心**: OpenCode / Crush
- **合约框架**: Foundry, Hardhat, Anchor
- **安全工具**: Slither, Manticore
- **链上交互**: MCP Servers (solana-web3js-mcp-server, web3-mcp-hub)
- **桌面**: Tauri + React

## MCP 集成

Shell 支持通过 MCP (Model Context Protocol) 与链交互：

### Solana

使用 [solana-web3js-mcp-server](https://github.com/FrankGenGo/solana-web3js-mcp-server)：
- 钱包管理
- Airdrop
- 合约部署
- 交易构建

### EVM

使用 [web3-mcp-hub](https://github.com/rudazy/web3-mcp-hub)：
- 链数据查询
- 合约交互
- 交易发送

## 统一报告格式

所有测试/部署输出统一到 `reports/` 目录：

```
reports/
├── test.evm.forge.json
├── test.evm.hardhat.json
├── test.solana.anchor.json
├── audit.slither.json
└── deploy.*.json
```

## 开源参考

- [Web3CLI](https://github.com/shivatmax/web3cli) - EVM 合约生成
- [Código](https://github.com/Codigo-io/platform) - Web3 AI 平台参考
- [SolAgent](https://github.com/openpaperz/SolAgent) - Solidity 多 agent 框架
- [Eclipse Theia](https://github.com/eclipse-theia/theia) - IDE 框架

## 许可证

MIT

## 作者

[Howard Lee](https://github.com/howardleegeek)
