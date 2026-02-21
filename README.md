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
        ├── 多链部署
        └── 合约测试/验证
```

## 安装

```bash
# 方式 1: 克隆到 OpenCode skills 目录
git clone https://github.com/howardleegeek/shell.git ~/.claude/skills/shell

# 方式 2: 作为独立项目使用
git clone https://github.com/howardleegeek/shell.git
```

## 功能

### 已支持

- [ ] Solidity 合约编写（基于模板 + LLM）
- [ ] Foundry 集成（编译、测试、部署）
- [ ] Hardhat 集成
- [ ] Slither 安全扫描
- [ ] 多链部署脚本生成

### 规划中

- [ ] Anchor (Solana) 支持
- [ ] 合约验证 (Sourcify/Etherscan)
- [ ] 自动化测试报告
- [ ] Gas 优化建议

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
│   └── agents/
│       └── web3-dev/           # Web3 开发者 Agent
├── templates/                  # 合约模板
├── scripts/                    # 部署脚本
└── README.md
```

## 技术栈

- **AI 核心**: OpenCode
- **合约框架**: Foundry, Hardhat
- **安全工具**: Slither, Manticore
- **部署**: Forge, Hardhat, Tenderly

## 许可证

MIT

## 作者

[Howard Lee](https://github.com/howardleegeek)
