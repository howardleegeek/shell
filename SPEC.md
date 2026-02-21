# Shell - Project Specification

## Overview

**Shell** 是 OpenCode 的 Web3 扩展包，为 AI 编程助手添加智能合约开发、测试、部署、安全审计能力。

## Project Info

- **Name**: Shell
- **Type**: OpenCode Extension (Skills + Agents)
- **Location**: `~/Downloads/oyster/shell/`
- **GitHub**: `howardleegeek/shell`

## Architecture

```
OpenCode 核心 (不动)
    └── Shell 扩展包
        ├── solidity-write/     # Solidity 合约编写
        ├── foundry-run/        # Foundry 任务执行
        ├── slither-scan/       # 安全扫描
        └── (规划中)
            ├── hardhat-run/
            ├── deploy/
            └── anchor-run/
```

## Features

### Phase 1 (MVP)

- [x] Solidity 合约编写 skill
- [x] Foundry 集成 skill
- [x] Slither 安全扫描 skill
- [ ] 模板系统
- [ ] 基础测试用例生成

### Phase 2

- [ ] Hardhat 集成
- [ ] 多链部署
- [ ] 合约验证
- [ ] Anchor (Solana) 支持

## Dependencies

- OpenCode (已安装)
- Foundry (forge, cast, anvil)
- Slither
- OpenZeppelin Contracts

## License

MIT
