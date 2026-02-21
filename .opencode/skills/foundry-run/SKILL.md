# Foundry Task Runner

Execute Foundry (forge, cast, anvil) tasks for smart contract development.

## 触发条件

当用户提到以下内容时使用此 skill：
- "运行 forge"
- "用 Foundry 编译"
- "forge build/test/deploy"
- "cast call"
- "启动 anvil"
- Foundry 相关操作

## 工作流程

### 1. 环境检测

检查 Foundry 是否安装：

```bash
which forge
which cast
which anvil
```

如未安装，提示用户安装：
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. 项目初始化（如需要）

```bash
# 初始化 Foundry 项目
forge init
# 或在现有项目添加 Foundry
forge install openzeppelin/openzeppelin-contracts --no-commit
```

### 3. 任务执行

根据用户指令执行相应任务：

| 命令 | 用途 |
|------|------|
| `forge build` | 编译合约 |
| `forge test` | 运行测试 |
| `forge test -vvv` | 详细测试输出 |
| `forge deploy` | 部署合约 |
| `forge verify-contract` | 验证合约 |
| `cast call <addr> <sig>` | 调用只读函数 |
| `cast send <addr> <sig>` | 发送交易 |
| `anvil` | 启动本地测试网 |

### 4. 输出解析

解析命令输出：
- 编译错误 → 提取错误位置和原因
- 测试结果 → 提取通过/失败数量
- 部署结果 → 提取合约地址和 tx hash

## 验收标准

- [ ] 命令正确执行
- [ ] 错误信息清晰
- [ ] 输出结果完整

## 不要做

- ❌ 不在生产环境使用 anvil
- ❌ 不广播未验证的交易
- ❌ 不在公开渠道暴露私钥
