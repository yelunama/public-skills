---
name: okx-earn
description: |
  Trigger this skill when the user asks about OKX Simple Earn (savings / flexible earn), including balance queries, purchase, redemption, lending rates, and idle fund analysis.

  Typical trigger scenarios include:
  - Querying savings balance, e.g., "我的赚币余额多少", "活期赚币有多少", "check my earn balance"
  - Purchasing savings, e.g., "帮我用 1000 USDT 申购活期赚币", "subscribe 500 USDT to simple earn"
  - Redeeming savings, e.g., "赎回 500 USDT 活期赚币", "redeem my USDT earn"
  - Querying lending rates, e.g., "现在 USDT 赚币利率多少", "赚币利率怎么样", "what's the current earn rate"
  - Viewing lending history, e.g., "查看赚币历史记录", "出借明细", "show my lending history"
  - Setting lending rate, e.g., "设置 USDT 出借利率为 2%"
  - Idle fund analysis, e.g., "我有多少闲置资金可以赚币", "how much idle USDT can I earn with"
  - Rate comparison, e.g., "现在值不值得申购", "利率趋势怎么样"
license: Apache-2.0
metadata:
  author: okx
  version: "1.0.0"
  homepage: "https://github.com/okx/agent-tradekit"
  openclaw:
    requires:
      env:
        - OKX_API_KEY
        - OKX_SECRET_KEY
        - OKX_PASSPHRASE
      bins:
        - node
    primaryEnv: OKX_API_KEY
    install:
      - kind: node
        package: "@okx_ai/okx-trade-cli"
        bins: [okx]
    emoji: "\U0001F4B0"
---

# OKX Simple Earn (活期赚币) 管理

7 个命令，覆盖 OKX 活期简单赚币的完整操作：余额查询、申购、赎回、出借利率设置、出借历史、市场利率摘要与历史利率查询。

## 安装检查

静默运行；仅在安装、更新或出错时显示简要信息。

- 未安装：进入 skill 目录下的 `cli/` 子目录，执行 `npm install -g .`（会安装本地打包的 CLI，包含 earn 模块）
- 配置文件：`~/.okx/config.toml`；除公共利率查询外，其余命令均需要 API Key。

**首次使用时（检测到未配置 API Key），引导用户完成以下步骤**：

1. **创建 API Key**：登录 OKX 官网或 App → 点击头像进入「个人中心」→「API」→「创建 API Key」
2. **权限设置**：勾选「读取」权限即可查询余额和利率；如需申购/赎回，还需勾选「交易」权限
3. **记录凭证**：创建后会显示 API Key、Secret Key 和 Passphrase，请妥善保存（Secret Key 只显示一次）
4. **询问用户配置方式**，提供两个选项：

   **选项 A：把凭证发给我，我来帮你配置**（推荐）
   - 用户将 API Key、Secret Key、Passphrase 发过来
   - 由 AI 自动执行以下命令写入配置文件：
   ```bash
   mkdir -p ~/.okx
   cat > ~/.okx/config.toml << 'EOF'
   default_profile = "default"

   [profiles.default]
   api_key = "用户提供的API_KEY"
   secret_key = "用户提供的SECRET_KEY"
   passphrase = "用户提供的PASSPHRASE"
   EOF
   ```
   - 写入后自动运行 `okx earn balance` 验证并反馈结果

   **选项 B：我自己手动配置**
   - 告诉用户在终端执行 `okx config init`，按交互提示依次输入 API Key、Secret Key、Passphrase
   - 完成后回来告诉 AI "配置好了"，AI 再运行 `okx earn balance` 验证

5. **配置验证通过后**，询问用户：「需要我帮你测试一下吗？我可以查询你的 OKX 资金账户余额，看看有多少闲置资金可以用来赚币。」

## Skill 路由

| 用户意图 | 路由到 Skill |
|----------|--------------|
| 查询市场行情、K 线、深度 | `okx-trade-market` |
| 现货买卖 | `okx-trade-spot` |
| 合约开平仓 | `okx-trade-derivatives` |
| 账户余额、划转 | `okx-trade-account` |
| 活期赚币余额、申购、赎回、利率 | **本 Skill** |

## ⛔ 关键规则：当前市场年化利率的正确获取方式

**任何时候需要展示「当前市场年化利率」，必须执行：**

```bash
okx earn rate-history --ccy <币种> --limit 1 --json
```

**取返回结果中的 `lendingRate` 字段，这才是真实的当前市场年化利率。**

❌ **严禁使用 `rate-summary` 的 `avgRate` 或 `estRate` 作为当前市场年化利率** —— 这些是历史平均值，会严重偏高（如显示 2.5% 而实际只有 1%），误导用户。

## 快速上手

```bash
# 查询活期赚币余额（全部币种）
okx earn balance

# 查询指定币种赚币余额
okx earn balance USDT

# 查询当前实际市场年化利率（取 lendingRate 字段）
okx earn rate-history --ccy USDT --limit 1 --json

# 查看历史利率趋势
okx earn rate-history --ccy USDT --limit 20

# 申购活期赚币
okx earn purchase --ccy USDT --amt 1000

# 赎回活期赚币
okx earn redeem --ccy USDT --amt 500

# 设置出借利率
okx earn set-rate --ccy USDT --rate 0.01

# 查看出借历史
okx earn lending-history --ccy USDT

# 查看利率摘要（仅参考，avgRate 不是当前实际利率）
okx earn rate-summary USDT
```

## 命令详情

### 1. `okx earn balance [ccy]` — 查询赚币余额

查询活期赚币账户余额，可指定币种或查询全部。

**输出字段**：币种 (ccy)、金额 (amt)、收益 (earnings)、当前利率 (rate)、出借金额 (loanAmt)、待确认金额 (pendingAmt)

**示例**：
```bash
okx earn balance          # 查询全部
okx earn balance USDT     # 仅 USDT
okx earn balance --json   # JSON 格式输出
```

### 2. `okx earn purchase --ccy <ccy> --amt <amt>` — 申购活期赚币

将指定金额的资金申购到活期赚币产品。

⚠️ **写操作**：会移动真实资金，需用户确认后再执行。
⚠️ **不支持 Demo 模式**：必须在实盘环境下使用。

**参数**：
- `--ccy`（必填）：币种，如 USDT
- `--amt`（必填）：申购金额
- `--rate`（可选）：出借利率（年化小数，如 0.01 = 1%），默认 0.01

**关于利率（rate）的重要说明**：

OKX 活期简单赚币的 rate 参数是「最低可接受出借利率」，**不是**实际收益利率。实际收益按市场撮合利率结算。例如：
- 市场当前年化利率为 1.07%（通过 `okx earn rate-history --limit 1` 的 `lendingRate` 字段获取）
- 你设置 rate = 0.01（1%）
- 实际收益仍按 1.07% 结算，不会因为设了 1% 就只拿 1% 的收益
- **rate 设得越低，越容易被撮合出借**，资金利用率更高

⚠️ **关于利率数据来源**：
- ❌ `rate-summary` 的 `avgRate` 是**历史平均利率**，通常偏高，不代表当前实际利率
- ✅ `rate-history --limit 1` 的 `lendingRate` 是**当前实际市场年化利率**，展示给用户时必须用这个

因此建议始终使用默认值 0.01（1%，最低利率），除非你有特殊需求想设更高的最低门槛。

**执行前检查**：
1. 确认用户意图明确（"帮我申购" / "subscribe"）
2. 先执行 `okx earn rate-history --ccy <ccy> --limit 1 --json` 获取当前实际市场年化利率（取 `lendingRate` 字段）
3. 展示申购摘要：币种、金额、当前市场实际年化利率（来自 `lendingRate`，**不要用 rate-summary 的 avgRate**）
4. 向用户说明：rate 默认 1%（最低值），利率越低越容易匹配，实际收益按市场利率结算
5. 等待用户确认 "确认" / "yes"
6. 校验资金账户余额是否充足

**示例**：
```bash
okx earn purchase --ccy USDT --amt 1000              # rate 默认 0.01（推荐）
okx earn purchase --ccy USDT --amt 1000 --rate 0.02   # 自定义最低利率
```

### 3. `okx earn redeem --ccy <ccy> --amt <amt>` — 赎回活期赚币
从活期赚币中赎回指定金额的资金。

⚠️ **写操作**：赎回后资金返回资金账户。
⚠️ **不支持 Demo 模式**。

**参数**：
- `--ccy`（必填）：币种
- `--amt`（必填）：赎回金额

**执行前检查**：
1. 确认用户赎回意图
2. 展示赎回摘要：币种、金额
3. 等待用户确认
4. 校验赚币余额是否充足

**示例**：
```bash
okx earn redeem --ccy USDT --amt 500
```

### 4. `okx earn set-rate --ccy <ccy> --rate <rate>` — 设置出借利率

设置用户的最低可接受出借利率。

⚠️ **写操作**。

**参数**：
- `--ccy`（必填）：币种
- `--rate`（必填）：最低可接受年化利率（小数形式，如 0.01 = 1%）

⚠️ **关于 rate 与收益的关系（必须正确告知用户）**：
- `rate` 是「最低可接受出借利率」，**不影响实际收益**
- 实际收益始终按**市场撮合利率**结算，与你设置的 rate 无关
- **降低 rate 只会让资金更容易被匹配出借**，不会降低收益
- ❌ **严禁告诉用户"降低利率收益会降低"**——这是错误的
- ✅ 正确说法：「降低出借利率更容易匹配出借，实际收益仍按市场利率结算，不受影响」
- 推荐设置为 0.01（1%，最低值），资金利用率最高

**示例**：
```bash
okx earn set-rate --ccy USDT --rate 0.01
```

### 5. `okx earn lending-history` — 查看出借历史

查询出借记录，包括金额、利率、收益等明细。

**参数**：
- `--ccy`（可选）：筛选币种
- `--limit`（可选）：返回条数，默认 100

**示例**：
```bash
okx earn lending-history --ccy USDT --limit 10
```

### 6. `okx earn rate-summary [ccy]` — 市场借贷利率摘要（仅供参考）

🌐 **公共接口**：无需 API Key。

查看各币种的历史平均利率 (avgRate)、预估利率 (estRate)、平均出借量 (avgAmt)。

⚠️ **重要**：`rate-summary` 返回的 `avgRate` 是**历史平均利率**，**不是当前实时市场年化利率**。要获取当前实时市场年化利率，必须使用 `rate-history --limit 1`。

**示例**：
```bash
okx earn rate-summary           # 全部币种
okx earn rate-summary USDT      # 仅 USDT
```

### 7. `okx earn rate-history` — 历史借贷利率（获取当前实时利率的正确方式）

🌐 **公共接口**：无需 API Key。

查看历史利率走势。**返回的 `lendingRate` 字段是实际市场年化利率**，这才是真实的当前利率。

⚠️ **获取当前市场年化利率的正确方式**：
```bash
okx earn rate-history --ccy USDT --limit 1 --json
```
取返回数据中最新一条的 `lendingRate` 字段，**不要**用 `rate-summary` 的 `avgRate`。

**输出字段**：
- `lendingRate`：**实际市场年化利率**（这是要展示给用户的）
- `rate`：最低可接受利率（仅供参考，不是市场利率）
- `ts`：时间戳

**参数**：
- `--ccy`（可选）：筛选币种
- `--limit`（可选）：返回条数，默认 100

**示例**：
```bash
okx earn rate-history --ccy USDT --limit 1    # 获取当前最新实际利率
okx earn rate-history --ccy USDT --limit 30   # 查看近 30 条利率趋势
```

## 闲置资金分析工作流

当用户问"我有多少闲置资金可以赚币"时，执行以下步骤：

1. 调用 `okx account balance` 查询交易账户余额
2. 调用 `okx account asset-balance` 查询资金账户余额
3. 调用 `okx earn balance` 查询当前赚币余额
4. 调用 `okx earn rate-history --ccy <ccy> --limit 1 --json` 获取当前实际市场年化利率（取 `lendingRate` 字段，**不要用 rate-summary 的 avgRate**）
5. 汇总输出中文简报，格式如下：

```
📊 闲置资金汇总

交易账户可用：1,234.56 USDT
资金账户可用：5,678.90 USDT
当前赚币余额：10,000.00 USDT（年化 X.XX%）  ← 从 rate-history 的 lendingRate 获取

💡 建议：资金账户有 5,678.90 USDT 闲置，当前活期赚币年化约 X.XX%，可考虑申购。
```

## 安全规则

1. **所有写操作（申购/赎回/设置利率）必须先展示操作摘要，等待用户明确确认**
2. **"直接搞" / "just do it" 不视为有效确认**——用户必须看到摘要后再确认
3. **Demo 模式不支持 earn 操作**——如果检测到 `--demo`，直接告知用户需切换到实盘
4. **执行前校验**：余额充足、金额 > 0、币种有效
5. **所有输出使用中文**，金额保留完整精度，利率显示为年化百分比

## 网络故障排查

当命令返回网络错误（如 "Failed to call OKX endpoint"、请求超时、连接被拒绝等）时，向用户提示：

> 无法连接 OKX API，可能是网络环境问题。请检查：
> 1. 当前网络是否能访问 OKX 服务（部分地区需要 VPN）
> 2. VPN 是否已开启并正常工作
> 3. 可在终端执行 `curl -I https://www.okx.com` 验证连通性

## 输出格式约定

- **余额**：保留完整精度，标注币种单位（如 `1,234.567890 USDT`）
- **利率**：显示为年化百分比（如 `2.10%`），内部参数使用小数
- **时间**：`2026/3/9 14:30:00` 格式
- **结构**：三段式 —— 结论 → 依据 → 建议操作
