# Polymarket Weather Arbitrage Bot v2.0 — 系统设计文档

| 项目 | 内容 |
|------|------|
| 文档版本 | v2.0 |
| 产品名称 | Polymarket Weather Arbitrage Bot |
| 目标平台 | Polymarket（去中心化预测市场，Polygon 链） |
| 核心策略 | 气象数据 vs 市场定价偏差套利 |
| 决策引擎 | Claude Haiku API |
| 气象数据源 | Open-Meteo（免费，全球覆盖） |
| 初始资金 | $137.88 USDC |
| 目标 | $250 USDC（截止 2026-03-31） |

---

## 一、系统架构总览

### 1.1 整体数据流

```
[Gamma API 天气市场列表]
        ↓ 过滤（≤3天 / 流动性>$500 / 未持仓）
[Claude Haiku] 解析市场问题
        ↓ 提取 city / metric / threshold / date / direction
[Open-Meteo API] 获取气象预报
        ↓ 正态分布计算 P_weather
        ↓
    P_weather − P_market = delta
        ├─ delta < 15%  → SKIP（无信息优势）
        └─ delta ≥ 15%  → [Claude Haiku 最终决策]
                              ├─ SKIP → 记录原因
                              └─ BUY  → Kelly 仓位计算
                                            ↓
                                    [CLOB API 限价下单]
                                    signature_type=2 (POLY_PROXY)
                                            ↓
                                    SQLite 记录 + Lark 通知
```

### 1.2 任务系统

| 任务编号 | 任务名称 | 频率 | 脚本 |
|---------|---------|------|------|
| CRON-1 | 市场扫描 + 下单 | 每 5 分钟 | `main.py` |
| CRON-2 | 持仓同步 + TP/SL | 随 CRON-1 运行 | `main.py` 内嵌 |
| MANUAL | 紧急平仓 / 手动同步 | 按需触发 | `sync_and_close.py` |

---

## 二、为什么这个策略有 Alpha

这不是赌博，是**信息套利**。

预测市场的定价本质是集体概率估计。如果你对一件事的概率判断和市场一致，买入期望值是负的（有手续费）。所以真正的问题只有一个：

> **你在哪里比市场更准确地知道真实概率？**

天气市场满足这个条件，原因有三：

**① 数据公开但无人使用**
Open-Meteo 气象 API 完全免费、无需注册，但参与天气市场的散户几乎没有人在下注前去查真实预报。这个行为差异产生了持续的信息 gap。

**② 参与者质量低，定价惰性高**
量化机构和气象专业投资者不做 Polymarket 天气市场——单个市场流动性只有 $500-5,000，资金容量太小。散户定价 + 低流动性 = 错误定价持续时间长。

**③ 结果客观可验证**
温度不存在解读空间，结算结果是客观的。这与政治市场、体育市场完全不同，可验证性让 edge 可被量化、可被回测、可被迭代。

**策略的核心信号：**
```
delta = P_weather − P_market

P_weather：Open-Meteo 预报值 → 正态分布计算超过阈值的概率
P_market ：Gamma API outcomePrices（市场隐含概率）
```

只有 delta ≥ 15% 时才存在可利用的信息差，否则对市场定价没有异议，不交易。

---

## 三、第一层：输入层

### 3.1 数据源定义

| 数据源 | 用途 | 获取方式 | 刷新频率 |
|--------|------|---------|---------|
| Gamma API | 天气市场列表 + 实时价格 | REST `gamma-api.polymarket.com` | 每次 CRON 运行 |
| Open-Meteo API | 气象预报（温度/降水/风速）| REST `api.open-meteo.com` | 每次 CRON 运行 |
| Polymarket Data API | 实时持仓 + 真实 PnL | REST `data-api.polymarket.com` | 每次 CRON 运行 |
| CLOB API | 实时余额 + 订单簿 | REST `clob.polymarket.com` | 每次 CRON 运行 |

### 3.2 市场过滤条件

| 过滤项 | 条件 | 原因 |
|--------|------|------|
| 结算时效 | 距结算 ≤ 3 天 | 预报 > 3 天误差超过 ±9°F，优势消失 |
| 流动性 | ≥ $500 | 流动性过低时滑点不可控 |
| 重复持仓 | 同市场未持仓 | 避免重复加仓 |
| 市场类型 | 仅天气类（tag=weather）| 其他市场无气象数据优势 |

### 3.3 概率计算（核心公式）

气象预报给出预测值，需转换为超过阈值的概率：

```python
from scipy.stats import norm

# 示例：预报最高气温 26.8°C，门槛 24°C（below 方向）
sigma = SIGMA_BY_DAY[days_to_settle]   # {1: 1.7, 2: 2.2, 3: 3.1} ℃
P_weather = norm.cdf(threshold, loc=forecast, scale=sigma)   # below 方向
P_weather = 1 - norm.cdf(threshold, loc=forecast, scale=sigma)  # above 方向
```

**预报误差参考（σ）：**

| 预报时效 | σ（摄氏度） | σ（华氏度） | 是否交易 |
|---------|-----------|-----------|---------|
| 1 天 | ±1.7°C | ±3°F | ✅ |
| 2 天 | ±2.2°C | ±4°F | ✅ |
| 3 天 | ±3.1°C | ±5.5°F | ✅（谨慎）|
| 5 天+ | ±5°C+ | ±9°F+ | ❌ 不交易 |

---

## 四、第二层：信号层

### 4.1 信号生成流程

```
Gamma API（100-200 个天气市场）
        ↓ 过滤（时效 / 流动性 / 未持仓）
Claude Haiku 解析问题
        ↓ { city, metric, threshold, unit, date, direction }
Open-Meteo 预报 → 正态分布计算 P_weather
        ↓
    delta = P_weather − P_market
```

### 4.2 信号质量分级

| 等级 | delta 偏差 | Kelly 建议仓位 | 说明 |
|------|-----------|--------------|------|
| A 级 | > 30% | $10-15 | 强信号，气象优势显著 |
| B 级 | 20-30% | $5-10 | 有效信号，正常下注 |
| C 级 | 15-20% | $3-5 | 边缘信号，小仓试水 |
| 无信号 | < 15% | 不交易 | 市场定价合理，无 edge |

### 4.3 为什么 15% 是门槛

σ 参数本身是历史统计均值，单次预报存在估算误差。如果 delta < 10%，σ 的估算误差足以将整个 edge 抹掉。15% 是在留出安全垫后的最低入场线，不是拍脑袋定的。

---

## 五、第三层：决策层

### 5.1 买入决策流程

```
信号触发（delta ≥ 15%）
        │
        ├─ [前置检查 Guard]
        │       ├─ 账户余额 ≥ $2              ✅
        │       ├─ 当日亏损 < $20             ✅
        │       ├─ 当前持仓数 < 上限           ✅
        │       ├─ 同市场未持仓               ✅
        │       └─ 气象 API 返回正常数据       ✅
        │
        ├─ [Claude Haiku 最终决策]
        │       输入：market + P_weather + P_market + delta + days + liquidity
        │       输出：{ "decision": "BUY" / "SKIP", "reason": "..." }
        │
        ├─ BUY  → Kelly 仓位计算 → 执行下单
        └─ SKIP → 记录原因 → 等下次
```

### 5.2 前置检查（Guard）

| 检查项 | 条件 | 说明 |
|--------|------|------|
| 账户余额 | `balance ≥ $2` | 防止余额耗尽后继续尝试 |
| 当日亏损 | `today_loss < $20` | 日亏损达限，全天暂停新建仓 |
| 持仓数量 | `open_positions < 15` | 避免仓位过于分散 |
| 重复持仓 | `token_id not in open_positions` | 同市场不重复买入 |
| 气象 API | `P_weather is not None` | API 不可用时整体停止，不退化为随机下注 |

### 5.3 仓位计算：1/4 Kelly Criterion

```python
b = (1 / P_market) - 1                              # 净赔率
f = (P_weather * b - (1 - P_weather)) / b           # Full Kelly
position = min(f / 4 * balance, MAX_SINGLE_POS)     # 1/4 Kelly，上限 $15
position = max(position, MIN_BET)                   # 下限 $2
```

用 1/4 Kelly 而非 Full Kelly 的原因：Full Kelly 理论收益最大，但要求概率估计完全准确。我们的 P_weather 基于历史平均 σ，存在估算误差。1/4 Kelly 在期望值下降有限的前提下，大幅降低单次错误估计的账户损伤。

---

## 六、第四层：执行层

### 6.1 下单参数

| 参数 | 值 | 说明 |
|------|----|----|
| 签名模式 | `signature_type=2` | POLY_PROXY 模式，代理钱包持仓 |
| 订单类型 | GTC（Good Till Cancelled）| 天气市场流动性低，挂单等待成交 |
| 滑点容忍 | +3% | 限价单价格 = ask × 1.03 |
| 最小下注 | $2 | 低于此值不开仓 |
| 最大下注 | $15 | Kelly 上限，约占账户 10% |

### 6.2 价格来源：为什么不用 CLOB 订单簿

这是执行层最关键的设计决定。

Polymarket 天气市场几乎全是 NegRisk 结构（多选一）。在这种结构里，CLOB 订单簿会自动挂系统占位单：买1价 0.1¢，卖1价 99.9¢。这些**不是真实订单**，是系统维护流动性的占位符。

如果用 CLOB ask 价格去下单：
- 实际成交价格严重失真
- 滑点保护形同虚设

**正确方案：用 Gamma API 的 `outcomePrices` 字段作为真实价格参考。**

```python
# 识别并绕过占位挂单
if clob_ask > 50.0 and gamma_price < 50.0:
    # CLOB ask 是系统占位单，切换到 Gamma 价格
    price = gamma_price * (1 + SLIPPAGE)
```

### 6.3 账户双地址结构

Polymarket 的账户是 EOA + Proxy 双钱包架构：

| 地址类型 | 地址 | 用途 |
|---------|------|------|
| EOA（原始钱包）| `0x119c2CB8...` | 签名交易 |
| Proxy（代理合约）| `0xBaEeC5c4...` | 持仓、资产实际存放位置 |

**所有 Data API 查询必须同时查两个地址。** 只查 EOA 会得到 0 持仓，导致系统误判所有仓位已平仓。

---

## 七、第五层：持仓同步层

### 7.1 设计原则

> **Polymarket API 是 source of truth，SQLite 只是 UI 展示缓存。**

旧架构从本地 SQLite 读取持仓判断，导致：手动平仓后 bot 仍然认为仓位存在；API 查询地址错误后 bot 误判全部持仓消失，触发大规模误操作。

### 7.2 同步逻辑

```
每次 CRON 运行时：

Step 1：从 Data API 拉取实时持仓（EOA + Proxy 双地址，去重）
Step 2：与 SQLite 做 diff
        ├─ API 有 / DB 无  → 新建 DB 记录
        ├─ API 无 / DB 有  → ghost_close（查 closed-positions 获取真实 PnL）
        └─ 两边都有        → 用 API avgPrice 更新 DB entry_price

Step 3：安全保护
        if API返回0持仓 AND DB有持仓记录:
            跳过同步，记录警告
            # 原因：API 故障 or 地址查错，不是真的全平了
```

### 7.3 关键字段映射

| DB 字段 | API 字段来源 | 说明 |
|---------|-----------|------|
| `entry_price` | `avgPrice` | 真实加权平均入场价，非扫描时 Gamma 价格 |
| `shares` | `size` | 实际持有份数 |
| `current_price` | `curPrice` | 当前实时价格（用于仪表盘展示）|
| `pnl_pct` | `percentPnl` | Polymarket 服务器计算的真实收益率 |
| `cash_pnl` | `cashPnl` | 以 USDC 计价的绝对盈亏 |

---

## 八、第六层：退出层

### 8.1 退出触发机制

| 触发类型 | 优先级 | 条件 | 执行动作 |
|---------|-------|------|---------|
| 止盈（TP） | 高 | `percentPnl ≥ +35%` | 市价卖出全仓 |
| 止损（SL） | 高 | `percentPnl ≤ -25%` | 市价卖出全仓 |
| 到期结算 | 自动 | 市场到达结算日 | Polymarket 自动结算，无需操作 |
| 预报反转 | 中（v2.1）| 重新计算 P_weather，反向变动 > 20% | 市价卖出（信号失效）|

### 8.2 为什么 TP +35%，SL -25%

- **TP +35%**：Yes token 涨了 35% 说明市场已开始认同我们的判断。临近结算前价格会向 0 或 100 收敛，这时兑现浮盈比等待结算更优。
- **SL -25%**：价格反向移动说明新信息进入市场。我们的 edge 基于气象预报，如果市场反向，说明可能有更准确的信息覆盖了我们的预报。继续持有的边际价值低。

### 8.3 更好的退出逻辑（v2.1 目标）

当前 TP/SL 基于价格变动触发，是价格代理信号。更接近策略本质的退出条件是：

```
每次 CRON 运行时，对所有持仓重新计算 P_weather（预报更新了）
    if new_P_weather < original_P_weather - 20%:
        # 气象信号本身反转，alpha 来源消失
        → 立刻卖出，不等价格 SL
```

---

## 九、第七层：监控与任务层

### 9.1 定时任务定义

| 任务 | 频率 | 是否需要 LLM | 脚本 | 说明 |
|------|------|------------|------|------|
| CRON-1 市场扫描 + 下单 | 每 5 分钟 | ✅ Haiku | `main.py` | 主循环 |
| CRON-2 持仓同步 + TP/SL | 随 CRON-1 | ❌ | `main.py` 内嵌 | 纯逻辑判断 |
| MANUAL 紧急同步 | 按需 | ❌ | `sync_and_close.py` | 手动触发 |
| Watchdog（v2.1）| 每 5 分钟 | ❌ | 待实现 | 监控 CRON-1 是否存活 |

### 9.2 推送通知（Lark）

| 事件 | 推送内容 | 级别 |
|------|---------|------|
| 成功下单 | `✅ 买入 [Yes] @ X¢ | 市场: xxx | delta: +Y% | 金额: $Z` | INFO |
| 下单失败 | `❌ 下单失败: [原因]` | WARNING |
| TP/SL 触发 | `📤 平仓 [市场] | PnL: +/-X% | 原因: TP/SL` | INFO |
| 无机会 | （静默，不推送） | — |
| 日亏损告警 | `⚠️ 当日亏损已达 $15，接近上限` | WARNING |
| 日亏损达限 | `🛑 当日亏损 $20 已触发，今日暂停` | CRITICAL |
| API 签名失效 | `🔴 invalid signature，需重新派生凭证` | CRITICAL |

### 9.3 日志结构

```
polymarket_main.log
    [时间戳] 余额: $xxx
    [时间戳] 持仓同步: API=13个 / DB=15个 / ghost_close=2个
    [时间戳] 扫描: Paris March 11 | P_w=82% P_m=21% delta=+61% → BUY
    [时间戳] 下单: order_id=xxx | $6.52 @ 21.0¢ | status=delayed
    [时间戳] TP 触发: Wellington | +38.2% | 卖出 85 shares
```

---

## 十、第八层：风控层

### 10.1 风控总览

| 风控项 | 机制 | 状态 |
|--------|------|------|
| 最低余额保护 | `balance < $2` 停止运行 | ✅ 已实现 |
| 单笔仓位上限 | Kelly × 1/4，硬上限 $15 | ✅ 已实现 |
| 流动性门槛 | 市场流动性 ≥ $500 | ✅ 已实现 |
| 滑点保护 | 限价单 +3%，拒绝成交价超出 | ✅ 已实现 |
| 预报时效 | 仅交易 ≤ 3 天内结算 | ✅ 已实现 |
| 日亏损上限 | > $20 当日暂停新建仓 | ✅ 已实现 |
| 重复持仓保护 | 同市场 token_id 不重复买入 | ✅ 已实现 |
| 偏差阈值保护 | delta < 15% 不交易 | ✅ 已实现 |
| API 失败保护 | 气象 API 不通 → 整体停止 | ✅ 已实现 |
| 零持仓安全保护 | API 返回 0 持仓但 DB 有记录 → 跳过同步 | ✅ 已实现 |
| 预报反转止损 | 重新计算 P_weather，反转 > 20% 平仓 | 🔜 v2.1 |
| Watchdog 自检 | CRON 未执行时告警 | 🔜 v2.1 |

### 10.2 告警级别与动作

| 级别 | 触发条件 | 动作 |
|------|---------|------|
| INFO | 成功下单、TP/SL 平仓 | Lark 推送 |
| WARNING | 日亏损 > 75% 限额 | Lark 推送 |
| CRITICAL | 日亏损达限 / API 签名失效 / 气象 API 不通 | Lark 推送 + 停止运行 |

---

## 十一、LLM 参与边界

### 11.1 需要 LLM 的环节

| 环节 | 原因 | 模型 |
|------|------|------|
| 市场问题解析 | 自然语言格式不统一，正则无法覆盖所有变体 | Claude Haiku |
| BUY/SKIP 最终决策 | 多因子权衡（流动性/时效/问题歧义），规则引擎不够灵活 | Claude Haiku |
| 异常情况分析 | 非标准化错误需要推理 | Claude Sonnet |

### 11.2 不需要 LLM 的环节

| 环节 | 原因 |
|------|------|
| 概率计算（P_weather）| 纯数学，正态分布 |
| Kelly 仓位计算 | 纯公式 |
| Guard 前置检查 | 布尔条件组合 |
| TP/SL 判断 | 数值比较 |
| 持仓同步 diff | 集合运算 |
| 余额 / PnL 查询 | 纯 API 调用 |

---

## 十二、踩坑记录

### 12.1 技术类

| # | 坑 | 现象 | 根因 | 解决 |
|---|----|----|------|------|
| 1 | **signature_type 错误** | `invalid signature` / 余额=$0 | 代理钱包必须用 `signature_type=2` | `ClobClient(signature_type=2, funder=PROXY)` |
| 2 | **URL-safe base64 未转换** | HMAC 验证失败 | Polymarket secret 含 `-` `_`，但 py-clob-client 用标准 base64 解码 | `.replace('-','+').replace('_','/')` |
| 3 | **只查 EOA 地址** ⭐ | 持仓同步得 0，误判全部平仓，疯狂重新开 16 仓 | 持仓存在 Proxy 地址，EOA 查不到 | 同时查 EOA + Proxy，按 asset 去重 |
| 4 | **CLOB 占位挂单** | 买入价格 99.9¢（失真）| NegRisk 市场 CLOB 有系统占位单 | 改用 Gamma `outcomePrices` 作为真实价格 |
| 5 | **DB entry_price 不准** | PnL 计算偏差 | DB 存的是扫描时 Gamma 价，非真实成交均价 | 从 Data API `avgPrice` 同步覆盖 |
| 6 | **API 凭证过期** | 全天 `invalid signature` | Polymarket 凭证有时效 | 定期运行 `regen_api_keys.py` 重新派生 |
| 7 | **零持仓保护缺失** | API 故障 → DB 9 个持仓全部 ghost_close | 没有"API 返回 0 时跳过"的保护 | `if live=0 AND db>0: skip sync` |
| 8 | USDC 精度未处理 | 余额显示 $137,876,431 | USDC.e 6 位小数 | `raw / 1e6` |

### 12.2 架构设计类

| # | 坑 | 根因 | 解决 |
|---|----|----|------|
| 9 | 余额用静态配置值 | config.py 写死 $138.58，不实时 | 每次 run 调 `trader.get_balance()` |
| 10 | 本地 DB 当 source of truth | 手动平仓后 bot 仍认为仓位存在 | API 持仓 = 唯一真相，DB 只做展示缓存 |
| 11 | `get_portfolio_value()` 返回 $0 | `/value` 端点字段名与预期不符 | 改为 USDC 余额 + 持仓 `currentValue` 求和 |

---

## 十三、交易纪律

| 规则编号 | 规则内容 | 说明 |
|---------|---------|------|
| RULE-1 | 只在有气象数据支撑时下单 | 气象 API 不通，整体暂停，不退化为随机下注 |
| RULE-2 | delta < 15% 不交易 | 市场定价合理时保持观望 |
| RULE-3 | 预报时效 > 3 天不碰 | 预报不可信，信息优势消失 |
| RULE-4 | 单注上限 $15（Kelly × 1/4）| 保护本金，接受期望值小幅下降换取稳定性 |
| RULE-5 | API 持仓 = 唯一真相 | 永远不信本地 DB，实时查 API |
| RULE-6 | 相信大数定律 | EV > 0 的前提下，持续运行才能体现期望值，不因单次亏损改变策略 |

---

## 十四、策略自评与反思框架

### 14.1 为什么需要自我评价

这套系统的核心假设是：Open-Meteo 预报 + 正态分布 > 市场隐含概率。这个 edge 并非永久存在——市场会学习，参与者会改变，σ 参数是历史均值估计，对特定城市可能存在系统性偏差。

**没有自我评价，就无法区分：**

- 策略在正常运行，只是遇到了一段坏运气
- 策略的核心假设已经失效，继续跑只是在加速亏损

### 14.2 三个层次的评估

#### 层次 1：信号校准度（P_weather 可信吗？）

P_weather 基于历史均值 σ 的正态分布估算。如果它是准确的，预测 80% 胜率的交易，实际应该赢 ~80% 的时间。

| 统计窗口 | 评估方法 | 健康标准 |
|---------|---------|---------|
| 每 20 笔交易 | 分箱统计：P_weather 70-80% / 80-90% / >90% 各自的实际胜率 | 实际胜率 ≈ P_weather ± 10% |
| 每月滚动 | 30 日胜率趋势图 | 胜率不连续下降 |

```
信号校准偏差检测：

if 实际胜率 < P_weather_avg - 15%（持续 20 笔）:
    → σ 估计过小 → 我们在低质量信号上过度自信
    → 建议：将 delta 门槛从 15% 提高到 20%，或引入城市级 σ 校准
```

#### 层次 2：LLM 决策贡献度（Haiku 在帮倒忙吗？）

Claude Haiku 在 delta ≥ 15% 时仍会 SKIP 一部分机会。问题是：**它的 SKIP 判断是在保护本金，还是在浪费已知的正期望 edge？**

```
评估维度 1：BUY 准确率
    Haiku 说 BUY → 最终 WIN 的比例
    目标：> 纯规则执行的基准胜率（delta > 15% 直接 BUY 的胜率）

评估维度 2：SKIP 机会成本
    Haiku 说 SKIP → 记录市场最终结果
    如果"SKIP 中 80% 的市场最终 YES 方向正确"
    → Haiku 在浪费真实 edge，考虑移除 LLM 决策层
```

| Haiku 行为 | 理想结果 | 需要告警 |
|-----------|---------|---------|
| BUY → WIN | 胜率 > 60% | 胜率连续 10 笔 < 45% |
| SKIP → 市场反向（说明 SKIP 对） | SKIP 正确率 > 50% | SKIP 正确率 < 30% |

#### 层次 3：Alpha 衰减探测（市场在变聪明吗？）

这是最重要的长期指标。天气市场如果吸引了更多有数据的参与者，delta 会自然收窄，边际 edge 消失。

| 监控指标 | 含义 | 告警阈值 |
|---------|------|---------|
| 月均 entry delta | 入场时 P_weather − P_market 均值 | 连续 2 个月 < 12% |
| 月胜率 | 当月入场交易最终 WIN 比例 | 连续 2 个月 < 50% |
| 结算期 PnL（持有至结算）| 不 TP/SL 的真实信息优势 | 负值（扣费后）|

```python
# Alpha 衰减触发逻辑（每月 1 日执行）
if monthly_win_rate < 0.50 and avg_entry_delta < 0.12:
    pause_new_positions = True
    send_lark_alert("⚠️ Alpha 衰减信号：胜率与 delta 双降，暂停新建仓，等待人工审查")
```

### 14.3 我现在不确定的事（设计盲点诚实清单）

| 假设 | 当前判断 | 不确定的地方 |
|------|---------|------------|
| σ = {1d:1.7°C, 2d:2.2°C, 3d:3.1°C} 适用所有城市 | 全球平均值 | 沿海、热带、高海拔城市误差分布不同 |
| delta ≥ 15% 是充分条件 | 安全垫估算 | 未经足够样本验证，可能 20% 更优 |
| TP +35% / SL -25% 是最优退出点 | 经验估计 | 缺乏回测数据，只有少数实盘样本 |
| Claude Haiku 在 BUY/SKIP 上有正贡献 | 假设它在过滤差信号 | **从未量化验证，这是最大的未知** |
| Open-Meteo 是最准确的免费气象源 | 广泛使用，有信心 | 未与 Weather.gov、ECMWF 横向精度对比 |
| 流动性 ≥ $500 足够保证成交 | 经验判断 | 天气市场滑点极端，$500 流动性仍可能被耗尽 |

### 14.4 自评触发机制

```
触发 1（实时）：连续 3 笔亏损
    → Lark 推送：最近 10 笔胜率 / 平均入场 delta / 累计 PnL

触发 2（每 20 笔交易）：信号校准报告
    → 分箱统计 P_weather vs 实际胜率
    → 检查 σ 是否需要调整

触发 3（每月 1 日）：Alpha 衰减月度报告
    → 本月 vs 上月：delta 均值 / 胜率 / 总 PnL / 成交笔数

触发 4（自动暂停）：月胜率 < 45%（连续 2 个月）
    → 暂停新建仓，发 CRITICAL 告警，等待人工判断
    → 策略并非失效，可能只是需要重新校准 σ 参数
```

---

## 十五、版本规划

| 版本 | 核心能力 | 状态 |
|------|---------|------|
| v1.0 | 规则引擎，低价 token 扫描（无信息优势）| ✅ 已关闭 |
| v2.0 | Open-Meteo + Claude API 全自动决策 + 实时持仓同步 | 🔄 实施中 |
| v2.1 | 预报反转主动止损 + σ 城市级校准 + Watchdog | 🔜 下一步 |
| v2.2 | σ 参数基于历史结算数据自动校准 | 🔮 |
| v3.0 | 多气象源 A/B 测试 + 降水/风速市场扩展 | 🔮 |

---

## 十六、术语表

| 术语 | 定义 |
|------|------|
| P_weather | Open-Meteo 预报计算的事件真实概率 |
| P_market | Polymarket 市场价格隐含概率（= `outcomePrices[0]`）|
| delta | `P_weather − P_market`，套利偏差，核心入场信号 |
| σ（sigma）| 气温预报误差标准差，用于正态分布概率计算 |
| Kelly Criterion | 最优仓位公式，基于赔率和胜率动态计算 |
| EOA | Externally Owned Account，用私钥控制的原始钱包，负责签名 |
| Proxy | Polymarket 智能合约代理钱包，持仓和资产的实际存放位置 |
| signature_type=2 | POLY_PROXY 模式，Polymarket 代理钱包下单必须使用 |
| CLOB | Central Limit Order Book，中央限价订单簿 |
| NegRisk | Polymarket 多选一市场结构，CLOB 中存在系统占位挂单 |
| GTC | Good Till Cancelled，永久有效挂单，不自动撤销 |
| ghost_close | DB 有记录但 API 查不到的持仓，从 closed-positions 拉真实 PnL 后关闭 |
| Guard | 下单前的前置条件验证（余额 / 日亏损 / 重复 / 气象 API）|
| avgPrice | Data API 返回的真实加权平均入场价格（非 DB 估算值）|
| outcomePrices | Gamma API 返回的 Yes/No token 实时市场价格，NegRisk 市场唯一可信价格来源 |
