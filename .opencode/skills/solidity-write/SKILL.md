# Solidity Contract Writer

Write production-ready Solidity smart contracts using templates and LLM.

## 触发条件

当用户提到以下内容时使用此 skill：
- "写一个 Solidity 合约"
- "帮我写 ERC20/ERC721/..."
- "create a smart contract"
- "写一个合约" / "部署合约"
- Web3 项目开发相关

## 工作流程

### 1. 需求分析

理解用户需求：
- 合约类型（Token、NFT、DeFi、DAO 等）
- 所需功能列表
- 区块链网络（EVM 兼容链）
- 安全要求（是否需要审计）

### 2. 模板选择

根据需求选择合适的基础模板：

| 合约类型 | 模板 |
|---------|------|
| ERC20 | OpenZeppelin ERC20 + extensions |
| ERC721 | OpenZeppelin ERC721 + metadata |
| ERC1155 | OpenZeppelin ERC1155 |
| Vault | OpenZeppelin ReentrancyGuard |
| Swap | Uniswap V2/V3 风格 |
| Staking | Ownable + ReentrancyGuard |

### 3. 合约编写

使用 LLM 生成合约代码：

```
必须包含：
- SPDX License
- Solidity 版本 (^0.8.20)
- import OpenZeppelin 合约
- 功能实现
- NatSpec 文档注释
- 事件定义
- 错误定义

安全考虑：
- ReentrancyGuard
- Ownable 访问控制
- 输入验证
- 溢出检查 (Solidity 0.8+ 自动检查)
```

### 4. 依赖管理

自动添加所需的 OpenZeppelin 依赖：

```bash
# Foundry
forge install openzeppelin/openzeppelin-contracts

# Hardhat
npm install @openzeppelin/contracts
```

### 5. 编译验证

```bash
# Foundry
forge build

# Hardhat
npx hardhat compile
```

## 验收标准

- [ ] 合约通过编译（无错误）
- [ ] 包含 NatSpec 文档
- [ ] 包含基本测试用例
- [ ] 通过测试（如果提供测试）

## 不要做

- ❌ 不写入链（只生成代码）
- ❌ 不使用未审计的第三方库
- ❌ 不在生产代码中使用 console.log
- ❌ 不硬编码私钥或 secrets

## 输出格式

生成的合约保存到用户指定目录，文件名格式：
- `<ContractName>.sol`
- `<ContractName>.test.sol` (测试文件)
