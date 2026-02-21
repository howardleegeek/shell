# Slither Security Scanner

Run Slither static analysis on Solidity contracts for security vulnerabilities.

## 触发条件

当用户提到以下内容时使用此 skill：
- "安全扫描"
- "run slither"
- "审计合约"
- "检查漏洞"
- "security audit"
- "合约安全"

## 工作流程

### 1. 环境检测

检查 Slither 是否安装：

```bash
which slither
```

如未安装，提示用户安装：
```bash
pip install slither-analyzer
# 或
pipx install slither-analyzer
```

### 2. 扫描执行

```bash
# 基本扫描
slither .

# 指定合约
slither path/to/Contract.sol

# 输出 JSON
slither . --json report.json

# 只显示高危
slither . --exclude-dependencies --exclude-low
```

### 3. 结果解析

Slither 输出级别：

| 级别 | 严重程度 | 示例 |
|------|---------|------|
| High | 高危 | 重入漏洞、溢出 |
| Medium | 中危 | 未检查的 CALL |
| Low | 低危 | 冗余代码 |
| Informational | 信息 | 代码风格 |

### 4. 报告生成

生成扫描报告：
- 漏洞列表及位置
- 严重程度
- 修复建议
- 参考链接

## 验收标准

- [ ] 扫描成功执行
- [ ] 输出结果完整
- [ ] 提供修复建议

## 常见漏洞检测

Slither 可检测：
- [ ] 重入漏洞
- [ ] 整数溢出
- [ ] 未授权访问
- [ ] 逻辑错误
- [ ] Gas 优化机会
- [ ] 依赖问题

## 不要做

- ❌ 不修改用户代码
- ❌ 不保证无漏洞（只做静态分析）
- ❌ 不替代专业审计
