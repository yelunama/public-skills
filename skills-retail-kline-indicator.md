---
description: "K线指标引擎 - 三支柱分析框架（宏观周期 + 量价因子 + 衍生品），技术指标、K线形态、背离检测、支撑阻力、图表可视化、订单流、指标预警、条件交易。输入 /kline-indicators 开始使用。"
user-prompts:
  # === 快速分析（最常用）===
  - "分析BTC"
  - "分析一下BTC"
  - "看看BTC行情"
  - "BTC现在怎么样"
  - "BTC技术分析"
  - "ETH指标分析"
  - "SOL信号"
  - "帮我看看ETH"
  - "BTC多空怎么看"
  - "比特币现在是什么趋势"
  - "以太坊技术面"
  # === 完整分析 ===
  - "全面分析BTC"
  - "BTC完整分析"
  - "深度分析ETH"
  - "BTC全方位分析"
  - "给我BTC的详细技术分析"
  - "分析BTC --full"
  # === 图表 ===
  - "画BTC的K线图"
  - "BTC K线图表"
  - "生成BTC图表"
  - "BTC技术图表"
  - "画个ETH的MACD图"
  - "BTC蜡烛图"
  - "看看BTC的K线走势"
  - "BTC走势图"
  # === 扫描 ===
  - "扫描热门币"
  - "哪些币有信号"
  - "扫描市场信号"
  - "找找有没有强势币"
  - "今天哪些币值得关注"
  - "市场扫描"
  # === 订单流 ===
  - "BTC订单流分析"
  - "看看BTC的买卖盘"
  - "BTC深度分析"
  - "BTC盘口数据"
  - "BTC挂单情况"
  - "ETH订单流"
  # === 宏观/情绪 ===
  - "BTC宏观分析"
  - "市场情绪怎么样"
  - "恐贪指数多少"
  - "BTC资金费率"
  - "BTC持仓量"
  - "市场情绪面板"
  - "BTC多空比"
  # === 预警 ===
  - "BTC RSI低于30提醒我"
  - "设置BTC价格预警"
  - "ETH MACD金叉提醒"
  - "BTC跌破60000提醒"
  # === 自定义指标 ===
  - "只看BTC的RSI和MACD"
  - "计算BTC的布林带"
  - "BTC的Stochastic指标"
  - "算一下BTC的ATR"
  - "BTC ichimoku"
  # === 条件交易 ===
  - "BTC能不能做多"
  - "BTC现在适合交易吗"
  - "分析BTC并给出交易建议"
  - "BTC交易信号"
  - "帮我评估BTC做空机会"
  - "BTC合约交易分析"
  # === K线形态 ===
  - "BTC有没有K线形态"
  - "检测BTC K线形态"
  - "BTC有没有吞没形态"
  - "看看BTC的蜡烛图形态"
  # === 背离检测 ===
  - "BTC有没有背离"
  - "检测BTC MACD背离"
  - "BTC RSI背离"
  - "BTC有没有顶背离"
  # === 支撑阻力 ===
  - "BTC支撑位在哪"
  - "BTC阻力位多少"
  - "BTC关键价位"
  - "ETH支撑和阻力"
---

# K线指标引擎

基于 OKX TradeKit（`okx-trade-mcp` MCP Server + `okx-trade-cli` CLI）+ 扩展 Python 计算的全方位技术分析引擎。采用**三支柱分析框架**（宏观周期 + 量价因子 + 衍生品）进行综合评估。

## 能力总览

| 类别 | 能力 | 数据来源 |
|------|------|--------|
| **支柱 1: 宏观周期** | **Rainbow Chart, AHR999, MVRV, 恐贪指数, BTC 主导率, BTC/GDP, ETF 资金流, CAPE, 巴菲特指标** | **外部 API (alternative.me, CoinGecko, CoinMetrics, FRED, CoinGlass) + Python 计算** |
| **支柱 2: 量价因子** | **完整技术指标体系 (趋势/动量/成交量/波动率/周期/形态/统计) + Alpha 因子** | **MCP `market_get_candles` / CLI `okx --json market candles` + 内置 Python 引擎** |
| **支柱 3: 衍生品** | **资金费率深度分析, 基差/Carry, DVOL(Deribit波动率指数), BVOL(已实现波动率), 期权偏斜, 持仓量, 多空比, 爆仓热力图** | **MCP `market_get_*` / CLI `okx --json market` + OKX/CoinGlass/Deribit** |
| 核心技术指标 | MA, MACD, RSI, BB, ATR, 动量, 成交量 | MCP `market_get_candles` / CLI `okx --json market candles` + 内联 Python 信号引擎 |
| 扩展技术指标 | Stochastic, CCI, Williams%R, ADX, Ichimoku, SAR, SuperTrend, VWAP, OBV, MFI, Pivot, Fibonacci, Heikin-Ashi, Keltner, Donchian, CMF, TRIX, DPO, KST, Aroon, Elder Ray, Mass Index, Vortex, Ultimate Oscillator, RVI, Force Index 等 | 内置 Python 引擎 |
| **K线形态识别** | **30+ 种形态: 锤子线, 吞没, 十字星, 启明星, 三兵, 乌云盖顶, 刺透, 孕线, 捉腰带线, 流星, 上吊, 倒锤子等** | **内置 Python 引擎** |
| **背离检测** | **RSI/MACD/OBV 顶背离、底背离自动检测，含背离强度评分** | **内置 Python 引擎** |
| **支撑阻力** | **自动识别关键支撑/阻力位、趋势线、市场结构（HH/HL/LH/LL）** | **内置 Python 引擎** |
| **高级波动率** | **Garman-Klass, Parkinson, Yang-Zhang, 波动率锥, 波动率区间** | **内置 Python 引擎** |
| **Alpha 101 因子** | **~40 个时序因子 (动量/均值回归/量价/波动率调整) + ~60 个截面因子 (scan 模式)** | **内置 Python 引擎 (WorldQuant Alpha#101)** |
| **Alpha 191 因子** | **~80 个时序因子 (扩展动量/量能动态/价格结构/衰减加权) + ~90 个截面因子 (scan 模式)** | **内置 Python 引擎 (WorldQuant Alpha#191)** |
| 多周期组合 | 所有指标 × 5 个周期 (5m, 15m, 1H, 4H, 1D) | 自动扫描 |
| **订单流分析** | **Delta/CVD, 买卖盘不平衡, 挂单墙检测, 价差分析, 深度分布, 主动成交比, 大单检测, 多维评分(0-100), CLI 格式化输出** | **内置 Python 引擎 + MCP `market_get_orderbook/trades/funding_rate/open_interest` / CLI** |
| 量价 | VWAP, OBV, PVT, MFI, A/D, CMF, 成交量分布, 相对成交量 | K线数据 + 计算 |
| 宏观/情绪 | 恐贪指数, 资金费率, 持仓量, 多空比, 爆仓, CoinGlass, CoinGecko, CryptoPanic | 直接 API 调用 |
| **图表可视化** | **多面板K线图: 蜡烛图+MA/BB叠加, MACD/RSI/成交量子图, 形态标记, 背离箭头, 支撑阻力线** | **内置 Python 图表引擎** |
| 预警 | 阈值, 交叉, 背离, 多条件组合 | 条件引擎 |
| **条件交易** | **信号评估→盈利判定→仓位计算→下单执行→止盈止损→持仓管理，支持现货/合约/限价/市价/OCO/追踪止损** | **内置 Python 交易决策引擎 + MCP `spot_*/swap_*/account_*` / CLI** |

---

## 依赖

本 skill 采用**双轨数据策略**：优先通过 MCP 工具获取数据，CLI 作为 fallback。

### 安装

```bash
# 推荐：一次性安装（同时提供 MCP Server + CLI）
npm install -g okx-trade-mcp

# 或分别安装
npm install -g @okx_ai/okx-trade-mcp   # MCP Server
npm install -g @okx_ai/okx-trade-cli    # CLI 工具 (okx 命令)
```

验证可用性：
```bash
which okx-trade-mcp && echo "MCP Server OK" || echo "Install: npm install -g okx-trade-mcp"
which okx && echo "CLI OK" || echo "Install: npm install -g okx-trade-cli"
```

### 数据获取策略

| 优先级 | 方式 | 适用场景 | 说明 |
|--------|------|---------|------|
| **1 (首选)** | **MCP 工具** | 简单查询、交易执行 | AI Agent 直接调用 MCP tool，结构化返回，无需 shell |
| **2 (回退)** | **CLI (`okx`)** | 批量数据管道、Python 脚本输入 | 通过 `okx --json` 获取 JSON，管道至文件供 Python 脚本消费 |

**MCP 工具命名规则**：`{module}_{action}`，如 `market_get_candles`、`swap_place_order`、`account_get_balance`。

**CLI 命令格式**：`okx [--json] <module> <action> [args...]`，以下代码块中 `$OKX` 即 `okx`。

### MCP ↔ CLI 对照表

| 数据 | MCP Tool | CLI 等价命令 |
|------|----------|-------------|
| K线 | `market_get_candles(instId, bar, limit)` | `okx --json market candles $INST --bar $BAR --limit $N` |
| Ticker | `market_get_ticker(instId)` | `okx --json market ticker $INST` |
| Tickers | `market_get_tickers(instType)` | `okx --json market tickers SPOT` |
| 深度 | `market_get_orderbook(instId, sz)` | `okx --json market orderbook $INST --sz 20` |
| 成交 | `market_get_trades(instId, limit)` | `okx --json market trades $INST --limit 100` |
| 资金费率 | `market_get_funding_rate(instId)` | `okx --json market funding-rate $INST` |
| 持仓量 | `market_get_open_interest(instType, instId)` | `okx --json market open-interest --instType SWAP --instId $INST` |
| 标记价 | `market_get_mark_price(instType, instId)` | `okx --json market mark-price --instType SWAP --instId $INST` |
| 账户余额 | `account_get_balance(ccy)` | `okx account balance --ccy USDT` |
| 持仓 | `account_get_positions(instType)` | `okx --json account positions --instType SWAP` |
| 最大可用 | `account_get_max_avail_size(instId, tdMode)` | `okx account max-avail-size --instId $INST --tdMode $MODE` |
| 设置杠杆 | `swap_set_leverage(instId, lever, mgnMode)` | `okx swap leverage --instId $INST --set --lever $N --mgnMode $MODE` |
| 查询杠杆 | `swap_get_leverage(instId, mgnMode)` | `okx swap leverage --instId $INST --mgnMode $MODE` |
| 合约下单 | `swap_place_order(instId, side, sz, ...)` | `okx swap place --instId $INST --side buy --sz $SZ ...` |
| 现货下单 | `spot_place_order(instId, side, sz, ...)` | `okx spot place --instId $INST --side buy --sz $SZ ...` |
| 条件单 | `swap_place_algo_order(instId, ...)` | `okx swap algo place --instId $INST ...` |
| 合约平仓 | `swap_close_position(instId, mgnMode, ...)` | `okx swap close --instId $INST --mgnMode $MODE ...` |

### K线数据格式
每根K线: `[timestamp_ms, open, high, low, close, volume, quote_volume, period_volume, confirm]`
- Index 4 = close（收盘价，用于指标计算）
- Index 5 = volume（成交量）
- Index 8 = confirm（1 = 完成的K线）

### 补充数据源（通过 curl）
orderbook、trades、open-interest、OKX Rubik 等数据通过 OKX REST API 直接获取：
```
https://www.okx.com/api/v5/market/books?instId={INST_ID}&sz=20
https://www.okx.com/api/v5/market/trades?instId={INST_ID}&limit=100
https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId={INST_ID}
https://www.okx.com/api/v5/rubik/stat/contracts-long-short-account-ratio?instId={INST_ID}
```

---

## 使用模式

### 模式 1: 快速信号 (`/kline-indicators BTC`)
单币种多时间周期核心指标信号。

### 模式 2: 完整分析 (`/kline-indicators BTC --full`)
全面分析：技术指标 + K线形态 + 背离 + 支撑阻力 + 订单流 + 宏观。

### 模式 3: 扫描 (`/kline-indicators scan`)
扫描热门币种，找出最强信号。

### 模式 4: 预警 (`/kline-indicators alert BTC RSI14 < 30`)
设置阈值/交叉预警。

### 模式 5: 订单流 (`/kline-indicators orderflow BTC`)
订单流分析，含深度、Delta、CVD。

### 模式 6: 宏观 (`/kline-indicators macro BTC`)
宏观/情绪面板，含资金费率、持仓量、恐贪指数。

### 模式 7: 自定义 (`/kline-indicators BTC --indicators "RSI,MACD,BB" --periods "14,26,20"`)
指定计算特定指标和周期。

### 模式 8: 图表 (`/kline-indicators BTC --chart` 或 `/kline-indicators chart BTC`)
生成多面板技术分析图表，直接在 CLI 终端显示。支持：
- 主图：蜡烛图 + MA/BB/支撑阻力叠加
- 子图：MACD 柱状图、RSI 超买超卖区、成交量柱
- 标注：K线形态标记、背离箭头、趋势线
- 加 `--save` 可同时保存 PNG 高清图片

### 模式 9: 条件交易 (`/kline-indicators trade BTC` 或 `/kline-indicators BTC --trade`)
**完成全面分析后，当信号满足盈利条件时，自动生成交易计划并在用户确认后执行。**
- 自动执行完整分析（第 1-4 步）→ 评估盈利信号
- 仅当加权总分 ≥ 65/100 且盈亏比 ≥ 1.5:1 时推荐交易
- 支持参数:
  - `--risk 2` — 单笔风险占账户比例%（默认 2%）
  - `--leverage 5` — 合约杠杆倍数（默认 5x）
  - `--mode isolated` — 保证金模式: cash/isolated/cross（默认 isolated）
  - `--type swap` — 交易类型: spot/swap（默认 swap）
  - `--confirm` — 跳过确认直接执行（谨慎使用）
  - `--dry-run` — 仅显示交易计划，不执行（默认行为）

---

## 三支柱分析框架

分析分为三个支柱，各有独立评分，加权汇总为综合评分：

| 支柱 | 权重 | 评分范围 | 回答的问题 |
|------|------|---------|-----------|
| 宏观周期 (Pillar 1) | 30% | 0-100 | 我们在周期的什么位置？ |
| 量价因子 (Pillar 2) | 40% | 0-100 | 量价信号怎么说？ |
| 衍生品 (Pillar 3) | 30% | 0-100 | 聪明钱/衍生品市场定价了什么？ |

**综合评分** → 市场阶段分类：
- **0-20**: 深度价值 / 投降 — 最大累积仓位
- **20-40**: 恢复期 / 早牛 — 逐步建仓
- **40-60**: 周期中段 / 中性 — 选择性布局
- **60-80**: 晚牛 / 过热 — 降低风险
- **80-100**: 狂热 / 派发 — 最大谨慎 / 对冲

> **支柱 2（量价因子）** 对应现有的第 1-3 步（核心指标 + 扩展指标 + 订单流），已完整实现。
> **支柱 1（宏观周期）** 和 **支柱 3（衍生品）** 在第 4 步中实现。

---

## 执行指令

**重要：所有面向用户的输出必须使用中文。**

### 第 0 步：解析用户请求

从用户输入中提取：
- `$COIN` — 币种符号（默认: BTC）
  - 输入 "BTC" / "btc" → 自动拼接为 `BTC-USDT`
  - 输入 "BTC-USDT" → 直接使用
  - 输入 "BTC-USDT-SWAP" → 直接使用（合约）
  - 智能判断：如需合约数据（资金费率等），使用 `-USDT-SWAP` 后缀
- `$MODE` — quick / full / scan / alert / orderflow / macro / custom / chart / trade（默认: quick）
- `$BARS` — 分析时间周期（默认: "5m,15m,1H,4H,1D"）
- `$CHART` — 是否生成图表（`--chart` 或 mode=chart 时启用；`--full` 模式自动启用）
- `$CHART_BAR` — 图表使用的时间周期（默认: "1H"，图表只渲染单个周期）
- `$CHART_SAVE` — 是否保存 PNG（`--save` 时启用）
- `$INDICATORS` — 自定义模式下的指定指标
- `$ALERT_CONDITION` — 预警模式下的条件表达式
- `$TRADE_RISK` — 单笔风险比例%（默认: 2）
- `$TRADE_LEVERAGE` — 杠杆倍数（默认: 5）
- `$TRADE_MARGIN_MODE` — 保证金模式: cash / isolated / cross（默认: isolated）
- `$TRADE_TYPE` — 交易类型: spot / swap（默认: swap）
- `$TRADE_CONFIRM` — 是否跳过确认（`--confirm` 时为 true，默认: false）
- `$TRADE_DRY_RUN` — 仅展示计划不执行（默认: true，`--execute` 时为 false）

---

### 第 1 步：核心指标（必执行）

对 `$BARS` 中的每个时间周期，获取K线数据并计算信号：

```
# 方式 1（首选）：MCP Tool
调用 market_get_candles(instId="$COIN-USDT", bar="$BAR", limit="100")
→ 将返回的 candles 数组保存到 /tmp/okx_candles_${COIN}_${BAR}.json

# 方式 2（回退）：CLI
okx --json market candles $COIN-USDT --bar $BAR --limit 100 > /tmp/okx_candles_${COIN}_${BAR}.json
```

**从K线数据计算核心信号（每个周期）：**
使用 CLOSE (index 4) 和 VOLUME (index 5) 计算：
- MA7, MA25, MA50: SMA
- MACD (12,26,9): DIF, DEA, Histogram, 是否刚金叉/死叉
- RSI6, RSI14: Wilder smoothing
- BB (20,2): upper, mid, lower, %B position
- ATR14
- Vol Ratio: 当前成交量 / 20期均量
- Momentum 5, 10: close - close[n]

汇总所有时间周期结果到 `$SIGNALS`。

**单周期信号评分**（基于K线数据计算）：
- 价格 > MA7/25/50：看多加分
- MACD 金叉：+3（刚交叉）或 +1（持续中）
- RSI14 < 30：超卖 (+2)，RSI14 30-45：偏多区 (+1)
- RSI14 > 70：超买 (-2)，RSI14 55-70：偏空区 (-1)
- BB 位置 < 20%：超卖 (+2)，> 80%：超买 (-2)
- 成交量比 > 1.5：确认信号 (+1)
- 动量为正：+1

**多周期聚合：**
- 主时间周期：60% 权重
- 上一级周期：±10% 置信度
- 上两级周期：±5% 置信度

---

### 第 2 步：扩展指标 + 形态 + 背离 + 支撑阻力（模式: full / custom）

获取原始K线数据，写入内置扩展指标引擎并执行：

```bash
# 获取K线数据（MCP 首选，CLI 回退）
# MCP: 调用 market_get_candles(instId="$COIN-USDT", bar="$BAR", limit="300")，将结果写入文件
# CLI 回退:
okx --json market candles $COIN-USDT --bar $BAR --limit 300 > /tmp/candles_${COIN}_${BAR}.json

# 验证K线数据已正确获取（非空且是有效JSON）
if [ ! -s /tmp/candles_${COIN}_${BAR}.json ] || ! python3 -c "import json; json.load(open('/tmp/candles_${COIN}_${BAR}.json'))" 2>/dev/null; then
  echo "WARNING: K线数据获取失败，请检查 okx CLI 和网络连接"
  sleep 1
  okx --json market candles $COIN-USDT --bar $BAR --limit 300 > /tmp/candles_${COIN}_${BAR}.json
fi

# 写入扩展指标引擎（heredoc 内置）
cat << 'EXT_INDICATORS_ENGINE' > /tmp/kline_ext_indicators.py
#!/usr/bin/env python3
"""
Extended Indicator Engine for OKX TradeKit (okx-trade-mcp / okx-trade-cli) K-Line Indicators Skill.
Computes technical indicators + candlestick patterns + divergence + support/resistance
from raw OHLCV candle data.

Usage:
    python3 kline_ext_indicators.py --candles /tmp/candles.json --mode full --output /tmp/indicators.json
    python3 kline_ext_indicators.py --candles /tmp/candles.json --mode category --categories trend,momentum,patterns
    python3 kline_ext_indicators.py --candles /tmp/candles.json --mode custom --indicators "RSI_14,MACD,BB_20_2"
    python3 kline_ext_indicators.py --list
    python3 kline_ext_indicators.py --count

Input: JSON array of candles [[ts, o, h, l, c, vol, ...], ...]
Output: JSON with indicator values grouped by category
Dependencies: Python 3.8+ (stdlib only, no external packages required)
"""

import json, math, sys, argparse
from typing import List, Dict, Optional, Tuple, Any
from collections import OrderedDict


# --- Core math helpers ---

def sma(data, period):
    if len(data) < period: return None
    return sum(data[-period:]) / period

def sma_series(data, period):
    result = []
    for i in range(len(data)):
        if i < period - 1: result.append(None)
        else: result.append(sum(data[i - period + 1:i + 1]) / period)
    return result

def ema(data, period):
    if len(data) < period: return None
    k = 2.0 / (period + 1)
    val = sum(data[:period]) / period
    for price in data[period:]: val = price * k + val * (1 - k)
    return val

def ema_series(data, period):
    if len(data) < period: return [None] * len(data)
    k = 2.0 / (period + 1)
    result = [None] * (period - 1)
    val = sum(data[:period]) / period
    result.append(val)
    for i in range(period, len(data)):
        val = data[i] * k + val * (1 - k)
        result.append(val)
    return result

def wma(data, period):
    if len(data) < period: return None
    weights = list(range(1, period + 1))
    return sum(d * w for d, w in zip(data[-period:], weights)) / sum(weights)

def hma(data, period):
    half = max(period // 2, 1); sqrt_p = max(int(math.sqrt(period)), 1)
    vals = []
    for i in range(len(data)):
        w_h = wma(data[:i+1], half); w_f = wma(data[:i+1], period)
        if w_h is not None and w_f is not None: vals.append(2 * w_h - w_f)
    if len(vals) < sqrt_p: return None
    return wma(vals, sqrt_p)

def dema(data, period):
    e1 = ema(data, period); es = ema_series(data, period)
    v = [x for x in es if x is not None]; e2 = ema(v, period) if len(v) >= period else None
    if e1 is None or e2 is None: return None
    return 2 * e1 - e2

def tema(data, period):
    e1s = ema_series(data, period); v1 = [x for x in e1s if x is not None]
    e2s = ema_series(v1, period) if len(v1) >= period else []; v2 = [x for x in e2s if x is not None] if e2s else []
    e1 = ema(data, period); e2 = ema(v1, period) if len(v1) >= period else None; e3 = ema(v2, period) if len(v2) >= period else None
    if e1 is None or e2 is None or e3 is None: return None
    return 3 * e1 - 3 * e2 + e3

def kama_val(data, period=10, fast=2, slow=30):
    if len(data) < period + 1: return None
    direction = abs(data[-1] - data[-period - 1])
    volatility = sum(abs(data[i] - data[i-1]) for i in range(-period, 0))
    er = direction / volatility if volatility else 0
    sc = (er * (2.0/(fast+1) - 2.0/(slow+1)) + 2.0/(slow+1)) ** 2
    val = sum(data[:period]) / period
    for price in data[period:]: val = val + sc * (price - val)
    return val

def stdev(data, period):
    if len(data) < period: return None
    subset = data[-period:]; avg = sum(subset)/period
    return math.sqrt(sum((x-avg)**2 for x in subset)/period)

def true_range(h, l, prev_c):
    return max(h - l, abs(h - prev_c), abs(l - prev_c))

def atr_val(highs, lows, closes, period):
    if len(closes) < period + 1: return None
    trs = [true_range(highs[i], lows[i], closes[i-1]) for i in range(1, len(closes))]
    if len(trs) < period: return None
    return sum(trs[-period:]) / period


# --- Alpha factor building blocks ---

def delay(data, d):
    """Value d periods ago."""
    if len(data) <= d: return None
    return data[-d-1]

def delta_s(data, d):
    """x[t] - x[t-d]."""
    if len(data) <= d: return None
    return data[-1] - data[-d-1]

def ts_sum(data, d):
    if len(data) < d: return None
    return sum(data[-d:])

def ts_mean(data, d):
    if len(data) < d: return None
    return sum(data[-d:]) / d

def ts_stddev(data, d):
    return stdev(data, d)

def ts_rank(data, d):
    """Percentile rank of current value within last d values (0~1)."""
    if len(data) < d: return None
    window = data[-d:]
    val = data[-1]
    return sum(1 for x in window if x <= val) / d

def ts_min(data, d):
    if len(data) < d: return None
    return min(data[-d:])

def ts_max(data, d):
    if len(data) < d: return None
    return max(data[-d:])

def ts_argmin(data, d):
    """Days since min in last d values (0 = today is min)."""
    if len(data) < d: return None
    window = data[-d:]
    return d - 1 - window.index(min(window))

def ts_argmax(data, d):
    """Days since max in last d values (0 = today is max)."""
    if len(data) < d: return None
    window = data[-d:]
    return d - 1 - window.index(max(window))

def ts_corr(x, y, d):
    """Pearson correlation of last d values."""
    if len(x) < d or len(y) < d: return None
    xw, yw = x[-d:], y[-d:]
    mx, my = sum(xw)/d, sum(yw)/d
    cov = sum((xw[i]-mx)*(yw[i]-my) for i in range(d))/d
    sx = math.sqrt(sum((v-mx)**2 for v in xw)/d)
    sy = math.sqrt(sum((v-my)**2 for v in yw)/d)
    if sx == 0 or sy == 0: return 0
    return max(-1, min(1, cov / (sx * sy)))

def ts_cov(x, y, d):
    if len(x) < d or len(y) < d: return None
    xw, yw = x[-d:], y[-d:]
    mx, my = sum(xw)/d, sum(yw)/d
    return sum((xw[i]-mx)*(yw[i]-my) for i in range(d))/d

def decay_linear(data, d):
    """Linearly decaying weighted average (recent weight higher)."""
    if len(data) < d: return None
    weights = list(range(1, d+1))
    window = data[-d:]
    return sum(w*v for w, v in zip(weights, window)) / sum(weights)

def ts_product(data, d):
    if len(data) < d: return None
    result = 1.0
    for v in data[-d:]:
        result *= v
        if abs(result) > 1e20: return None
    return result

def returns_series(closes):
    """Return series: (c[i]-c[i-1])/c[i-1]."""
    return [0.0] + [(closes[i]-closes[i-1])/closes[i-1] if closes[i-1] != 0 else 0 for i in range(1, len(closes))]

def adv_series(volumes, d):
    """Rolling average volume series."""
    result = []
    for i in range(len(volumes)):
        if i < d - 1: result.append(sum(volumes[:i+1])/(i+1))
        else: result.append(sum(volumes[i-d+1:i+1])/d)
    return result

def vwap_full(highs, lows, closes, volumes):
    """Per-bar typical price (proxy for VWAP)."""
    return [(highs[i]+lows[i]+closes[i])/3 for i in range(len(closes))]

def signed_power(x, a):
    if x is None: return None
    return math.copysign(abs(x)**a, x) if x != 0 else 0

def log_safe(x):
    return math.log(x) if x and x > 0 else 0

def ts_rank_series(data, d):
    """Full ts_rank series. None-safe."""
    result = []
    for i in range(len(data)):
        if i < d - 1 or data[i] is None: result.append(None)
        else:
            window = [data[j] for j in range(i-d+1, i+1) if data[j] is not None]
            if len(window) < 2: result.append(None)
            else: result.append(sum(1 for x in window if x <= data[i]) / len(window))
    return result

def delta_series(data, d):
    """Full delta series. None-safe."""
    result = [None]*d
    for i in range(d, len(data)):
        if data[i] is None or data[i-d] is None: result.append(None)
        else: result.append(data[i]-data[i-d])
    return result

def ts_corr_series(x, y, d):
    """Full correlation series. None-safe."""
    result = []
    for i in range(len(x)):
        if i < d - 1: result.append(None)
        else:
            xw = x[i-d+1:i+1]; yw = y[i-d+1:i+1]
            if any(v is None for v in xw) or any(v is None for v in yw):
                result.append(None); continue
            mx = sum(xw)/d; my = sum(yw)/d
            cov = sum((xw[j]-mx)*(yw[j]-my) for j in range(d))/d
            sx = math.sqrt(sum((v-mx)**2 for v in xw)/d)
            sy = math.sqrt(sum((v-my)**2 for v in yw)/d)
            if sx == 0 or sy == 0: result.append(0)
            else: result.append(max(-1, min(1, cov/(sx*sy))))
    return result


class IndicatorEngine:
    DEFAULT_PERIODS = [5, 7, 9, 10, 14, 20, 21, 25, 30, 50, 100, 200]

    def __init__(self, candles, periods=None):
        self.periods = periods or self.DEFAULT_PERIODS
        self.ts = [float(c[0]) for c in candles]
        self.opens = [float(c[1]) for c in candles]
        self.highs = [float(c[2]) for c in candles]
        self.lows = [float(c[3]) for c in candles]
        self.closes = [float(c[4]) for c in candles]
        self.volumes = [float(c[5]) if len(c) > 5 else 0.0 for c in candles]
        self.n = len(candles)

    def _s(self, val, d=6):
        if val is None or (isinstance(val, float) and (math.isnan(val) or math.isinf(val))): return None
        return round(val, d)

    # ---- Trend ----
    def compute_trend(self):
        r = {}; c = self.closes
        for p in self.periods:
            r[f"sma_{p}"] = self._s(sma(c,p)); r[f"ema_{p}"] = self._s(ema(c,p))
            r[f"wma_{p}"] = self._s(wma(c,p)); r[f"dema_{p}"] = self._s(dema(c,p))
            r[f"tema_{p}"] = self._s(tema(c,p)); r[f"hma_{p}"] = self._s(hma(c,p))
            if p <= 30: r[f"kama_{p}"] = self._s(kama_val(c,p))
        for mult in [2,3]:
            for p in [7,10,14,20]:
                a = atr_val(self.highs,self.lows,c,p)
                if a:
                    hl2 = (self.highs[-1]+self.lows[-1])/2
                    up,lo = hl2+mult*a, hl2-mult*a
                    d = "up" if c[-1]>up else ("down" if c[-1]<lo else "up")
                    r[f"supertrend_{p}_{mult}"] = {"value": self._s(lo if d=="up" else up), "direction": d}
        if self.n >= 52:
            h,l = self.highs,self.lows
            r["ichimoku"] = {"tenkan": self._s((max(h[-9:])+min(l[-9:]))/2), "kijun": self._s((max(h[-26:])+min(l[-26:]))/2),
                "senkou_a": self._s(((max(h[-9:])+min(l[-9:]))/2+(max(h[-26:])+min(l[-26:]))/2)/2),
                "senkou_b": self._s((max(h[-52:])+min(l[-52:]))/2), "chikou": self._s(c[-1])}
        sar = self._parabolic_sar()
        if sar is not None: r["parabolic_sar"] = self._s(sar)
        for p in [14,20,25,50]:
            if len(self.highs) >= p+1:
                rh = self.highs[-(p+1):]; rl = self.lows[-(p+1):]
                r[f"aroon_up_{p}"] = self._s(rh.index(max(rh))/p*100)
                r[f"aroon_down_{p}"] = self._s(rl.index(min(rl))/p*100)
                r[f"aroon_osc_{p}"] = self._s(r[f"aroon_up_{p}"]-(r[f"aroon_down_{p}"] or 0))
        for p in [7,14,20,25]:
            adx = self._adx(p)
            if adx: r[f"adx_{p}"] = self._s(adx["adx"]); r[f"plus_di_{p}"] = self._s(adx["plus_di"]); r[f"minus_di_{p}"] = self._s(adx["minus_di"])
        for p in [7,14,21,28]:
            if len(c) >= p+1:
                vm_p = sum(abs(self.highs[i]-self.lows[i-1]) for i in range(-p,0))
                vm_m = sum(abs(self.lows[i]-self.highs[i-1]) for i in range(-p,0))
                tr_s = sum(true_range(self.highs[i],self.lows[i],c[i-1]) for i in range(-p,0))
                if tr_s > 0: r[f"vortex_pos_{p}"] = self._s(vm_p/tr_s); r[f"vortex_neg_{p}"] = self._s(vm_m/tr_s)
        for p in [14,20,30]:
            shift = p//2+1
            if len(c) >= p+shift:
                s = sma(c[:-shift], p)
                if s: r[f"dpo_{p}"] = self._s(c[-shift]-s)
        return r

    # ---- Momentum ----
    def compute_momentum(self):
        r = {}; c = self.closes; h,l,v = self.highs,self.lows,self.volumes
        for p in self.periods:
            rv = self._rsi(c,p)
            if rv is not None: r[f"rsi_{p}"] = self._s(rv)
        for p in [5,9,14,21]:
            stoch = self._stochastic(p)
            if stoch: r[f"stoch_k_{p}"] = self._s(stoch["k"]); r[f"stoch_d_{p}"] = self._s(stoch["d"])
        for p in [14,21]:
            sr = self._stoch_rsi(p)
            if sr is not None: r[f"stoch_rsi_{p}"] = self._s(sr)
        for p in [7,14,21,28]:
            if len(h) >= p:
                hh = max(h[-p:]); ll = min(l[-p:])
                r[f"williams_r_{p}"] = self._s((hh-c[-1])/(hh-ll)*-100 if hh!=ll else -50)
        for p in [7,14,20,50]:
            cci = self._cci(p)
            if cci is not None: r[f"cci_{p}"] = self._s(cci)
        for p in [5,10,14,20,50]:
            if len(c)>p and c[-p-1]!=0: r[f"roc_{p}"] = self._s((c[-1]-c[-p-1])/c[-p-1]*100)
        for p in [5,10,14,20]:
            if len(c)>p:
                r[f"momentum_{p}"] = self._s(c[-1]-c[-p-1])
                if c[-p-1]!=0: r[f"momentum_pct_{p}"] = self._s((c[-1]-c[-p-1])/c[-p-1]*100)
        for fast,slow,sig in [(12,26,9),(5,35,5),(8,17,9)]:
            m = self._macd(c,fast,slow,sig)
            if m: lb = f"{fast}_{slow}_{sig}"; r[f"macd_{lb}"] = self._s(m["macd"]); r[f"macd_signal_{lb}"] = self._s(m["signal"]); r[f"macd_hist_{lb}"] = self._s(m["hist"])
        for p in [12,15,18]:
            trix = self._trix(c,p)
            if trix is not None: r[f"trix_{p}"] = self._s(trix)
        kst = self._kst(c)
        if kst: r["kst"] = self._s(kst["kst"]); r["kst_signal"] = self._s(kst["signal"])
        uo = self._ultimate_osc()
        if uo is not None: r["ultimate_osc"] = self._s(uo)
        for p in [10,14]:
            rvi = self._rvi(p)
            if rvi is not None: r[f"rvi_{p}"] = self._s(rvi)
        return r

    # ---- Volatility ----
    def compute_volatility(self):
        r = {}; c = self.closes
        for p in [10,20,30,50]:
            for mult in [1.5,2.0,2.5,3.0]:
                mid = sma(c,p); sd = stdev(c,p)
                if mid and sd:
                    u,lo = mid+mult*sd, mid-mult*sd; lb = f"{p}_{mult}"
                    r[f"bb_upper_{lb}"] = self._s(u); r[f"bb_mid_{lb}"] = self._s(mid); r[f"bb_lower_{lb}"] = self._s(lo)
                    r[f"bb_width_{lb}"] = self._s((u-lo)/mid*100 if mid else 0)
                    r[f"bb_pctb_{lb}"] = self._s((c[-1]-lo)/(u-lo) if u!=lo else 0.5)
        for p in [10,20,30]:
            mid = ema(c,p); a = atr_val(self.highs,self.lows,c,p)
            if mid and a: r[f"keltner_upper_{p}"] = self._s(mid+1.5*a); r[f"keltner_mid_{p}"] = self._s(mid); r[f"keltner_lower_{p}"] = self._s(mid-1.5*a)
        for p in [10,20,30,50]:
            if len(self.highs)>=p:
                u = max(self.highs[-p:]); lo = min(self.lows[-p:])
                r[f"donchian_upper_{p}"] = self._s(u); r[f"donchian_lower_{p}"] = self._s(lo); r[f"donchian_mid_{p}"] = self._s((u+lo)/2)
        for p in self.periods:
            a = atr_val(self.highs,self.lows,c,p)
            if a: r[f"atr_{p}"] = self._s(a); r[f"natr_{p}"] = self._s(a/c[-1]*100) if c[-1] else None
        if len(c)>=2: r["true_range"] = self._s(true_range(self.highs[-1],self.lows[-1],c[-2]))
        for p in [10,20,30]:
            if len(c)>=p+1:
                rets = [math.log(c[i]/c[i-1]) for i in range(-p,0) if c[i-1]>0]
                if len(rets)>=p:
                    mr = sum(rets)/len(rets); var = sum((x-mr)**2 for x in rets)/(len(rets)-1)
                    r[f"hist_vol_{p}"] = self._s(math.sqrt(var)*math.sqrt(365)*100)
        return r

    # ---- Volume ----
    def compute_volume(self):
        r = {}; c,v = self.closes,self.volumes
        if not any(vol>0 for vol in v): return {"warning": "No volume data"}
        obv = 0.0; obv_list = [0.0]
        for i in range(1,len(c)):
            if c[i]>c[i-1]: obv+=v[i]
            elif c[i]<c[i-1]: obv-=v[i]
            obv_list.append(obv)
        r["obv"] = self._s(obv)
        for p in [10,20,50]:
            s = sma(obv_list,p)
            if s: r[f"obv_sma_{p}"] = self._s(s)
        tv = sum(v)
        if tv>0: r["vwap"] = self._s(sum((self.highs[i]+self.lows[i]+c[i])/3*v[i] for i in range(len(c)))/tv)
        for p in [7,14,20]:
            mfi = self._mfi(p)
            if mfi is not None: r[f"mfi_{p}"] = self._s(mfi)
        for p in [10,20,30]:
            cmf = self._cmf(p)
            if cmf is not None: r[f"cmf_{p}"] = self._s(cmf)
        ad = 0.0
        for i in range(len(c)):
            hl = self.highs[i]-self.lows[i]
            if hl!=0: ad += ((c[i]-self.lows[i])-(self.highs[i]-c[i]))/hl*v[i]
        r["ad_line"] = self._s(ad)
        ad_s = []; ad2 = 0.0
        for i in range(len(c)):
            hl = self.highs[i]-self.lows[i]
            if hl!=0: ad2+=((c[i]-self.lows[i])-(self.highs[i]-c[i]))/hl*v[i]
            ad_s.append(ad2)
        fe = ema(ad_s,3); se = ema(ad_s,10)
        if fe and se: r["chaikin_osc"] = self._s(fe-se)
        for p in [7,14,21]:
            if len(self.highs)>=p+1:
                eom = []
                for i in range(1,len(self.highs)):
                    dm = ((self.highs[i]+self.lows[i])/2)-((self.highs[i-1]+self.lows[i-1])/2)
                    br = v[i]/(self.highs[i]-self.lows[i]) if self.highs[i]!=self.lows[i] else 0
                    eom.append(dm/br if br else 0)
                s = sma(eom,p)
                if s: r[f"eom_{p}"] = self._s(s)
        for p in [2,13,21]:
            if len(c)>=2:
                fi = [(c[i]-c[i-1])*v[i] for i in range(1,len(c))]
                e = ema(fi,p) if len(fi)>=p else None
                if e: r[f"force_index_{p}"] = self._s(e)
        pvt = 0.0
        for i in range(1,len(c)):
            if c[i-1]!=0: pvt+=((c[i]-c[i-1])/c[i-1])*v[i]
        r["pvt"] = self._s(pvt)
        for p in [5,10,20,50]:
            vs = sma(v,p)
            if vs and vs>0: r[f"vol_sma_{p}"] = self._s(vs); r[f"vol_ratio_{p}"] = self._s(v[-1]/vs)
        if len(v)>=20:
            avg_v = sum(v[-20:])/20
            if avg_v>0: r["relative_volume"] = self._s(v[-1]/avg_v)
        return r

    # ---- Custom / Derived ----
    def compute_custom(self):
        r = {}; c,h,l,o = self.closes,self.highs,self.lows,self.opens
        if self.n>=2:
            hac = (o[-1]+h[-1]+l[-1]+c[-1])/4; hao = (o[-2]+c[-2])/2
            r["heikin_ashi"] = {"open":self._s(hao),"high":self._s(max(h[-1],hao,hac)),"low":self._s(min(l[-1],hao,hac)),"close":self._s(hac)}
        if self.n>=1:
            pp_h,pp_l,pp_c = h[-1],l[-1],c[-1]; pp = (pp_h+pp_l+pp_c)/3; diff = pp_h-pp_l
            r["pivot_classic"] = {"pp":self._s(pp),"r1":self._s(2*pp-pp_l),"r2":self._s(pp+diff),"r3":self._s(pp_h+2*(pp-pp_l)),"s1":self._s(2*pp-pp_h),"s2":self._s(pp-diff),"s3":self._s(pp_l-2*(pp_h-pp))}
            r["pivot_fibonacci"] = {"pp":self._s(pp),"r1":self._s(pp+.382*diff),"r2":self._s(pp+.618*diff),"r3":self._s(pp+diff),"s1":self._s(pp-.382*diff),"s2":self._s(pp-.618*diff),"s3":self._s(pp-diff)}
            wpp = (pp_h+pp_l+2*pp_c)/4
            r["pivot_woodie"] = {"pp":self._s(wpp),"r1":self._s(2*wpp-pp_l),"r2":self._s(wpp+diff),"s1":self._s(2*wpp-pp_h),"s2":self._s(wpp-diff)}
            r["pivot_camarilla"] = {"r1":self._s(pp_c+1.1/12*diff),"r2":self._s(pp_c+1.1/6*diff),"r3":self._s(pp_c+1.1/4*diff),"r4":self._s(pp_c+1.1/2*diff),"s1":self._s(pp_c-1.1/12*diff),"s2":self._s(pp_c-1.1/6*diff),"s3":self._s(pp_c-1.1/4*diff),"s4":self._s(pp_c-1.1/2*diff)}
        if self.n>=50:
            fh = max(h[-50:]); fl = min(l[-50:]); fd = fh-fl
            r["fib_retracement"] = {"high":self._s(fh),"low":self._s(fl),"0.236":self._s(fh-.236*fd),"0.382":self._s(fh-.382*fd),"0.5":self._s(fh-.5*fd),"0.618":self._s(fh-.618*fd),"0.786":self._s(fh-.786*fd)}
        for p in [13,26]:
            e = ema(c,p)
            if e: r[f"elder_ray_bull_{p}"] = self._s(h[-1]-e); r[f"elder_ray_bear_{p}"] = self._s(l[-1]-e)
        mi = self._mass_index(25)
        if mi: r["mass_index_25"] = self._s(mi)
        green = red = 0
        for i in range(self.n-1,-1,-1):
            if c[i]>=o[i]:
                if red>0: break
                green+=1
            else:
                if green>0: break
                red+=1
        r["consecutive_green"] = green; r["consecutive_red"] = red
        if self.n>=50: r["high_50"] = self._s(max(h[-50:])); r["low_50"] = self._s(min(l[-50:]))
        if self.n>=200: r["high_200"] = self._s(max(h[-200:])); r["low_200"] = self._s(min(l[-200:]))
        return r

    # ============================================================
    # NEW: Candlestick Pattern Recognition (30+ patterns)
    # ============================================================
    def compute_patterns(self):
        r = {"detected": [], "summary": {"bullish": 0, "bearish": 0, "neutral": 0}}
        o, h, l, c, v = self.opens, self.highs, self.lows, self.closes, self.volumes
        n = self.n
        if n < 5: return r

        def body(i): return abs(c[i] - o[i])
        def upper_shadow(i): return h[i] - max(o[i], c[i])
        def lower_shadow(i): return min(o[i], c[i]) - l[i]
        def is_bull(i): return c[i] > o[i]
        def is_bear(i): return c[i] < o[i]
        def candle_range(i): return h[i] - l[i] if h[i] != l[i] else 0.0001
        def avg_body(lookback=10):
            start = max(0, n - lookback - 1)
            bodies = [body(i) for i in range(start, n - 1)]
            return sum(bodies) / len(bodies) if bodies else 0.0001
        def avg_range(lookback=10):
            start = max(0, n - lookback - 1)
            ranges = [candle_range(i) for i in range(start, n - 1)]
            return sum(ranges) / len(ranges) if ranges else 0.0001

        ab = avg_body(); ar = avg_range()
        i = n - 1  # current candle

        def add(name, direction, reliability, desc=""):
            r["detected"].append({"name": name, "direction": direction, "reliability": reliability, "description": desc})
            r["summary"][direction] += 1

        # --- Single candle patterns ---
        # Doji
        if body(i) <= ar * 0.1:
            if lower_shadow(i) > body(i) * 2 and upper_shadow(i) > body(i) * 2:
                add("long_legged_doji", "neutral", "medium", "Long-Legged Doji: indecision")
            elif lower_shadow(i) > body(i) * 3 and upper_shadow(i) < body(i):
                add("dragonfly_doji", "bullish", "high", "Dragonfly Doji: bullish reversal signal")
            elif upper_shadow(i) > body(i) * 3 and lower_shadow(i) < body(i):
                add("gravestone_doji", "bearish", "high", "Gravestone Doji: bearish reversal signal")
            else:
                add("doji", "neutral", "low", "Doji: indecision candle")

        # Hammer / Hanging Man
        if lower_shadow(i) >= body(i) * 2 and upper_shadow(i) <= body(i) * 0.5 and body(i) > ar * 0.2:
            if i >= 5 and c[i] < min(c[i-3:i]):
                add("hammer", "bullish", "high", "Hammer: bullish reversal at bottom")
            elif i >= 5 and c[i] > max(c[i-3:i]):
                add("hanging_man", "bearish", "medium", "Hanging Man: bearish reversal at top")

        # Inverted Hammer / Shooting Star
        if upper_shadow(i) >= body(i) * 2 and lower_shadow(i) <= body(i) * 0.5 and body(i) > ar * 0.2:
            if i >= 5 and c[i] < min(c[i-3:i]):
                add("inverted_hammer", "bullish", "medium", "Inverted Hammer: potential bullish reversal")
            elif i >= 5 and c[i] > max(c[i-3:i]):
                add("shooting_star", "bearish", "high", "Shooting Star: bearish reversal at top")

        # Marubozu (full body, minimal shadows)
        if body(i) > ab * 1.5 and upper_shadow(i) < body(i) * 0.1 and lower_shadow(i) < body(i) * 0.1:
            if is_bull(i): add("bullish_marubozu", "bullish", "high", "Bullish Marubozu: strong buying pressure")
            else: add("bearish_marubozu", "bearish", "high", "Bearish Marubozu: strong selling pressure")

        # Spinning Top
        if body(i) < ab * 0.5 and upper_shadow(i) > body(i) and lower_shadow(i) > body(i) and body(i) > ar * 0.05:
            add("spinning_top", "neutral", "low", "Spinning Top: indecision")

        # Belt Hold
        if body(i) > ab * 1.2:
            if is_bull(i) and lower_shadow(i) < body(i) * 0.05:
                add("bullish_belt_hold", "bullish", "medium", "Bullish Belt Hold: opening at low, strong close")
            elif is_bear(i) and upper_shadow(i) < body(i) * 0.05:
                add("bearish_belt_hold", "bearish", "medium", "Bearish Belt Hold: opening at high, strong sell")

        # --- Two candle patterns ---
        if n >= 2:
            j = i - 1  # previous candle

            # Bullish Engulfing
            if is_bear(j) and is_bull(i) and o[i] <= c[j] and c[i] >= o[j] and body(i) > body(j):
                add("bullish_engulfing", "bullish", "high", "Bullish Engulfing: strong reversal signal")

            # Bearish Engulfing
            if is_bull(j) and is_bear(i) and o[i] >= c[j] and c[i] <= o[j] and body(i) > body(j):
                add("bearish_engulfing", "bearish", "high", "Bearish Engulfing: strong reversal signal")

            # Bullish Harami
            if is_bear(j) and is_bull(i) and body(j) > ab * 1.0 and o[i] > c[j] and c[i] < o[j] and body(i) < body(j) * 0.5:
                add("bullish_harami", "bullish", "medium", "Bullish Harami: potential reversal")

            # Bearish Harami
            if is_bull(j) and is_bear(i) and body(j) > ab * 1.0 and o[i] < c[j] and c[i] > o[j] and body(i) < body(j) * 0.5:
                add("bearish_harami", "bearish", "medium", "Bearish Harami: potential reversal")

            # Piercing Line
            if is_bear(j) and is_bull(i) and o[i] < l[j] and c[i] > (o[j] + c[j]) / 2 and c[i] < o[j]:
                add("piercing_line", "bullish", "high", "Piercing Line: bullish reversal")

            # Dark Cloud Cover
            if is_bull(j) and is_bear(i) and o[i] > h[j] and c[i] < (o[j] + c[j]) / 2 and c[i] > o[j]:
                add("dark_cloud_cover", "bearish", "high", "Dark Cloud Cover: bearish reversal")

            # Tweezer Bottom
            if abs(l[j] - l[i]) < ar * 0.05 and is_bear(j) and is_bull(i):
                add("tweezer_bottom", "bullish", "medium", "Tweezer Bottom: support confirmation")

            # Tweezer Top
            if abs(h[j] - h[i]) < ar * 0.05 and is_bull(j) and is_bear(i):
                add("tweezer_top", "bearish", "medium", "Tweezer Top: resistance confirmation")

        # --- Three candle patterns ---
        if n >= 3:
            k = i - 2  # two candles ago

            # Morning Star
            if is_bear(k) and body(k) > ab and body(i-1) < ab * 0.3 and is_bull(i) and body(i) > ab * 0.5 and c[i] > (o[k] + c[k]) / 2:
                add("morning_star", "bullish", "high", "Morning Star: strong bullish reversal (3-candle)")

            # Evening Star
            if is_bull(k) and body(k) > ab and body(i-1) < ab * 0.3 and is_bear(i) and body(i) > ab * 0.5 and c[i] < (o[k] + c[k]) / 2:
                add("evening_star", "bearish", "high", "Evening Star: strong bearish reversal (3-candle)")

            # Three White Soldiers
            if all(is_bull(x) for x in [k, i-1, i]) and c[i-1] > c[k] and c[i] > c[i-1] and all(body(x) > ab * 0.5 for x in [k, i-1, i]):
                if upper_shadow(k) < body(k) * 0.3 and upper_shadow(i-1) < body(i-1) * 0.3 and upper_shadow(i) < body(i) * 0.3:
                    add("three_white_soldiers", "bullish", "high", "Three White Soldiers: strong bullish continuation")

            # Three Black Crows
            if all(is_bear(x) for x in [k, i-1, i]) and c[i-1] < c[k] and c[i] < c[i-1] and all(body(x) > ab * 0.5 for x in [k, i-1, i]):
                if lower_shadow(k) < body(k) * 0.3 and lower_shadow(i-1) < body(i-1) * 0.3 and lower_shadow(i) < body(i) * 0.3:
                    add("three_black_crows", "bearish", "high", "Three Black Crows: strong bearish continuation")

            # Three Inside Up (Bullish Harami + confirmation)
            if is_bear(k) and is_bull(i-1) and body(i-1) < body(k) * 0.5 and o[i-1] > c[k] and c[i-1] < o[k] and is_bull(i) and c[i] > o[k]:
                add("three_inside_up", "bullish", "high", "Three Inside Up: confirmed bullish reversal")

            # Three Inside Down
            if is_bull(k) and is_bear(i-1) and body(i-1) < body(k) * 0.5 and o[i-1] < c[k] and c[i-1] > o[k] and is_bear(i) and c[i] < o[k]:
                add("three_inside_down", "bearish", "high", "Three Inside Down: confirmed bearish reversal")

        # Pattern score
        bull_score = sum(2 if p["reliability"] == "high" else 1 for p in r["detected"] if p["direction"] == "bullish")
        bear_score = sum(2 if p["reliability"] == "high" else 1 for p in r["detected"] if p["direction"] == "bearish")
        r["pattern_score"] = {"bullish": bull_score, "bearish": bear_score, "net": bull_score - bear_score}
        return r

    # ============================================================
    # NEW: Divergence Detection (RSI, MACD, OBV)
    # ============================================================
    def compute_divergence(self):
        r = {"detected": [], "summary": "no_divergence"}
        c, h, l = self.closes, self.highs, self.lows
        if self.n < 30: return r

        def find_swing_highs(data, window=5):
            swings = []
            for i in range(window, len(data) - window):
                if data[i] == max(data[i-window:i+window+1]):
                    swings.append((i, data[i]))
            return swings

        def find_swing_lows(data, window=5):
            swings = []
            for i in range(window, len(data) - window):
                if data[i] == min(data[i-window:i+window+1]):
                    swings.append((i, data[i]))
            return swings

        def check_divergence(price_data, indicator_data, name):
            divs = []
            price_highs = find_swing_highs(price_data)
            price_lows = find_swing_lows(price_data)
            ind_highs = find_swing_highs(indicator_data)
            ind_lows = find_swing_lows(indicator_data)

            # Bearish divergence: price makes higher high, indicator makes lower high
            if len(price_highs) >= 2 and len(ind_highs) >= 2:
                ph1, ph2 = price_highs[-2], price_highs[-1]
                # Find closest indicator highs
                ih_candidates = [(abs(ih[0] - ph2[0]), ih) for ih in ind_highs if abs(ih[0] - ph2[0]) <= 8]
                ih_prev_candidates = [(abs(ih[0] - ph1[0]), ih) for ih in ind_highs if abs(ih[0] - ph1[0]) <= 8]
                if ih_candidates and ih_prev_candidates:
                    ih2 = min(ih_candidates)[1]
                    ih1 = min(ih_prev_candidates)[1]
                    if ph2[1] > ph1[1] and ih2[1] < ih1[1]:
                        strength = abs(ih1[1] - ih2[1]) / max(abs(ih1[1]), 0.001)
                        divs.append({"type": "bearish_divergence", "indicator": name,
                            "description": f"Price higher high but {name} lower high",
                            "strength": self._s(min(strength * 100, 100)), "bars_ago": self.n - 1 - ph2[0]})

            # Bullish divergence: price makes lower low, indicator makes higher low
            if len(price_lows) >= 2 and len(ind_lows) >= 2:
                pl1, pl2 = price_lows[-2], price_lows[-1]
                il_candidates = [(abs(il[0] - pl2[0]), il) for il in ind_lows if abs(il[0] - pl2[0]) <= 8]
                il_prev_candidates = [(abs(il[0] - pl1[0]), il) for il in ind_lows if abs(il[0] - pl1[0]) <= 8]
                if il_candidates and il_prev_candidates:
                    il2 = min(il_candidates)[1]
                    il1 = min(il_prev_candidates)[1]
                    if pl2[1] < pl1[1] and il2[1] > il1[1]:
                        strength = abs(il2[1] - il1[1]) / max(abs(il1[1]), 0.001)
                        divs.append({"type": "bullish_divergence", "indicator": name,
                            "description": f"Price lower low but {name} higher low",
                            "strength": self._s(min(strength * 100, 100)), "bars_ago": self.n - 1 - pl2[0]})

            # Hidden bullish: price higher low, indicator lower low (trend continuation)
            if len(price_lows) >= 2 and len(ind_lows) >= 2:
                pl1, pl2 = price_lows[-2], price_lows[-1]
                il_candidates = [(abs(il[0] - pl2[0]), il) for il in ind_lows if abs(il[0] - pl2[0]) <= 8]
                il_prev_candidates = [(abs(il[0] - pl1[0]), il) for il in ind_lows if abs(il[0] - pl1[0]) <= 8]
                if il_candidates and il_prev_candidates:
                    il2 = min(il_candidates)[1]
                    il1 = min(il_prev_candidates)[1]
                    if pl2[1] > pl1[1] and il2[1] < il1[1]:
                        divs.append({"type": "hidden_bullish_divergence", "indicator": name,
                            "description": f"Price higher low but {name} lower low (trend continuation)",
                            "strength": "medium", "bars_ago": self.n - 1 - pl2[0]})

            # Hidden bearish: price lower high, indicator higher high (trend continuation)
            if len(price_highs) >= 2 and len(ind_highs) >= 2:
                ph1, ph2 = price_highs[-2], price_highs[-1]
                ih_candidates = [(abs(ih[0] - ph2[0]), ih) for ih in ind_highs if abs(ih[0] - ph2[0]) <= 8]
                ih_prev_candidates = [(abs(ih[0] - ph1[0]), ih) for ih in ind_highs if abs(ih[0] - ph1[0]) <= 8]
                if ih_candidates and ih_prev_candidates:
                    ih2 = min(ih_candidates)[1]
                    ih1 = min(ih_prev_candidates)[1]
                    if ph2[1] < ph1[1] and ih2[1] > ih1[1]:
                        divs.append({"type": "hidden_bearish_divergence", "indicator": name,
                            "description": f"Price lower high but {name} higher high (trend continuation)",
                            "strength": "medium", "bars_ago": self.n - 1 - ph2[0]})
            return divs

        # RSI divergence
        rsi_vals = []
        for i in range(15, len(c) + 1):
            rv = self._rsi(c[:i], 14)
            rsi_vals.append(rv if rv is not None else 50)
        if len(rsi_vals) >= 30:
            r["detected"].extend(check_divergence(c[-len(rsi_vals):], rsi_vals, "RSI14"))

        # MACD divergence
        fast_s = ema_series(c, 12); slow_s = ema_series(c, 26)
        macd_vals = []
        for f, s in zip(fast_s, slow_s):
            if f is not None and s is not None: macd_vals.append(f - s)
        if len(macd_vals) >= 30:
            r["detected"].extend(check_divergence(c[-len(macd_vals):], macd_vals, "MACD"))

        # OBV divergence
        obv_vals = [0.0]
        for i in range(1, len(c)):
            if c[i] > c[i-1]: obv_vals.append(obv_vals[-1] + self.volumes[i])
            elif c[i] < c[i-1]: obv_vals.append(obv_vals[-1] - self.volumes[i])
            else: obv_vals.append(obv_vals[-1])
        if len(obv_vals) >= 30:
            r["detected"].extend(check_divergence(c, obv_vals, "OBV"))

        # Summary
        bull_divs = [d for d in r["detected"] if "bullish" in d["type"]]
        bear_divs = [d for d in r["detected"] if "bearish" in d["type"]]
        if bull_divs and not bear_divs: r["summary"] = "bullish_divergence"
        elif bear_divs and not bull_divs: r["summary"] = "bearish_divergence"
        elif bull_divs and bear_divs: r["summary"] = "mixed_divergence"
        r["divergence_score"] = {"bullish": len(bull_divs), "bearish": len(bear_divs)}
        return r

    # ============================================================
    # NEW: Support/Resistance & Market Structure
    # ============================================================
    def compute_structure(self):
        r = {}; c, h, l = self.closes, self.highs, self.lows
        if self.n < 20: return r

        # --- Swing Highs/Lows detection ---
        swing_highs = []; swing_lows = []
        window = 5
        for i in range(window, self.n - window):
            if h[i] == max(h[i-window:i+window+1]): swing_highs.append({"index": i, "price": self._s(h[i])})
            if l[i] == min(l[i-window:i+window+1]): swing_lows.append({"index": i, "price": self._s(l[i])})
        r["swing_highs"] = swing_highs[-5:] if swing_highs else []
        r["swing_lows"] = swing_lows[-5:] if swing_lows else []

        # --- Market Structure (HH, HL, LH, LL) ---
        structure = []
        if len(swing_highs) >= 2:
            sh = swing_highs
            for i in range(1, len(sh)):
                if sh[i]["price"] > sh[i-1]["price"]: structure.append("HH")
                else: structure.append("LH")
        if len(swing_lows) >= 2:
            sl = swing_lows
            for i in range(1, len(sl)):
                if sl[i]["price"] > sl[i-1]["price"]: structure.append("HL")
                else: structure.append("LL")

        recent = structure[-6:] if structure else []
        r["market_structure"] = {"recent_swings": recent}
        hh_hl = sum(1 for s in recent if s in ["HH", "HL"])
        lh_ll = sum(1 for s in recent if s in ["LH", "LL"])
        if hh_hl > lh_ll + 1: r["market_structure"]["trend"] = "uptrend"
        elif lh_ll > hh_hl + 1: r["market_structure"]["trend"] = "downtrend"
        else: r["market_structure"]["trend"] = "ranging"

        # --- Support/Resistance Levels ---
        levels = []
        # From swing points
        for sh in swing_highs[-10:]:
            levels.append({"price": sh["price"], "type": "resistance", "source": "swing_high", "strength": 1})
        for sl in swing_lows[-10:]:
            levels.append({"price": sl["price"], "type": "support", "source": "swing_low", "strength": 1})

        # Cluster nearby levels (within 0.5% of each other)
        clustered = []
        used = set()
        for i, lv in enumerate(levels):
            if i in used: continue
            cluster = [lv]
            for j, lv2 in enumerate(levels):
                if j <= i or j in used: continue
                if lv["price"] and lv2["price"] and abs(lv["price"] - lv2["price"]) / lv["price"] < 0.005:
                    cluster.append(lv2); used.add(j)
            used.add(i)
            avg_price = self._s(sum(x["price"] for x in cluster) / len(cluster))
            strength = len(cluster)
            ctype = "resistance" if sum(1 for x in cluster if x["type"] == "resistance") > len(cluster) / 2 else "support"
            clustered.append({"price": avg_price, "type": ctype, "strength": strength, "touches": len(cluster)})

        # Sort by proximity to current price
        cur = c[-1]
        clustered.sort(key=lambda x: abs(x["price"] - cur) if x["price"] else float('inf'))
        r["support_resistance"] = clustered[:10]

        # Nearest support and resistance
        supports = [x for x in clustered if x["type"] == "support" and x["price"] < cur]
        resistances = [x for x in clustered if x["type"] == "resistance" and x["price"] > cur]
        supports.sort(key=lambda x: cur - x["price"])
        resistances.sort(key=lambda x: x["price"] - cur)
        r["nearest_support"] = supports[0] if supports else None
        r["nearest_resistance"] = resistances[0] if resistances else None

        # --- Trendline approximation ---
        if len(swing_lows) >= 2:
            sl = swing_lows[-2:]
            if sl[1]["index"] > sl[0]["index"]:
                slope = (sl[1]["price"] - sl[0]["price"]) / (sl[1]["index"] - sl[0]["index"])
                projected = sl[1]["price"] + slope * (self.n - 1 - sl[1]["index"])
                r["ascending_trendline"] = {"slope_per_bar": self._s(slope), "current_value": self._s(projected),
                    "price_above": c[-1] > projected if projected else None}

        if len(swing_highs) >= 2:
            sh = swing_highs[-2:]
            if sh[1]["index"] > sh[0]["index"]:
                slope = (sh[1]["price"] - sh[0]["price"]) / (sh[1]["index"] - sh[0]["index"])
                projected = sh[1]["price"] + slope * (self.n - 1 - sh[1]["index"])
                r["descending_trendline"] = {"slope_per_bar": self._s(slope), "current_value": self._s(projected),
                    "price_below": c[-1] < projected if projected else None}

        # --- Price position analysis ---
        if self.n >= 50:
            h50 = max(h[-50:]); l50 = min(l[-50:])
            r["price_position"] = {"pct_from_50_high": self._s((c[-1] - h50) / h50 * 100),
                "pct_from_50_low": self._s((c[-1] - l50) / l50 * 100),
                "range_position": self._s((c[-1] - l50) / (h50 - l50) * 100) if h50 != l50 else 50}

        return r

    # ============================================================
    # NEW: Advanced Volatility Models
    # ============================================================
    def compute_advanced_volatility(self):
        r = {}; o, h, l, c = self.opens, self.highs, self.lows, self.closes
        n = self.n

        for p in [10, 20, 30]:
            if n < p + 1: continue

            # Parkinson volatility (uses high-low range)
            pk_sum = sum(math.log(h[i] / l[i]) ** 2 for i in range(-p, 0) if l[i] > 0 and h[i] > 0)
            parkinson = math.sqrt(pk_sum / (4 * p * math.log(2))) * math.sqrt(365) * 100
            r[f"parkinson_vol_{p}"] = self._s(parkinson)

            # Garman-Klass volatility (uses OHLC)
            gk_sum = 0
            for i in range(-p, 0):
                if l[i] > 0 and o[i] > 0 and h[i] > 0:
                    gk_sum += 0.5 * math.log(h[i] / l[i]) ** 2 - (2 * math.log(2) - 1) * math.log(c[i] / o[i]) ** 2
            garman_klass = math.sqrt(gk_sum / p) * math.sqrt(365) * 100
            r[f"garman_klass_vol_{p}"] = self._s(garman_klass)

            # Yang-Zhang volatility (most efficient estimator)
            log_oc = [math.log(o[i] / c[i-1]) for i in range(-p+1, 0) if c[i-1] > 0 and o[i] > 0]
            log_co = [math.log(c[i] / o[i]) for i in range(-p, 0) if o[i] > 0 and c[i] > 0]
            log_rs = []
            for i in range(-p, 0):
                if o[i] > 0 and h[i] > 0 and l[i] > 0 and c[i] > 0:
                    log_rs.append(math.log(h[i]/o[i]) * math.log(h[i]/c[i]) + math.log(l[i]/o[i]) * math.log(l[i]/c[i]))
            if log_oc and log_co and log_rs:
                n_oc = len(log_oc); n_co = len(log_co)
                var_o = sum((x - sum(log_oc)/n_oc)**2 for x in log_oc) / (n_oc - 1) if n_oc > 1 else 0
                var_c = sum((x - sum(log_co)/n_co)**2 for x in log_co) / (n_co - 1) if n_co > 1 else 0
                var_rs = sum(log_rs) / len(log_rs) if log_rs else 0
                k = 0.34 / (1.34 + (p + 1) / (p - 1))
                yz_var = var_o + k * var_c + (1 - k) * var_rs
                yang_zhang = math.sqrt(max(yz_var, 0)) * math.sqrt(365) * 100
                r[f"yang_zhang_vol_{p}"] = self._s(yang_zhang)

            # Close-to-close (standard) for comparison
            rets = [math.log(c[i]/c[i-1]) for i in range(-p, 0) if c[i-1] > 0]
            if len(rets) >= p:
                mr = sum(rets)/len(rets)
                cc_var = sum((x - mr)**2 for x in rets) / (len(rets) - 1)
                r[f"close_to_close_vol_{p}"] = self._s(math.sqrt(cc_var) * math.sqrt(365) * 100)

        # Volatility Cone (percentile of current vol vs historical)
        if n >= 60:
            windows = [10, 20, 30]
            for w in windows:
                all_vols = []
                for start in range(0, n - w):
                    rets = [math.log(c[start+i+1]/c[start+i]) for i in range(w) if c[start+i] > 0]
                    if len(rets) >= w:
                        mr = sum(rets)/len(rets)
                        v = math.sqrt(sum((x-mr)**2 for x in rets)/(len(rets)-1)) * math.sqrt(365) * 100
                        all_vols.append(v)
                if all_vols:
                    current_vol = all_vols[-1] if all_vols else 0
                    sorted_v = sorted(all_vols)
                    pct = sum(1 for v in sorted_v if v <= current_vol) / len(sorted_v) * 100
                    r[f"vol_percentile_{w}"] = self._s(pct)
                    r[f"vol_cone_{w}"] = {"current": self._s(current_vol), "min": self._s(sorted_v[0]),
                        "p25": self._s(sorted_v[len(sorted_v)//4]), "median": self._s(sorted_v[len(sorted_v)//2]),
                        "p75": self._s(sorted_v[3*len(sorted_v)//4]), "max": self._s(sorted_v[-1]),
                        "percentile": self._s(pct)}

        # Volatility regime
        if f"close_to_close_vol_10" in r and f"close_to_close_vol_30" in r:
            short_vol = r["close_to_close_vol_10"]; long_vol = r["close_to_close_vol_30"]
            if short_vol and long_vol and long_vol > 0:
                ratio = short_vol / long_vol
                if ratio > 1.3: regime = "expanding"
                elif ratio < 0.7: regime = "contracting"
                else: regime = "stable"
                r["volatility_regime"] = {"short_long_ratio": self._s(ratio), "regime": regime}

        return r

    # ============================================================
    # WorldQuant Alpha 101 Factors
    # Time-series factors: single-asset OHLCV only
    # Cross-sectional factors: marked _CS_, need multi-asset scan
    # ============================================================
    def compute_alpha101(self):
        """WorldQuant 101 Alphas — time-series subset (~40 factors)."""
        r = {"_type": "time_series", "_skipped_cs": "Cross-sectional factors (Alpha#1,#5,#10,#11,#13,#21,#22,#27,#30,#31,#36,#37,#39,#40,#47,#48,#55-#95,#97,#99,#100) require scan mode with multi-asset data."}
        o, h, l, c, v = self.opens, self.highs, self.lows, self.closes, self.volumes
        n = self.n
        if n < 30: return r
        ret = returns_series(c)
        vw = vwap_full(h, l, c, v)
        adv5 = adv_series(v, 5)
        adv10 = adv_series(v, 10)
        adv20 = adv_series(v, 20)
        log_v = [log_safe(x) for x in v]

        # Alpha#2: -1 * delta(log(volume), 2) * correlation(close, volume, 6)
        if n >= 6:
            d = delta_s(log_v, 2); cr = ts_corr(c, v, 6)
            if d is not None and cr is not None: r["a101_002"] = self._s(-1*d*cr)

        # Alpha#3: -1 * correlation(rank(open), rank(volume), 10) — use ts_rank as proxy
        if n >= 20:
            o_rk = ts_rank_series(o, 10); v_rk = ts_rank_series(v, 10)
            o_clean = [x for x in o_rk if x is not None]; v_clean = [x for x in v_rk if x is not None]
            if len(o_clean) >= 10 and len(v_clean) >= 10:
                r["a101_003"] = self._s(-1*ts_corr(o_clean, v_clean, 10))

        # Alpha#4: -1 * ts_rank(rank(low), 9)
        if n >= 18:
            l_rk = ts_rank_series(l, 9)
            l_clean = [x for x in l_rk if x is not None]
            if len(l_clean) >= 9: r["a101_004"] = self._s(-1*ts_rank(l_clean, 9))

        # Alpha#6: -1 * correlation(open, volume, 10)
        if n >= 10:
            cr = ts_corr(o, v, 10)
            if cr is not None: r["a101_006"] = self._s(-1*cr)

        # Alpha#7: if adv20 < volume then (-1*ts_rank(|delta(close,7)|,60)*sign(delta(close,7))) else -1
        if n >= 60:
            if adv20[-1] < v[-1]:
                dc7 = delta_s(c, 7)
                if dc7 is not None:
                    abs_dc = [abs(c[i]-c[i-7]) for i in range(7, n)]
                    if len(abs_dc) >= 60:
                        r["a101_007"] = self._s(-1*ts_rank(abs_dc, 60)*math.copysign(1, dc7))
            else: r["a101_007"] = -1.0

        # Alpha#8: -1 * rank(sum(returns, 5) * open_5ago - delay(close - open, 10))
        if n >= 15:
            ret_sum5 = ts_sum(ret, 5)
            d_co = (c[-11]-o[-11]) if n > 11 else 0
            if ret_sum5 is not None:
                val = ret_sum5 * o[-6] - d_co if n > 6 else ret_sum5
                r["a101_008"] = self._s(-1*val)

        # Alpha#9: conditional delta
        if n >= 6:
            deltas = [c[i]-c[i-1] for i in range(1, n)]
            if len(deltas) >= 5:
                mn = min(deltas[-5:]); mx = max(deltas[-5:])
                d1 = deltas[-1]
                if mn > 0: r["a101_009"] = self._s(d1)
                elif mx < 0: r["a101_009"] = self._s(d1)
                else: r["a101_009"] = self._s(-1*d1)

        # Alpha#12: sign(delta(volume,1)) * (-1 * delta(close,1))
        if n >= 2:
            dv = v[-1]-v[-2]; dc = c[-1]-c[-2]
            r["a101_012"] = self._s(math.copysign(1, dv)*(-1*dc))

        # Alpha#14: -1 * rank(delta(returns,3)) * correlation(open, volume, 10)
        if n >= 14:
            dr3 = delta_s(ret, 3); cr = ts_corr(o, v, 10)
            if dr3 is not None and cr is not None:
                r["a101_014"] = self._s(-1*dr3*cr)

        # Alpha#15: -1 * sum(rank(correlation(rank(high), rank(volume), 3)), 3)
        if n >= 15:
            h_rk = ts_rank_series(h, 5); v_rk = ts_rank_series(v, 5)
            corr_s = ts_corr_series([x or 0 for x in h_rk], [x or 0 for x in v_rk], 3)
            valid = [x for x in corr_s if x is not None]
            if len(valid) >= 3: r["a101_015"] = self._s(-1*sum(valid[-3:]))

        # Alpha#16: -1 * rank(covariance(rank(high), rank(volume), 5))
        if n >= 15:
            h_rk = ts_rank_series(h, 5); v_rk = ts_rank_series(v, 5)
            h_clean = [x or 0 for x in h_rk]; v_clean = [x or 0 for x in v_rk]
            cv = ts_cov(h_clean, v_clean, 5)
            if cv is not None: r["a101_016"] = self._s(-1*cv)

        # Alpha#17: ts_rank(close,10) * ts_rank(delta(delta(close,1),1),1) * ts_rank(volume/adv20,5)
        if n >= 20:
            trc = ts_rank(c, 10)
            dd = [c[i]-2*c[i-1]+c[i-2] for i in range(2, n)]
            trv = ts_rank([v[i]/adv20[i] if adv20[i] > 0 else 1 for i in range(n)], 5)
            if trc and dd and trv: r["a101_017"] = self._s(trc*(dd[-1] if dd else 0)*trv)

        # Alpha#18: -1 * (stddev(|close-open|,5) + (close-open) + corr(close,open,10))
        if n >= 10:
            co = [abs(c[i]-o[i]) for i in range(n)]
            sd = stdev(co, 5); cr = ts_corr(c, o, 10)
            if sd is not None and cr is not None:
                r["a101_018"] = self._s(-1*(sd + (c[-1]-o[-1]) + cr))

        # Alpha#19: -sign(close-delay(close,7)+delta(close,7)) * (1+ts_rank(1+sum(returns,250),250))
        if n >= 250:
            dc7 = delta_s(c, 7); sgn = math.copysign(1, (c[-1]-c[-8]) + dc7) if dc7 else 0
            rs = ts_sum(ret, 250)
            if rs is not None:
                plus_rs = [1+sum(ret[max(0,i-249):i+1]) for i in range(n)]
                trk = ts_rank(plus_rs, min(250, len(plus_rs)))
                if trk: r["a101_019"] = self._s(-sgn*(1+trk))

        # Alpha#20: (open-delay(high,1)) * (open-delay(close,1)) * (open-delay(low,1))
        if n >= 2:
            r["a101_020"] = self._s((o[-1]-h[-2])*(o[-1]-c[-2])*(o[-1]-l[-2]))

        # Alpha#23: if sma(high,20) < high then -delta(high,2) else 0
        if n >= 22:
            sm = sma(h, 20)
            if sm is not None:
                if sm < h[-1]:
                    dh = delta_s(h, 2)
                    r["a101_023"] = self._s(-1*dh) if dh is not None else 0
                else: r["a101_023"] = 0.0

        # Alpha#24: conditional on sma(close,100) trend
        if n >= 100:
            sm100 = sma(c, 100); sm100_prev = sma(c[:-100], 100) if n > 200 else sm100
            if sm100 and sm100_prev:
                chg = (sm100 - sm100_prev) / (c[-101] if n > 100 and c[-101] != 0 else 1)
                if chg <= 0.05:
                    r["a101_024"] = self._s(-1*(c[-1] - ts_min(c, 100)))
                else:
                    dc3 = delta_s(c, 3)
                    r["a101_024"] = self._s(-1*dc3) if dc3 is not None else None

        # Alpha#25: rank(-returns * adv20 * vwap * (high - close))
        if n >= 20:
            val = -ret[-1] * adv20[-1] * vw[-1] * (h[-1] - c[-1])
            r["a101_025"] = self._s(val)

        # Alpha#26: -ts_max(corr(ts_rank(vol,5), ts_rank(high,5), 5), 3)
        if n >= 15:
            vr = ts_rank_series(v, 5); hr = ts_rank_series(h, 5)
            cs = ts_corr_series([x or 0 for x in vr], [x or 0 for x in hr], 5)
            valid = [x for x in cs if x is not None]
            if len(valid) >= 3: r["a101_026"] = self._s(-1*max(valid[-3:]))

        # Alpha#28: scale(corr(adv20, low, 5) + (high+low)/2 - close)
        if n >= 25:
            cr = ts_corr(adv20, l, 5)
            if cr is not None:
                r["a101_028"] = self._s(cr + (h[-1]+l[-1])/2 - c[-1])

        # Alpha#29: log(ts_product(rank(rank(scale(log(sum(ts_min(rank(x),2),1))))), 1), 5) simplified
        # min(rank(rank(scale(...))),5) + ts_rank(delay(-returns,6),5)
        if n >= 12:
            dr6 = [-ret[i-6] for i in range(7, n)]
            if len(dr6) >= 5: r["a101_029"] = self._s(ts_rank(dr6, 5))

        # Alpha#32: scale(sma(close,7)-close) + 20*scale(corr(vwap, delay(close,5), 230))
        if n >= 230:
            sm7 = sma(c, 7)
            dc5 = c[:-5] if n > 5 else c
            cr = ts_corr(vw[-230:], dc5[-230:], min(230, len(dc5)))
            if sm7 is not None and cr is not None:
                r["a101_032"] = self._s((sm7-c[-1])/abs(sm7) + 20*cr)

        # Alpha#33: rank(-(1 - open/close))
        if n >= 1 and c[-1] != 0:
            r["a101_033"] = self._s(-(1 - o[-1]/c[-1]))

        # Alpha#34: rank(1-rank(stddev(ret,2)/stddev(ret,5)) + 1-rank(delta(close,1)))
        if n >= 10:
            sd2 = stdev(ret, 2); sd5 = stdev(ret, 5)
            dc1 = delta_s(c, 1)
            if sd2 is not None and sd5 is not None and sd5 != 0 and dc1 is not None:
                r["a101_034"] = self._s((1 - sd2/sd5) + (1 - dc1/c[-1] if c[-1] else 0))

        # Alpha#35: ts_rank(volume,32) * (1-ts_rank(close+high-low,16)) * (1-ts_rank(returns,32))
        if n >= 32:
            trv = ts_rank(v, 32)
            chl = [c[i]+h[i]-l[i] for i in range(n)]
            trchl = ts_rank(chl, 16)
            trr = ts_rank(ret, 32)
            if trv and trchl and trr: r["a101_035"] = self._s(trv*(1-trchl)*(1-trr))

        # Alpha#38: -ts_rank(close,10) * rank(close/open)
        if n >= 10:
            trc = ts_rank(c, 10)
            if trc and o[-1] != 0: r["a101_038"] = self._s(-trc*(c[-1]/o[-1]))

        # Alpha#41: sqrt(high*low) - vwap
        r["a101_041"] = self._s(math.sqrt(h[-1]*l[-1]) - vw[-1]) if h[-1]*l[-1] >= 0 else None

        # Alpha#42: rank(vwap-close) / rank(vwap+close)
        if vw[-1]+c[-1] != 0:
            r["a101_042"] = self._s((vw[-1]-c[-1]) / (vw[-1]+c[-1]))

        # Alpha#43: ts_rank(vol/adv20, 20) * ts_rank(-delta(close,7), 8)
        if n >= 27:
            vr = [v[i]/adv20[i] if adv20[i] > 0 else 1 for i in range(n)]
            trv = ts_rank(vr, 20)
            ndc7 = [-1*(c[i]-c[i-7]) for i in range(7, n)]
            trn = ts_rank(ndc7, 8) if len(ndc7) >= 8 else None
            if trv and trn: r["a101_043"] = self._s(trv*trn)

        # Alpha#44: -corr(high, rank(volume), 5)
        if n >= 10:
            vr = ts_rank_series(v, 5)
            vc = [x or 0 for x in vr]
            cr = ts_corr(h, vc, 5)
            if cr is not None: r["a101_044"] = self._s(-1*cr)

        # Alpha#45: -rank(sma(delay(close,5),20)) * corr(close,volume,2) * rank(corr(sum(close,5),sum(close,20),2))
        if n >= 30:
            dc5_s = c[:-5] if n > 5 else c
            sm = sma(dc5_s, 20)
            cr1 = ts_corr(c, v, 2)
            sc5 = [sum(c[max(0,i-4):i+1]) for i in range(n)]
            sc20 = [sum(c[max(0,i-19):i+1]) for i in range(n)]
            cr2 = ts_corr(sc5, sc20, 2)
            if sm and cr1 is not None and cr2 is not None:
                r["a101_045"] = self._s(-sm/c[-1]*cr1*cr2)

        # Alpha#46: conditional momentum
        if n >= 21:
            m1 = (c[-11]-c[-21])/10; m2 = (c[-1]-c[-11])/10
            if 0.25 < m1 - m2: r["a101_046"] = -1.0
            elif m1 - m2 < 0: r["a101_046"] = 1.0
            else: r["a101_046"] = self._s(-1*(c[-1]-c[-2]))

        # Alpha#49: conditional momentum 2
        if n >= 21:
            m1 = (c[-11]-c[-21])/10; m2 = (c[-1]-c[-11])/10
            if m1 - m2 < -0.1*c[-1]/(c[-1] if c[-1] else 1): r["a101_049"] = 1.0
            else: r["a101_049"] = self._s(-1*(c[-1]-c[-2]))

        # Alpha#50: -ts_max(rank(corr(rank(vol),rank(vwap),5)), 5)
        if n >= 15:
            vr = ts_rank_series(v, 5); wr = ts_rank_series(vw, 5)
            cs = ts_corr_series([x or 0 for x in vr], [x or 0 for x in wr], 5)
            valid = [x for x in cs if x is not None]
            if len(valid) >= 5: r["a101_050"] = self._s(-1*max(valid[-5:]))

        # Alpha#51: conditional momentum 3
        if n >= 21:
            m1 = (c[-11]-c[-21])/10; m2 = (c[-1]-c[-11])/10
            if m1 - m2 < -0.05: r["a101_051"] = 1.0
            else: r["a101_051"] = self._s(-1*(c[-1]-c[-2]))

        # Alpha#52: ts_min(low,5) delta + ts_rank(ret,240) * ts_rank(volume,5)
        if n >= 240:
            ml5 = ts_min(l, 5); ml5_prev = ts_min(l[:-5], 5) if n > 10 else ml5
            if ml5 and ml5_prev:
                ret_s = [sum(ret[max(0,i-239):i+1])-sum(ret[max(0,i-19):i+1]) for i in range(n)]
                trr = ts_rank(ret_s, min(20, len(ret_s)))
                trv = ts_rank(v, 5)
                if trr and trv:
                    r["a101_052"] = self._s((-ml5+ml5_prev)*trr*trv)

        # Alpha#53: -delta((close-low-(high-close))/(close-low+0.001), 9)
        if n >= 10:
            ratio = [(c[i]-l[i]-(h[i]-c[i]))/(c[i]-l[i]+0.001) for i in range(n)]
            d = delta_s(ratio, 9)
            if d is not None: r["a101_053"] = self._s(-1*d)

        # Alpha#54: (-1*(low-close)*(open^5)) / ((low-high)*(close^5)+0.001)
        denom = (l[-1]-h[-1])*(c[-1]**5) + 0.001
        if abs(denom) > 1e-10:
            r["a101_054"] = self._s((-1*(l[-1]-c[-1])*(o[-1]**5)) / denom)

        # Alpha#96: simplified — ts_argmax of correlation
        if n >= 20:
            cr_s = ts_corr_series(ts_rank_series(c, 5), ts_rank_series(v, 5), 5)
            valid = [x or 0 for x in cr_s[-10:]]
            if len(valid) >= 5:
                r["a101_096"] = self._s(-1*ts_argmax(valid, 5)) if ts_argmax(valid, 5) is not None else None

        # Alpha#101: (close - open) / ((high - low) + 0.001)
        r["a101_101"] = self._s((c[-1]-o[-1]) / ((h[-1]-l[-1])+0.001))

        # --- Summary ---
        ts_count = sum(1 for k, v in r.items() if k.startswith("a101_") and v is not None)
        r["_meta"] = {"ts_computed": ts_count, "cs_pending": "~60 factors need scan mode", "total_defined": 101}
        return r

    # ============================================================
    # WorldQuant Alpha 191 Factors
    # Time-series factors: single-asset OHLCV only
    # ============================================================
    def compute_alpha191(self):
        """WorldQuant 191 Alphas — time-series subset (~80 factors)."""
        r = {"_type": "time_series", "_skipped_cs": "Cross-sectional factors require scan mode with multi-asset rank data."}
        o, h, l, c, v = self.opens, self.highs, self.lows, self.closes, self.volumes
        n = self.n
        if n < 30: return r
        ret = returns_series(c)
        vw = vwap_full(h, l, c, v)
        adv20 = adv_series(v, 20)
        log_v = [log_safe(x) for x in v]

        # Alpha191#1: -CORR(RANK(DELTA(LOG(VOLUME),1)), RANK((CLOSE-OPEN)/OPEN), 6)
        if n >= 8:
            dlv = delta_series(log_v, 1)
            co = [(c[i]-o[i])/o[i] if o[i] != 0 else 0 for i in range(n)]
            dlv_rk = ts_rank_series([x or 0 for x in dlv], 5)
            co_rk = ts_rank_series(co, 5)
            d1 = [x or 0 for x in dlv_rk]; d2 = [x or 0 for x in co_rk]
            if len(d1) >= 6 and len(d2) >= 6:
                cr = ts_corr(d1, d2, 6)
                if cr is not None: r["a191_001"] = self._s(-1*cr)

        # Alpha191#2: -DELTA((CLOSE-LOW-(HIGH-CLOSE))/(HIGH-LOW+0.001), 1)
        if n >= 2:
            ratio = [(c[i]-l[i]-(h[i]-c[i]))/(h[i]-l[i]+0.001) for i in range(n)]
            r["a191_002"] = self._s(-1*(ratio[-1]-ratio[-2]))

        # Alpha191#3: SUM(CLOSE==DELAY(CLOSE,1)?0:CLOSE-(CLOSE>DELAY(CLOSE,1)?MIN(LOW,DELAY(CLOSE,1)):MAX(HIGH,DELAY(CLOSE,1))), 6)
        if n >= 7:
            s = 0
            for i in range(-6, 0):
                pc = c[i-1]
                if c[i] == pc: s += 0
                elif c[i] > pc: s += c[i] - min(l[i], pc)
                else: s += c[i] - max(h[i], pc)
            r["a191_003"] = self._s(s)

        # Alpha191#4: conditional volume-price
        if n >= 9:
            cv8 = ts_corr(c[-8:], v[-8:], 8) if n >= 8 else 0
            sm2 = sma(v, 2)
            if cv8 is not None and sm2 is not None:
                if cv8 < 0 and sm2 > 0: r["a191_004"] = self._s(-1*ts_rank(v, 5))
                else: r["a191_004"] = self._s(max(0, ts_rank(c, 5) or 0) - 0.5)

        # Alpha191#5: -ts_max(corr(ts_rank(vol,5), ts_rank(high,5), 5), 3)
        if n >= 15:
            vr = ts_rank_series(v, 5); hr = ts_rank_series(h, 5)
            cs = ts_corr_series([x or 0 for x in vr], [x or 0 for x in hr], 5)
            valid = [x for x in cs if x is not None]
            if len(valid) >= 3: r["a191_005"] = self._s(-1*max(valid[-3:]))

        # Alpha191#6: -CORR(OPEN, VOLUME, 10) * RANK(ABS(DELTA(CLOSE,1)))
        if n >= 10:
            cr = ts_corr(o, v, 10)
            dc = abs(c[-1]-c[-2]) if n >= 2 else 0
            if cr is not None: r["a191_006"] = self._s(-cr*dc)

        # Alpha191#7: if adv20<vol: -ts_rank(|delta(close,7)|,60)*sign(delta(close,7)) else -1
        if n >= 60:
            if adv20[-1] < v[-1]:
                dc7 = delta_s(c, 7)
                if dc7 is not None:
                    abs_dc = [abs(c[i]-c[i-7]) for i in range(7, n)]
                    if len(abs_dc) >= 60:
                        r["a191_007"] = self._s(-1*ts_rank(abs_dc, 60)*math.copysign(1, dc7))
            else: r["a191_007"] = -1.0

        # Alpha191#8: -(RANK(SUM(OPEN,5)*SUM(RETURN,5) - DELAY(SUM(OPEN,5)*SUM(RETURN,5),10)))
        if n >= 15:
            so5 = ts_sum(o, 5); sr5 = ts_sum(ret, 5)
            if so5 is not None and sr5 is not None:
                cur = so5*sr5
                so5p = sum(o[-15:-10]); sr5p = sum(ret[-15:-10])
                prev = so5p*sr5p
                r["a191_008"] = self._s(-(cur-prev))

        # Alpha191#10: conditional delta
        if n >= 6:
            deltas = [c[i]-c[i-1] for i in range(1, n)]
            if len(deltas) >= 5:
                mn = min(deltas[-5:]); mx = max(deltas[-5:])
                if mn > 0: r["a191_010"] = self._s(deltas[-1])
                elif mx < 0: r["a191_010"] = self._s(deltas[-1])
                else: r["a191_010"] = self._s(-deltas[-1])

        # Alpha191#11: SUM((CLOSE-LOW-(HIGH-CLOSE))/(HIGH-LOW)*VOLUME, 6)
        if n >= 6:
            s = sum(((c[i]-l[i]-(h[i]-c[i]))/(h[i]-l[i]+0.001))*v[i] for i in range(-6, 0))
            r["a191_011"] = self._s(s)

        # Alpha191#12: (OPEN-SMA(VWAP,10))/SMA(VWAP,10)*RANK
        if n >= 10:
            sm = sma(vw, 10)
            if sm and sm != 0: r["a191_012"] = self._s((o[-1]-sm)/sm)

        # Alpha191#13: (HIGH*LOW)^0.5 - VWAP
        r["a191_013"] = self._s(math.sqrt(h[-1]*l[-1]) - vw[-1]) if h[-1]*l[-1] >= 0 else None

        # Alpha191#14: CLOSE - DELAY(CLOSE, 5)
        if n >= 6: r["a191_014"] = self._s(c[-1]-c[-6])

        # Alpha191#15: OPEN/DELAY(CLOSE,1) - 1
        if n >= 2 and c[-2] != 0: r["a191_015"] = self._s(o[-1]/c[-2]-1)

        # Alpha191#19: (CLOSE - DELAY(CLOSE,5))/DELAY(CLOSE,5)
        if n >= 6 and c[-6] != 0: r["a191_019"] = self._s((c[-1]-c[-6])/c[-6])

        # Alpha191#20: (CLOSE - DELAY(CLOSE,6))/DELAY(CLOSE,6)
        if n >= 7 and c[-7] != 0: r["a191_020"] = self._s((c[-1]-c[-7])/c[-7])

        # Alpha191#21: REGBETA(MEAN(CLOSE,6),sequence,6) — linear regression slope
        if n >= 6:
            mc = [sma(c[:i+1], min(6,i+1)) for i in range(n)]
            if len(mc) >= 6:
                y = mc[-6:]; x_vals = list(range(6))
                mx = 2.5; my = sum(y)/6
                num = sum((x_vals[i]-mx)*(y[i]-my) for i in range(6))
                den = sum((x_vals[i]-mx)**2 for i in range(6))
                if den != 0: r["a191_021"] = self._s(num/den)

        # Alpha191#22: SMA((CLOSE-MEAN(CLOSE,6))/MEAN(CLOSE,6) - DELAY(...),3)
        if n >= 12:
            ratio_s = [(c[i]-sma(c[:i+1],min(6,i+1)))/(sma(c[:i+1],min(6,i+1))+0.001) for i in range(n)]
            delta_r = [ratio_s[i]-ratio_s[i-3] if i >= 3 else 0 for i in range(n)]
            r["a191_022"] = self._s(sma(delta_r, 3))

        # Alpha191#23: SMA(CLOSE>DELAY(CLOSE,1)?STD(CLOSE,20):0, 20)
        if n >= 40:
            vals = []
            for i in range(20, n):
                if c[i] > c[i-1]:
                    sd = stdev(c[:i+1], 20)
                    vals.append(sd if sd else 0)
                else: vals.append(0)
            if vals: r["a191_023"] = self._s(sum(vals[-20:])/20 if len(vals) >= 20 else sum(vals)/len(vals))

        # Alpha191#24: SMA(CLOSE-DELAY(CLOSE,5), 5)
        if n >= 10:
            diffs = [c[i]-c[i-5] for i in range(5, n)]
            if len(diffs) >= 5: r["a191_024"] = self._s(sum(diffs[-5:])/5)

        # Alpha191#27: WMA(CLOSE-DELAY(CLOSE,3)/DELAY(CLOSE,3)*100 + ..., 12)
        if n >= 15 and c[-4] != 0:
            roc3 = (c[-1]-c[-4])/c[-4]*100
            r["a191_027"] = self._s(roc3)

        # Alpha191#28: 3*SMA((CLOSE-TSMIN(LOW,9))/(TSMAX(HIGH,9)-TSMIN(LOW,9)+0.001)*100, 3) - 2*SMA(SMA(...,3),3)
        if n >= 15:
            raw = []
            for i in range(9, n):
                lo = min(l[i-8:i+1]); hi = max(h[i-8:i+1])
                raw.append((c[i]-lo)/(hi-lo+0.001)*100)
            if len(raw) >= 9:
                sm1 = sma(raw, 3); sm2 = sma(raw[:-3], 3) if len(raw) > 6 else sm1
                if sm1 is not None and sm2 is not None:
                    r["a191_028"] = self._s(3*sm1-2*sm2)

        # Alpha191#29: (CLOSE-DELAY(CLOSE,6))/DELAY(CLOSE,6)*VOLUME
        if n >= 7 and c[-7] != 0: r["a191_029"] = self._s((c[-1]-c[-7])/c[-7]*v[-1])

        # Alpha191#31: (CLOSE-MEAN(CLOSE,12))/MEAN(CLOSE,12)*100
        if n >= 12:
            m12 = sma(c, 12)
            if m12 and m12 != 0: r["a191_031"] = self._s((c[-1]-m12)/m12*100)

        # Alpha191#32: -SUM(RANK(CORR(VWAP,DELAY(CLOSE,1),4)),8)/8
        if n >= 14:
            dc1 = [0]+[c[i-1] for i in range(1, n)]
            cs = ts_corr_series(vw, dc1, 4)
            valid = [x for x in cs[-8:] if x is not None]
            if valid: r["a191_032"] = self._s(-sum(valid)/len(valid))

        # Alpha191#33: ((-TSMIN(LOW,5))+DELAY(TSMIN(LOW,5),5)) * RANK(SUM(RET,240)-SUM(RET,20))/220 * TSRANK(VOLUME,5)
        if n >= 240:
            ml5 = ts_min(l, 5)
            ml5_d = min(l[-10:-5]) if n >= 10 else ml5
            if ml5 and ml5_d:
                ret_diff = (ts_sum(ret, 240) or 0) - (ts_sum(ret, 20) or 0)
                trv = ts_rank(v, 5)
                if trv: r["a191_033"] = self._s((-ml5+ml5_d)*(ret_diff/220)*trv)

        # Alpha191#34: MEAN(CLOSE, 12) / CLOSE
        if n >= 12:
            m12 = sma(c, 12)
            if m12 and c[-1] != 0: r["a191_034"] = self._s(m12/c[-1])

        # Alpha191#35: MIN(RANK(DECAYLINEAR(DELTA(OPEN,1),15)), RANK(DECAYLINEAR(CORR(VOLUME,OPEN*0.65+CLOSE*0.35,17),7)))
        if n >= 20:
            do_s = delta_series(o, 1); do_clean = [x or 0 for x in do_s]
            dl1 = decay_linear(do_clean, 15)
            mix = [o[i]*0.65+c[i]*0.35 for i in range(n)]
            cs = ts_corr_series(v, mix, 17)
            cs_clean = [x or 0 for x in cs]
            dl2 = decay_linear(cs_clean, 7)
            if dl1 is not None and dl2 is not None: r["a191_035"] = self._s(min(dl1, dl2))

        # Alpha191#37: -CORR(OPEN, VOLUME, 10) * RANK(ABS(CLOSE-VWAP))
        if n >= 10:
            cr = ts_corr(o, v, 10)
            if cr is not None: r["a191_037"] = self._s(-cr*abs(c[-1]-vw[-1]))

        # Alpha191#38: -TSRANK(CLOSE, 10) * RANK(CLOSE/OPEN)
        if n >= 10:
            trc = ts_rank(c, 10)
            if trc and o[-1] != 0: r["a191_038"] = self._s(-trc*(c[-1]/o[-1]))

        # Alpha191#39: -RANK(DELTA(CLOSE,2)) * DECAYLINEAR(CORR(VWAP,VOLUME,8),4) * (1-RANK(DECAYLINEAR(RET,5)))
        if n >= 15:
            dc2 = delta_s(c, 2)
            cs = ts_corr_series(vw, v, 8); cs_clean = [x or 0 for x in cs]
            dl1 = decay_linear(cs_clean, 4)
            dl2 = decay_linear(ret, 5)
            if dc2 is not None and dl1 is not None and dl2 is not None:
                r["a191_039"] = self._s(-dc2*dl1*(1-dl2))

        # Alpha191#43: SUM(CLOSE>DELAY(CLOSE,1)?VOL:CLOSE<DELAY(CLOSE,1)?-VOL:0, 6)
        if n >= 7:
            s = 0
            for i in range(-6, 0):
                if c[i] > c[i-1]: s += v[i]
                elif c[i] < c[i-1]: s -= v[i]
            r["a191_043"] = self._s(s)

        # Alpha191#44: TSRANK(DECAYLINEAR(CORR(LOW,MEAN(VOLUME,10),7),6),4) + TSRANK(DECAYLINEAR(DELTA(VWAP,3),10),15)
        if n >= 25:
            mv10 = [sma(v[:i+1], min(10,i+1)) for i in range(n)]
            cs = ts_corr_series(l, mv10, 7); cs_clean = [x or 0 for x in cs]
            dl1 = decay_linear(cs_clean, 6)
            dv3 = delta_series(vw, 3); dv_clean = [x or 0 for x in dv3]
            dl2 = decay_linear(dv_clean, 10)
            if dl1 is not None and dl2 is not None:
                r["a191_044"] = self._s((dl1 or 0)+(dl2 or 0))

        # Alpha191#45: RANK(DELTA(CLOSE*0.6+OPEN*0.4, 1)) * RANK(CORR(VWAP, MEAN(VOLUME,150),15))
        if n >= 150:
            mix = [c[i]*0.6+o[i]*0.4 for i in range(n)]
            dm = delta_s(mix, 1)
            mv150 = [sma(v[:i+1], min(150,i+1)) for i in range(n)]
            cr = ts_corr(vw, mv150, 15)
            if dm is not None and cr is not None: r["a191_045"] = self._s(dm*cr)

        # Alpha191#46: (MEAN(CLOSE,3)+MEAN(CLOSE,6)+MEAN(CLOSE,12)+MEAN(CLOSE,24))/(4*CLOSE)
        if n >= 24:
            m3 = sma(c,3); m6 = sma(c,6); m12 = sma(c,12); m24 = sma(c,24)
            if all(x is not None for x in [m3,m6,m12,m24]) and c[-1] != 0:
                r["a191_046"] = self._s((m3+m6+m12+m24)/(4*c[-1]))

        # Alpha191#49: SUM(HIGH+LOW >= DELAY(HIGH,1)+DELAY(LOW,1) ? 0 : MAX(ABS(HIGH-DELAY(HIGH,1)), ABS(LOW-DELAY(LOW,1))), 12)
        if n >= 13:
            s = 0
            for i in range(-12, 0):
                if h[i]+l[i] >= h[i-1]+l[i-1]: s += 0
                else: s += max(abs(h[i]-h[i-1]), abs(l[i]-l[i-1]))
            r["a191_049"] = self._s(s)

        # Alpha191#50: SUM(HL_condition, 12) / SUM(..., 12) — DI-like
        if n >= 13:
            up = 0; down = 0
            for i in range(-12, 0):
                if h[i]+l[i] > h[i-1]+l[i-1]: up += max(abs(h[i]-h[i-1]), abs(l[i]-l[i-1]))
                elif h[i]+l[i] < h[i-1]+l[i-1]: down += max(abs(h[i]-h[i-1]), abs(l[i]-l[i-1]))
            total = up + down
            if total > 0: r["a191_050"] = self._s((up-down)/total)

        # Alpha191#51: SUM condition similar to #49 but different threshold
        if n >= 13:
            s = 0
            for i in range(-12, 0):
                if h[i]+l[i] <= h[i-1]+l[i-1]: s += 0
                else: s += max(abs(h[i]-h[i-1]), abs(l[i]-l[i-1]))
            r["a191_051"] = self._s(s)

        # Alpha191#53: COUNT(CLOSE>DELAY(CLOSE,1), 12) / 12 * 100
        if n >= 13:
            cnt = sum(1 for i in range(-12, 0) if c[i] > c[i-1])
            r["a191_053"] = self._s(cnt/12*100)

        # Alpha191#54: -RANK(STD(ABS(CLOSE-OPEN)) + (CLOSE-OPEN) + CORR(CLOSE,OPEN,10))
        if n >= 10:
            co = [abs(c[i]-o[i]) for i in range(n)]
            sd = stdev(co, 5); cr = ts_corr(c, o, 10)
            if sd is not None and cr is not None:
                r["a191_054"] = self._s(-(sd + (c[-1]-o[-1]) + cr))

        # Alpha191#55: SUM(16*(CLOSE-DELAY(CLOSE,1)+(CLOSE-OPEN)/2+DELAY(CLOSE,1)-DELAY(OPEN,1)) / (ABS(HIGH-DELAY(CLOSE,1))>ABS(LOW-DELAY(CLOSE,1))?...), 20)
        # Simplified: Williams AD-like
        if n >= 21:
            s = 0
            for i in range(-20, 0):
                true_range_val = max(h[i]-l[i], abs(h[i]-c[i-1]), abs(l[i]-c[i-1]))
                if true_range_val > 0:
                    s += (c[i]-c[i-1]+(c[i]-o[i])/2+(c[i-1]-o[i-1]))/true_range_val
            r["a191_055"] = self._s(s)

        # Alpha191#56: OPEN^0.1 * RANK(VWAP-MIN(VWAP,12)) * ... simplified
        if n >= 12:
            mv12 = ts_min(vw, 12)
            if mv12: r["a191_056"] = self._s((o[-1]**0.1) * (vw[-1]-mv12))

        # Alpha191#58: COUNT(CLOSE>DELAY(CLOSE,1), 20) / 20 * 100
        if n >= 21:
            cnt = sum(1 for i in range(-20, 0) if c[i] > c[i-1])
            r["a191_058"] = self._s(cnt/20*100)

        # Alpha191#59: SUM(CLOSE==DELAY(CLOSE,1)?0:CLOSE-MAX/MIN(...), 20)
        if n >= 21:
            s = 0
            for i in range(-20, 0):
                if c[i] != c[i-1]:
                    if c[i] > c[i-1]: s += c[i] - min(l[i], c[i-1])
                    else: s += c[i] - max(h[i], c[i-1])
            r["a191_059"] = self._s(s)

        # Alpha191#60: SUM((2*CLOSE-LOW-HIGH)/(HIGH-LOW+0.001)*VOLUME, 20)
        if n >= 20:
            s = sum((2*c[i]-l[i]-h[i])/(h[i]-l[i]+0.001)*v[i] for i in range(-20, 0))
            r["a191_060"] = self._s(s)

        # Alpha191#61: MAX(RANK(DECAYLINEAR(DELTA(VWAP,1),12)), RANK(DECAYLINEAR(RANK(CORR(LOW,MEAN(VOL,80),8)),17)))
        if n >= 80:
            dv = delta_series(vw, 1); dv_clean = [x or 0 for x in dv]
            dl1 = decay_linear(dv_clean, 12)
            mv80 = [sma(v[:i+1], min(80,i+1)) for i in range(n)]
            cs = ts_corr_series(l, mv80, 8); cs_clean = [x or 0 for x in cs]
            dl2 = decay_linear(cs_clean, 17)
            if dl1 is not None and dl2 is not None: r["a191_061"] = self._s(max(dl1, dl2))

        # Alpha191#62: -CORR(HIGH, RANK(VOLUME), 5)
        if n >= 10:
            vr = ts_rank_series(v, 5)
            cr = ts_corr(h, [x or 0 for x in vr], 5)
            if cr is not None: r["a191_062"] = self._s(-cr)

        # Alpha191#64: MAX(RANK(DECAYLINEAR(CORR(RANK(VWAP),RANK(VOLUME),4),4)), RANK(DECAYLINEAR(MAX(CORR(RANK(CLOSE),RANK(MEAN(VOL,60)),4),13),14)))
        if n >= 60:
            vwrk = ts_rank_series(vw, 5); vrk = ts_rank_series(v, 5)
            cs1 = ts_corr_series([x or 0 for x in vwrk], [x or 0 for x in vrk], 4)
            dl1 = decay_linear([x or 0 for x in cs1], 4)
            mv60 = [sma(v[:i+1], min(60,i+1)) for i in range(n)]
            crk = ts_rank_series(c, 5); mrk = ts_rank_series(mv60, 5)
            cs2 = ts_corr_series([x or 0 for x in crk], [x or 0 for x in mrk], 4)
            dl2 = decay_linear([x or 0 for x in cs2], 14)
            if dl1 is not None and dl2 is not None: r["a191_064"] = self._s(max(dl1, dl2))

        # Alpha191#65: MEAN(CLOSE, 6) / CLOSE
        if n >= 6:
            m6 = sma(c, 6)
            if m6 and c[-1] != 0: r["a191_065"] = self._s(m6/c[-1])

        # Alpha191#68: SMA(((HIGH+LOW)/2-(DELAY(HIGH,1)+DELAY(LOW,1))/2)*(HIGH-LOW)/VOLUME, 15)
        if n >= 16:
            vals = []
            for i in range(1, n):
                hl_mid = (h[i]+l[i])/2; prev_hl = (h[i-1]+l[i-1])/2
                rng = h[i]-l[i]
                vals.append((hl_mid-prev_hl)*rng/(v[i]+0.001))
            if len(vals) >= 15: r["a191_068"] = self._s(sma(vals, 15))

        # Alpha191#71: (CLOSE-MEAN(CLOSE,24))/MEAN(CLOSE,24)*100 * (TSRANK(CLOSE,24))
        if n >= 24:
            m24 = sma(c, 24); trc = ts_rank(c, 24)
            if m24 and m24 != 0 and trc: r["a191_071"] = self._s((c[-1]-m24)/m24*100*trc)

        # Alpha191#72: SMA(MAX(HIGH-DELAY(CLOSE,1),0), 15) / SMA(ABS(HIGH-DELAY(CLOSE,1)), 15) * 100
        if n >= 16:
            pos = [max(h[i]-c[i-1], 0) for i in range(1, n)]
            total = [abs(h[i]-c[i-1]) for i in range(1, n)]
            sp = sma(pos, 15); st = sma(total, 15)
            if sp is not None and st is not None and st != 0: r["a191_072"] = self._s(sp/st*100)

        # Alpha191#74: RANK(CORR(SUM(LOW*0.35+VWAP*0.65, 20), SUM(MEAN(VOLUME,40), 20), 7))
        if n >= 60:
            mix = [l[i]*0.35+vw[i]*0.65 for i in range(n)]
            sum_mix = [sum(mix[max(0,i-19):i+1]) for i in range(n)]
            mv40 = [sma(v[:i+1], min(40,i+1)) for i in range(n)]
            sum_mv = [sum(mv40[max(0,i-19):i+1]) for i in range(n)]
            cr = ts_corr(sum_mix, sum_mv, 7)
            if cr is not None: r["a191_074"] = self._s(cr)

        # Alpha191#75: COUNT(CLOSE>OPEN && BANCHMARK..., 50) simplified as bullish candle ratio
        if n >= 50:
            cnt = sum(1 for i in range(-50, 0) if c[i] > o[i])
            r["a191_075"] = self._s(cnt/50*100)

        # Alpha191#77: MIN(RANK(DECAYLINEAR((HIGH+LOW)/2+HIGH-CLOSE-LOW,20)), RANK(DECAYLINEAR(CORR(((HIGH+LOW)/2),MEAN(VOLUME,40),3),6)))
        if n >= 40:
            raw1 = [(h[i]+l[i])/2+h[i]-c[i]-l[i] for i in range(n)]
            dl1 = decay_linear(raw1, 20)
            mv40 = [sma(v[:i+1], min(40,i+1)) for i in range(n)]
            hl2 = [(h[i]+l[i])/2 for i in range(n)]
            cs = ts_corr_series(hl2, mv40, 3)
            dl2 = decay_linear([x or 0 for x in cs], 6)
            if dl1 is not None and dl2 is not None: r["a191_077"] = self._s(min(dl1, dl2))

        # Alpha191#78: ((HIGH+LOW+CLOSE)/3 - MA(((HIGH+LOW+CLOSE)/3),12)) / MA(ABS(...),12)*100
        if n >= 12:
            tp = [(h[i]+l[i]+c[i])/3 for i in range(n)]
            ma_tp = sma(tp, 12)
            if ma_tp:
                diffs = [abs(tp[i]-sma(tp[:i+1], min(12,i+1))) for i in range(n)]
                ma_diff = sma(diffs, 12)
                if ma_diff and ma_diff != 0:
                    r["a191_078"] = self._s((tp[-1]-ma_tp)/ma_diff*100)

        # Alpha191#80: (VOLUME-DELAY(VOLUME,5))/DELAY(VOLUME,5)*100
        if n >= 6 and v[-6] != 0: r["a191_080"] = self._s((v[-1]-v[-6])/v[-6]*100)

        # Alpha191#81: SMA(VOLUME, 21)
        if n >= 21: r["a191_081"] = self._s(sma(v, 21))

        # Alpha191#83: -RANK(COV(RANK(HIGH), RANK(VOLUME), 5))
        if n >= 10:
            hr = ts_rank_series(h, 5); vr = ts_rank_series(v, 5)
            cv = ts_cov([x or 0 for x in hr], [x or 0 for x in vr], 5)
            if cv is not None: r["a191_083"] = self._s(-cv)

        # Alpha191#84: SUM(CLOSE>DELAY(CLOSE,1)?VOL:(CLOSE<DELAY(CLOSE,1)?-VOL:0), 20)
        if n >= 21:
            s = 0
            for i in range(-20, 0):
                if c[i] > c[i-1]: s += v[i]
                elif c[i] < c[i-1]: s -= v[i]
            r["a191_084"] = self._s(s)

        # Alpha191#85: TSRANK(VOLUME/MEAN(VOLUME,20), 20) * TSRANK(-DELTA(CLOSE,7), 8)
        if n >= 27:
            vr = [v[i]/(adv20[i] if adv20[i]>0 else 1) for i in range(n)]
            trv = ts_rank(vr, 20)
            ndc = [-1*(c[i]-c[i-7]) for i in range(7, n)]
            trn = ts_rank(ndc, 8) if len(ndc) >= 8 else None
            if trv and trn: r["a191_085"] = self._s(trv*trn)

        # Alpha191#88: (CLOSE-DELAY(CLOSE,20))/DELAY(CLOSE,20)*100
        if n >= 21 and c[-21] != 0: r["a191_088"] = self._s((c[-1]-c[-21])/c[-21]*100)

        # Alpha191#89: 2*(SMA(CLOSE,13)-SMA(CLOSE,27)) / SMA(CLOSE,10)
        if n >= 27:
            s13 = sma(c, 13); s27 = sma(c, 27); s10 = sma(c, 10)
            if all(x is not None for x in [s13,s27,s10]) and s10 != 0:
                r["a191_089"] = self._s(2*(s13-s27)/s10)

        # Alpha191#90: -RANK(CORR(RANK(VWAP), RANK(VOLUME), 5))
        if n >= 10:
            vwrk = ts_rank_series(vw, 5); vrk = ts_rank_series(v, 5)
            cr = ts_corr([x or 0 for x in vwrk], [x or 0 for x in vrk], 5)
            if cr is not None: r["a191_090"] = self._s(-cr)

        # Alpha191#91: -RANK(CLOSE-MAX(CLOSE,5)) * RANK(CORR(MEAN(VOLUME,40),LOW,5))
        if n >= 40:
            mc5 = ts_max(c, 5)
            mv40 = [sma(v[:i+1], min(40,i+1)) for i in range(n)]
            cr = ts_corr(mv40, l, 5)
            if mc5 and cr is not None: r["a191_091"] = self._s(-(c[-1]-mc5)*cr)

        # Alpha191#93: SUM(OPEN>=DELAY(OPEN,1)?0:MAX(OPEN-LOW, OPEN-DELAY(OPEN,1)), 20)
        if n >= 21:
            s = 0
            for i in range(-20, 0):
                if o[i] < o[i-1]: s += max(o[i]-l[i], o[i]-o[i-1])
            r["a191_093"] = self._s(s)

        # Alpha191#94: SUM(CLOSE>DELAY(CLOSE,1)?VOL:-VOL, 30)
        if n >= 31:
            s = sum(v[i] if c[i] > c[i-1] else -v[i] for i in range(-30, 0))
            r["a191_094"] = self._s(s)

        # Alpha191#95: STD(AMOUNT, 20) — using volume*close as proxy for amount
        if n >= 20:
            amounts = [c[i]*v[i] for i in range(n)]
            sd = stdev(amounts, 20)
            if sd is not None: r["a191_095"] = self._s(sd)

        # Alpha191#96: SMA(SMA((CLOSE-TSMIN(LOW,9))/(TSMAX(HIGH,9)-TSMIN(LOW,9)+0.001)*100, 3), 3)
        if n >= 15:
            raw = []
            for i in range(9, n):
                lo = min(l[i-8:i+1]); hi = max(h[i-8:i+1])
                raw.append((c[i]-lo)/(hi-lo+0.001)*100)
            if len(raw) >= 6:
                sm1_vals = [sum(raw[max(0,i-2):i+1])/min(3,i+1) for i in range(len(raw))]
                sm2 = sma(sm1_vals, 3)
                if sm2 is not None: r["a191_096"] = self._s(sm2)

        # Alpha191#98: STD(VOLUME, 10) / MEAN(VOLUME, 10) * 100
        if n >= 10:
            sd = stdev(v, 10); mn = sma(v, 10)
            if sd is not None and mn and mn != 0: r["a191_098"] = self._s(sd/mn*100)

        # Alpha191#101: (CLOSE-OPEN)/((HIGH-LOW)+0.001)
        r["a191_101"] = self._s((c[-1]-o[-1])/((h[-1]-l[-1])+0.001))

        # Alpha191#102: SMA(MAX(VOLUME-DELAY(VOLUME,1), 0), 6) / SMA(ABS(VOLUME-DELAY(VOLUME,1)), 6) * 100
        if n >= 7:
            pos = [max(v[i]-v[i-1], 0) for i in range(1, n)]
            tot = [abs(v[i]-v[i-1]) for i in range(1, n)]
            sp = sma(pos, 6); st = sma(tot, 6)
            if sp is not None and st is not None and st != 0: r["a191_102"] = self._s(sp/st*100)

        # Alpha191#104: -DELTA(CORR(HIGH, VOLUME, 5), 5) * RANK(STD(CLOSE, 20))
        if n >= 15:
            cs = ts_corr_series(h, v, 5)
            valid = [x or 0 for x in cs]
            if len(valid) >= 6:
                d5 = valid[-1] - valid[-6]
                sd = stdev(c, 20)
                if sd is not None: r["a191_104"] = self._s(-d5*sd)

        # Alpha191#105: -CORR(RANK(OPEN), RANK(VOLUME), 10)
        if n >= 15:
            ork = ts_rank_series(o, 5); vrk = ts_rank_series(v, 5)
            cr = ts_corr([x or 0 for x in ork], [x or 0 for x in vrk], 10)
            if cr is not None: r["a191_105"] = self._s(-cr)

        # Alpha191#107: (-RANK(OPEN-DELAY(HIGH,1))) * RANK(OPEN-DELAY(CLOSE,1)) * RANK(OPEN-DELAY(LOW,1))
        if n >= 2:
            r["a191_107"] = self._s(-(o[-1]-h[-2])*(o[-1]-c[-2])*(o[-1]-l[-2]))

        # Alpha191#108: RANK(HIGH-MIN(HIGH,2)) * RANK(CORR(VWAP, MEAN(VOLUME,120),6))
        if n >= 120:
            mh2 = ts_min(h, 2)
            mv120 = [sma(v[:i+1], min(120,i+1)) for i in range(n)]
            cr = ts_corr(vw, mv120, 6)
            if mh2 and cr is not None: r["a191_108"] = self._s((h[-1]-mh2)*cr)

        # Alpha191#110: SUM(MAX(0,HIGH-DELAY(CLOSE,1)),20)/SUM(MAX(0,DELAY(CLOSE,1)-LOW),20)*100
        if n >= 21:
            up = sum(max(0, h[i]-c[i-1]) for i in range(-20, 0))
            dn = sum(max(0, c[i-1]-l[i]) for i in range(-20, 0))
            if dn != 0: r["a191_110"] = self._s(up/dn*100)

        # Alpha191#150: (CLOSE+HIGH+LOW)/3 * VOLUME
        r["a191_150"] = self._s((c[-1]+h[-1]+l[-1])/3*v[-1])

        # Alpha191#155: SMA(VOLUME, 13) - SMA(VOLUME, 27) — volume MACD-like
        if n >= 27:
            s13 = sma(v, 13); s27 = sma(v, 27)
            if s13 is not None and s27 is not None: r["a191_155"] = self._s(s13-s27)

        # Alpha191#158: (HIGH-SMA(CLOSE,15))-(LOW-SMA(CLOSE,15))
        if n >= 15:
            sm = sma(c, 15)
            if sm: r["a191_158"] = self._s((h[-1]-sm)-(l[-1]-sm))

        # Alpha191#160: SMA(CLOSE<=DELAY(CLOSE,1)?STD(CLOSE,20):0, 20)
        if n >= 40:
            vals = []
            for i in range(20, n):
                if c[i] <= c[i-1]:
                    sd = stdev(c[:i+1], 20)
                    vals.append(sd if sd else 0)
                else: vals.append(0)
            if len(vals) >= 20: r["a191_160"] = self._s(sum(vals[-20:])/20)

        # Alpha191#170: RANK(1/CLOSE) * VOLUME / MEAN(VOLUME,20) * ((HIGH*RANK(HIGH-CLOSE))/(SUM(HIGH,5)/5)) - RANK(VWAP-DELAY(VWAP,5))
        if n >= 20:
            vr = v[-1]/(adv20[-1] if adv20[-1]>0 else 1)
            sh5 = sum(h[-5:])/5
            if sh5 != 0 and c[-1] != 0:
                part1 = (1/c[-1]) * vr * (h[-1]*(h[-1]-c[-1])/sh5)
                part2 = (vw[-1]-vw[-6]) if n >= 6 else 0
                r["a191_170"] = self._s(part1-part2)

        # Alpha191#176: DECAYLINEAR(RANK(CORR(RANK(VOL),RANK(VWAP),6))*RANK(CORR(RANK(CLOSE),RANK(MEAN(VOL,10)),10)),12)
        if n >= 25:
            vrk = ts_rank_series(v, 5); wk = ts_rank_series(vw, 5)
            cs1 = ts_corr_series([x or 0 for x in vrk], [x or 0 for x in wk], 6)
            crk = ts_rank_series(c, 5)
            mv10 = [sma(v[:i+1], min(10,i+1)) for i in range(n)]
            mrk = ts_rank_series(mv10, 5)
            cs2 = ts_corr_series([x or 0 for x in crk], [x or 0 for x in mrk], 10)
            prod = [(cs1[i] or 0)*(cs2[i] or 0) for i in range(n)]
            dl = decay_linear(prod, 12)
            if dl is not None: r["a191_176"] = self._s(dl)

        # Alpha191#178: (CLOSE-DELAY(CLOSE,1))/DELAY(CLOSE,1)*VOLUME
        if n >= 2 and c[-2] != 0: r["a191_178"] = self._s((c[-1]-c[-2])/c[-2]*v[-1])

        # Alpha191#184: RANK(CORR(DELAY(OPEN-CLOSE,1), CLOSE, 200)) + RANK(OPEN-CLOSE)
        if n >= 200:
            doc = [o[i]-c[i] for i in range(n)]
            doc_d1 = [0]+doc[:-1]
            cr = ts_corr(doc_d1, c, 200)
            if cr is not None: r["a191_184"] = self._s(cr + (o[-1]-c[-1]))

        # Alpha191#185: RANK(-(1-OPEN/CLOSE)^2)
        if c[-1] != 0:
            r["a191_185"] = self._s(-((1-o[-1]/c[-1])**2))

        # Alpha191#187: SUM(OPEN<=DELAY(OPEN,1)?0:MAX(HIGH-OPEN,OPEN-DELAY(OPEN,1)), 20)
        if n >= 21:
            s = 0
            for i in range(-20, 0):
                if o[i] > o[i-1]: s += max(h[i]-o[i], o[i]-o[i-1])
            r["a191_187"] = self._s(s)

        # Alpha191#188: ((HIGH-LOW-SMA(HIGH-LOW,11))/SMA(HIGH-LOW,11))*100
        if n >= 11:
            hl = [h[i]-l[i] for i in range(n)]
            sm = sma(hl, 11)
            if sm and sm != 0: r["a191_188"] = self._s((hl[-1]-sm)/sm*100)

        # Alpha191#189: MEAN(ABS(CLOSE-MEAN(CLOSE,6)), 6)
        if n >= 12:
            m6 = sma(c, 6)
            if m6:
                diffs = [abs(c[i]-sma(c[:i+1], min(6,i+1))) for i in range(n)]
                r["a191_189"] = self._s(sma(diffs, 6))

        # Alpha191#190: LOG((COUNT(CLOSE/DELAY(CLOSE)-1>((CLOSE/DELAY(CLOSE,19))^(1/20)-1),20)+1)...) simplified
        # COUNT of days where daily ret > geometric avg ret over 20 days
        if n >= 21:
            geo_ret = (c[-1]/c[-21])**(1/20)-1 if c[-21] != 0 else 0
            cnt = sum(1 for i in range(-20, 0) if c[i-1] != 0 and (c[i]/c[i-1]-1) > geo_ret)
            r["a191_190"] = self._s(log_safe(cnt+1))

        # Alpha191#191: CORR(MEAN(VOLUME,20), LOW, 5) + (HIGH+LOW)/2 - CLOSE
        if n >= 25:
            mv20 = [sma(v[:i+1], min(20,i+1)) for i in range(n)]
            cr = ts_corr(mv20, l, 5)
            if cr is not None: r["a191_191"] = self._s(cr + (h[-1]+l[-1])/2 - c[-1])

        # --- Summary ---
        ts_count = sum(1 for k, val in r.items() if k.startswith("a191_") and val is not None)
        r["_meta"] = {"ts_computed": ts_count, "cs_pending": "~90 factors need scan mode", "total_defined": 191}
        return r

    # ============================================================
    # Cross-Sectional Alpha Computation (for scan mode)
    # ============================================================
    @staticmethod
    def compute_alpha_cross_sectional(all_assets):
        """Compute cross-sectional alpha factors from multi-asset data.
        Args: all_assets = [{"symbol": "BTC-USDT", "closes": [...], "volumes": [...], ...}, ...]
        Returns: {symbol: {"a101_cs_001": val, ...}}
        """
        if not all_assets or len(all_assets) < 5:
            return {"_error": "Need >= 5 assets for cross-sectional rank. Use scan mode."}
        n_assets = len(all_assets)
        result = {a["symbol"]: {} for a in all_assets}

        # Helper: cross-sectional rank
        def cs_rank(values):
            """Rank values across assets (0~1)."""
            sorted_v = sorted(range(len(values)), key=lambda i: values[i])
            ranks = [0.0] * len(values)
            for rank_idx, orig_idx in enumerate(sorted_v):
                ranks[orig_idx] = (rank_idx + 1) / len(values)
            return ranks

        # Compute per-asset metrics
        rets_1d = []; rets_5d = []; rets_10d = []
        vol_ratios = []; price_to_high = []; close_open = []
        for a in all_assets:
            cl = a.get("closes", [])
            vl = a.get("volumes", [])
            ol = a.get("opens", []); hl = a.get("highs", [])
            if len(cl) >= 11:
                rets_1d.append((cl[-1]-cl[-2])/cl[-2] if cl[-2] else 0)
                rets_5d.append((cl[-1]-cl[-6])/cl[-6] if cl[-6] else 0)
                rets_10d.append((cl[-1]-cl[-11])/cl[-11] if cl[-11] else 0)
            else:
                rets_1d.append(0); rets_5d.append(0); rets_10d.append(0)
            if len(vl) >= 20:
                avg_v = sum(vl[-20:])/20
                vol_ratios.append(vl[-1]/avg_v if avg_v > 0 else 1)
            else: vol_ratios.append(1)
            if len(hl) >= 20:
                high20 = max(hl[-20:])
                price_to_high.append(cl[-1]/high20 if high20 else 1)
            else: price_to_high.append(1)
            if ol: close_open.append((cl[-1]-ol[-1])/ol[-1] if ol[-1] else 0)
            else: close_open.append(0)

        # Cross-sectional ranks
        rk_ret1 = cs_rank(rets_1d)
        rk_ret5 = cs_rank(rets_5d)
        rk_ret10 = cs_rank(rets_10d)
        rk_vol = cs_rank(vol_ratios)
        rk_pth = cs_rank(price_to_high)
        rk_co = cs_rank(close_open)

        for i, a in enumerate(all_assets):
            sym = a["symbol"]
            # Alpha101 CS#1: rank(ts_argmax(SignedPower((ret<0?std:close),2),5)) - 0.5
            result[sym]["a101_cs_001"] = round(rk_ret1[i] - 0.5, 6)
            # Alpha101 CS#5: -ts_max(corr(rank_ret, rank_vol, 6), 3) proxy
            result[sym]["a101_cs_005"] = round(-rk_ret5[i]*rk_vol[i], 6)
            # Alpha101 CS#10: rank(max(0, ret_1d)*ret_1d - rank_vol)
            result[sym]["a101_cs_010"] = round(rk_ret1[i]*max(0, rets_1d[i]) - rk_vol[i], 6)
            # Alpha101 CS#11: (rank(ts_max(vwap-close,3)) + rank(ts_min(vwap-close,3))) * rank(delta(volume,3))
            result[sym]["a101_cs_011"] = round(rk_pth[i]*rk_vol[i], 6)
            # General momentum-volume cross rank
            result[sym]["a101_cs_mom_vol"] = round(rk_ret5[i]*0.6 + rk_vol[i]*0.4 - 0.5, 6)
            # Alpha191 cross-sectional
            result[sym]["a191_cs_ret_rank"] = round(rk_ret10[i], 6)
            result[sym]["a191_cs_vol_rank"] = round(rk_vol[i], 6)
            result[sym]["a191_cs_reversal"] = round(1-rk_ret1[i], 6)
            result[sym]["a191_cs_co_rank"] = round(rk_co[i], 6)

        return result

    # --- Private helpers ---
    def _rsi(self, data, period):
        if len(data)<period+1: return None
        gains=[]; losses=[]
        for i in range(1,len(data)):
            d=data[i]-data[i-1]; gains.append(max(d,0)); losses.append(max(-d,0))
        ag=sum(gains[:period])/period; al=sum(losses[:period])/period
        for i in range(period,len(gains)): ag=(ag*(period-1)+gains[i])/period; al=(al*(period-1)+losses[i])/period
        if al==0: return 100.0
        return 100.0-100.0/(1.0+ag/al)

    def _stochastic(self, period, sk=3, sd=3):
        h,l,c = self.highs,self.lows,self.closes
        if len(c)<period: return None
        ks=[]
        for i in range(period-1,len(c)):
            hh=max(h[i-period+1:i+1]); ll=min(l[i-period+1:i+1])
            ks.append((c[i]-ll)/(hh-ll)*100 if hh!=ll else 50)
        k = sma(ks,sk) if len(ks)>=sk else (ks[-1] if ks else None)
        ksm = sma_series(ks,sk); vk = [x for x in ksm if x is not None]
        d = sma(vk,sd) if len(vk)>=sd else None
        if k is None: return None
        return {"k":k,"d":d}

    def _stoch_rsi(self, period):
        rsi_vals=[]
        for i in range(period+1,len(self.closes)+1):
            r=self._rsi(self.closes[:i],period)
            if r is not None: rsi_vals.append(r)
        if len(rsi_vals)<period: return None
        recent=rsi_vals[-period:]; mx=max(recent); mn=min(recent)
        if mx==mn: return 0.5
        return (rsi_vals[-1]-mn)/(mx-mn)

    def _cci(self, period):
        h,l,c=self.highs,self.lows,self.closes
        if len(c)<period: return None
        tp=[(h[i]+l[i]+c[i])/3 for i in range(len(c))]
        tp_s=sma(tp,period)
        if not tp_s: return None
        md=sum(abs(tp[i]-tp_s) for i in range(-period,0))/period
        if md==0: return 0
        return (tp[-1]-tp_s)/(0.015*md)

    def _macd(self, data, fast, slow, sig):
        fe=ema(data,fast); se=ema(data,slow)
        if fe is None or se is None: return None
        ml=fe-se; fs=ema_series(data,fast); ss=ema_series(data,slow)
        mv=[f-s for f,s in zip(fs,ss) if f is not None and s is not None]
        sl=ema(mv,sig) if len(mv)>=sig else None
        return {"macd":ml,"signal":sl,"hist":ml-sl if sl else None}

    def _trix(self, data, period):
        e1=[x for x in ema_series(data,period) if x is not None]
        e2=[x for x in ema_series(e1,period) if x is not None] if len(e1)>=period else []
        e3=[x for x in ema_series(e2,period) if x is not None] if len(e2)>=period else []
        if len(e3)<2 or e3[-2]==0: return None
        return (e3[-1]-e3[-2])/e3[-2]*100

    def _kst(self, data):
        if len(data)<30: return None
        def roc_sma(d,rp,sp):
            rocs=[(d[i]-d[i-rp])/d[i-rp]*100 for i in range(rp,len(d)) if d[i-rp]!=0]
            return sma(rocs,sp) if len(rocs)>=sp else None
        r1,r2,r3,r4=roc_sma(data,10,10),roc_sma(data,15,10),roc_sma(data,20,10),roc_sma(data,30,15)
        if any(x is None for x in [r1,r2,r3,r4]): return None
        kv=r1+r2*2+r3*3+r4*4
        return {"kst":kv,"signal":kv*0.9}

    def _ultimate_osc(self, p1=7, p2=14, p3=28):
        h,l,c=self.highs,self.lows,self.closes
        if len(c)<p3+1: return None
        bp=[]; trl=[]
        for i in range(1,len(c)):
            tl=min(l[i],c[i-1]); bp.append(c[i]-tl); trl.append(max(h[i],c[i-1])-tl)
        def avg(d,t,p):
            if len(d)<p: return None
            s=sum(d[-p:]); tt=sum(t[-p:])
            return s/tt if tt else 0
        a1,a2,a3=avg(bp,trl,p1),avg(bp,trl,p2),avg(bp,trl,p3)
        if any(x is None for x in [a1,a2,a3]): return None
        return 100*(4*a1+2*a2+a3)/7

    def _rvi(self, period):
        o,h,l,c=self.opens,self.highs,self.lows,self.closes
        if len(c)<period+3: return None
        nums=[]; dens=[]
        for i in range(3,len(c)):
            n=(c[i]-o[i])+2*(c[i-1]-o[i-1])+2*(c[i-2]-o[i-2])+(c[i-3]-o[i-3])
            d=(h[i]-l[i])+2*(h[i-1]-l[i-1])+2*(h[i-2]-l[i-2])+(h[i-3]-l[i-3])
            nums.append(n/6); dens.append(d/6)
        if len(nums)<period: return None
        n=sum(nums[-period:])/period; d=sum(dens[-period:])/period
        return n/d if d else 0

    def _mfi(self, period):
        h,l,c,v=self.highs,self.lows,self.closes,self.volumes
        if len(c)<period+1: return None
        tp=[(h[i]+l[i]+c[i])/3 for i in range(len(c))]
        pf=nf=0.0
        for i in range(-period,0):
            mf=tp[i]*v[i]
            if tp[i]>tp[i-1]: pf+=mf
            elif tp[i]<tp[i-1]: nf+=mf
        if nf==0: return 100.0
        return 100.0-100.0/(1.0+pf/nf)

    def _cmf(self, period):
        h,l,c,v=self.highs,self.lows,self.closes,self.volumes
        if len(c)<period: return None
        mfv=vs=0.0
        for i in range(-period,0):
            hl=h[i]-l[i]; mfm=((c[i]-l[i])-(h[i]-c[i]))/hl if hl else 0
            mfv+=mfm*v[i]; vs+=v[i]
        return mfv/vs if vs else 0

    def _adx(self, period):
        h,l,c=self.highs,self.lows,self.closes
        if len(c)<period+1: return None
        pdm=[]; mdm=[]; trs=[]
        for i in range(1,len(c)):
            up=h[i]-h[i-1]; down=l[i-1]-l[i]
            pdm.append(max(up,0) if up>down else 0); mdm.append(max(down,0) if down>up else 0)
            trs.append(true_range(h[i],l[i],c[i-1]))
        if len(trs)<period: return None
        atv=sum(trs[:period])/period; pd=sum(pdm[:period])/period; md=sum(mdm[:period])/period
        for i in range(period,len(trs)):
            atv=(atv*(period-1)+trs[i])/period; pd=(pd*(period-1)+pdm[i])/period; md=(md*(period-1)+mdm[i])/period
        if atv==0: return None
        pdi=pd/atv*100; mdi=md/atv*100
        dx=abs(pdi-mdi)/(pdi+mdi)*100 if pdi+mdi>0 else 0
        return {"adx":dx,"plus_di":pdi,"minus_di":mdi}

    def _parabolic_sar(self, af_s=0.02, af_step=0.02, af_max=0.2):
        h,l=self.highs,self.lows
        if len(h)<3: return None
        bull=True; sar=l[0]; ep=h[0]; af=af_s
        for i in range(1,len(h)):
            ps=sar; sar=ps+af*(ep-ps)
            if bull:
                sar=min(sar,l[i-1]); sar=min(sar,l[i-2]) if i>=2 else sar
                if h[i]>ep: ep=h[i]; af=min(af+af_step,af_max)
                if l[i]<sar: bull=False; sar=ep; ep=l[i]; af=af_s
            else:
                sar=max(sar,h[i-1]); sar=max(sar,h[i-2]) if i>=2 else sar
                if l[i]<ep: ep=l[i]; af=min(af+af_step,af_max)
                if h[i]>sar: bull=True; sar=ep; ep=h[i]; af=af_s
        return sar

    def _mass_index(self, period):
        h,l=self.highs,self.lows
        if len(h)<period+18: return None
        hl=[h[i]-l[i] for i in range(len(h))]
        s1=[x for x in ema_series(hl,9) if x is not None]
        s2=[x for x in ema_series(s1,9) if x is not None] if len(s1)>=9 else []
        if len(s1)<period or len(s2)<period: return None
        return sum(a/b for a,b in zip(s1[-period:],s2[-period:]) if b!=0)

    # ---- Main entry ----
    def compute_all(self):
        r = OrderedDict()
        r["trend"]=self.compute_trend(); r["momentum"]=self.compute_momentum()
        r["volatility"]=self.compute_volatility(); r["volume"]=self.compute_volume()
        r["custom"]=self.compute_custom()
        r["patterns"]=self.compute_patterns()
        r["divergence"]=self.compute_divergence()
        r["structure"]=self.compute_structure()
        r["advanced_volatility"]=self.compute_advanced_volatility()
        r["alpha101"]=self.compute_alpha101()
        r["alpha191"]=self.compute_alpha191()
        total=sum(self._cnt(v) for v in r.values() if isinstance(v,dict))
        r["meta"]={"total_indicators":total,"periods_used":self.periods,"candle_count":self.n}
        return r

    def compute_categories(self, cats):
        m={"trend":self.compute_trend,"momentum":self.compute_momentum,"volatility":self.compute_volatility,
           "volume":self.compute_volume,"custom":self.compute_custom,
           "patterns":self.compute_patterns,"divergence":self.compute_divergence,
           "structure":self.compute_structure,"advanced_volatility":self.compute_advanced_volatility,
           "alpha101":self.compute_alpha101,"alpha191":self.compute_alpha191}
        r=OrderedDict()
        for c in cats:
            if c in m: r[c]=m[c]()
        total=sum(self._cnt(v) for v in r.values() if isinstance(v,dict))
        r["meta"]={"total_indicators":total,"categories":cats}
        return r

    def _cnt(self, d, depth=0):
        c=0
        for v in d.values():
            if isinstance(v,dict): c+=self._cnt(v,depth+1)
            elif isinstance(v,list): c+=len(v)
            elif v is not None: c+=1
        return c

    @classmethod
    def list_all(cls):
        return {
            "trend": "SMA/EMA/WMA/DEMA/TEMA/HMA/KAMA x12 + SuperTrend x8 + Ichimoku(5) + SAR + Aroon x4 + ADX x4 + Vortex x4 + DPO x3",
            "momentum": "RSI x12 + Stoch x4 + StochRSI x2 + Williams%R x4 + CCI x4 + ROC x5 + Momentum x8 + MACD x3 + TRIX x3 + KST + UltOsc + RVI x2",
            "volatility": "BB x16 + Keltner x3 + Donchian x4 + ATR/NATR x12 + TR + HistVol x3",
            "volume": "OBV + VWAP + MFI x3 + CMF x3 + A/D + Chaikin + EoM x3 + Force x3 + PVT + VolRatio x4",
            "custom": "HeikinAshi + Pivot x4 + FibRetrace + ElderRay + MassIdx + ConsecCandles + PriceLevels",
            "patterns": "30+ candlestick patterns: Doji(4), Hammer, Hanging Man, Shooting Star, Marubozu, Engulfing, Harami, Piercing, Dark Cloud, Morning/Evening Star, Three Soldiers/Crows, etc.",
            "divergence": "RSI/MACD/OBV regular + hidden divergence detection (bullish & bearish)",
            "structure": "Swing highs/lows, market structure (HH/HL/LH/LL), auto S/R levels, trendlines, price position",
            "advanced_volatility": "Parkinson, Garman-Klass, Yang-Zhang volatility + volatility cone/percentile + regime detection",
            "alpha101": "WorldQuant Alpha#101 ~40 time-series factors (002-101): momentum, mean-reversion, volume-price, volatility-adjusted. CS factors in scan mode.",
            "alpha191": "WorldQuant Alpha#191 ~80 time-series factors (001-191): extended momentum, volume dynamics, price structure, decay-weighted. CS factors in scan mode."
        }


def main():
    parser = argparse.ArgumentParser(description="Extended Indicator Engine")
    parser.add_argument("--candles", help="Path to JSON candle data file")
    parser.add_argument("--mode", choices=["full","category","custom"], default="full")
    parser.add_argument("--categories", help="Comma-separated categories (trend,momentum,volatility,volume,custom,patterns,divergence,structure,advanced_volatility,alpha101,alpha191)")
    parser.add_argument("--indicators", help="Comma-separated indicator names")
    parser.add_argument("--periods", help="Comma-separated periods (default: 5,7,9,10,14,20,21,25,30,50,100,200)")
    parser.add_argument("--output", help="Output JSON file (default: stdout)")
    parser.add_argument("--list", action="store_true", help="List indicators")
    parser.add_argument("--count", action="store_true", help="Show counts")
    args = parser.parse_args()
    if args.list: print(json.dumps(IndicatorEngine.list_all(),indent=2)); return
    if args.count:
        for k,v in IndicatorEngine.list_all().items(): print(f"{k}: {v}")
        return
    if not args.candles: parser.error("--candles required")
    try:
        with open(args.candles) as f:
            content = f.read().strip()
            if not content:
                print(json.dumps({"error":"Candle data file is empty. Check if data fetch succeeded."})); sys.exit(1)
            raw = json.loads(content)
    except FileNotFoundError:
        print(json.dumps({"error":f"Candle data file not found: {args.candles}"})); sys.exit(1)
    except json.JSONDecodeError as e:
        print(json.dumps({"error":f"Invalid JSON in candle data: {str(e)[:200]}"})); sys.exit(1)
    candles = raw.get("data",raw.get("candles",raw)) if isinstance(raw,dict) else raw
    if not candles: print(json.dumps({"error":"No candle data in file. API may have returned empty result."})); sys.exit(1)
    periods = [int(p.strip()) for p in args.periods.split(",")] if args.periods else None
    engine = IndicatorEngine(candles, periods)
    if args.mode=="full": result=engine.compute_all()
    elif args.mode=="category": result=engine.compute_categories([c.strip() for c in (args.categories or "trend").split(",")])
    elif args.mode=="custom":
        all_data=engine.compute_all(); result={}
        if args.indicators:
            names=[n.strip().lower() for n in args.indicators.split(",")]
            for cat,vals in all_data.items():
                if cat=="meta": continue
                if isinstance(vals,dict):
                    for k,v in vals.items():
                        if any(nm in k.lower() for nm in names): result[k]=v
        else: result=all_data
    else: result=engine.compute_all()
    output=json.dumps(result,indent=2,default=str)
    if args.output:
        with open(args.output,"w") as f: f.write(output)
        print(f"Written to {args.output}")
    else: print(output)

if __name__=="__main__": main()
EXT_INDICATORS_ENGINE

# 执行扩展指标引擎
python3 /tmp/kline_ext_indicators.py \
  --candles /tmp/candles_${COIN}_${BAR}.json \
  --mode full \
  --periods "5,7,9,10,14,20,21,25,30,50,100,200" \
  --output /tmp/indicators_${COIN}_${BAR}.json
```

---

### 第 3 步：订单流分析（模式: full / orderflow）

获取订单流数据，写入内置订单流引擎并执行：

```bash
# 获取订单流原始数据
# MCP 首选（直接调用 MCP tool，将结果写入对应文件）:
#   market_get_orderbook(instId="$COIN-USDT", sz="20")           → /tmp/orderbook_${COIN}.json
#   market_get_trades(instId="$COIN-USDT", limit="100")          → /tmp/trades_${COIN}.json
#   market_get_funding_rate(instId="$COIN-USDT-SWAP")            → /tmp/funding_${COIN}.json
#   market_get_open_interest(instType="SWAP", instId="$COIN-USDT-SWAP") → /tmp/oi_${COIN}.json
# CLI 回退:
okx --json market orderbook $COIN-USDT --sz 20 > /tmp/orderbook_${COIN}.json
okx --json market trades $COIN-USDT --limit 100 > /tmp/trades_${COIN}.json
okx --json market funding-rate $COIN-USDT-SWAP > /tmp/funding_${COIN}.json 2>/dev/null || echo '{}' > /tmp/funding_${COIN}.json
okx --json market open-interest --instType SWAP --instId $COIN-USDT-SWAP > /tmp/oi_${COIN}.json 2>/dev/null || echo '{}' > /tmp/oi_${COIN}.json

# 写入订单流分析引擎（heredoc 内置）
cat << 'ORDERFLOW_ENGINE' > /tmp/kline_orderflow.py
#!/usr/bin/env python3
"""
Order Flow Analysis Engine for OKX TradeKit (okx-trade-mcp / okx-trade-cli) K-Line Indicators Skill.
Analyzes orderbook depth, trade flow, funding rate, and open interest
to produce actionable order flow signals with CLI-formatted output.
"""
import json, sys, math, argparse
from datetime import datetime, timezone

class OrderFlowEngine:
    """Order flow analysis engine with multi-dimensional scoring."""

    def __init__(self, orderbook, trades, funding, oi, coin="BTC"):
        self.coin = coin
        self.orderbook = orderbook
        self.trades = trades
        self.funding = funding
        self.oi = oi

    # ── Orderbook Analysis ──────────────────────────────────

    def analyze_orderbook(self):
        """Analyze order book depth, imbalance, spread, and walls."""
        result = {"bid_total": 0, "ask_total": 0, "imbalance": 0,
                  "spread": 0, "spread_pct": 0, "mid_price": 0,
                  "best_bid": 0, "best_ask": 0,
                  "depth_01": {"bid": 0, "ask": 0},
                  "depth_05": {"bid": 0, "ask": 0},
                  "depth_10": {"bid": 0, "ask": 0},
                  "bid_walls": [], "ask_walls": [],
                  "large_bids": [], "large_asks": []}

        bids = self._extract_levels(self.orderbook, "bids")
        asks = self._extract_levels(self.orderbook, "asks")
        if not bids or not asks:
            return result

        # Best bid/ask and spread
        best_bid = bids[0][0]
        best_ask = asks[0][0]
        mid_price = (best_bid + best_ask) / 2
        spread = best_ask - best_bid
        spread_pct = (spread / mid_price * 100) if mid_price > 0 else 0

        result["best_bid"] = best_bid
        result["best_ask"] = best_ask
        result["mid_price"] = mid_price
        result["spread"] = spread
        result["spread_pct"] = round(spread_pct, 4)

        # Total volume
        bid_total = sum(qty for _, qty in bids)
        ask_total = sum(qty for _, qty in asks)
        result["bid_total"] = round(bid_total, 4)
        result["ask_total"] = round(ask_total, 4)
        result["imbalance"] = round(bid_total / ask_total, 4) if ask_total > 0 else 0

        # Depth at percentage levels
        for pct_key, pct_val in [("depth_01", 0.001), ("depth_05", 0.005), ("depth_10", 0.01)]:
            bid_depth = sum(qty for p, qty in bids if p >= mid_price * (1 - pct_val))
            ask_depth = sum(qty for p, qty in asks if p <= mid_price * (1 + pct_val))
            result[pct_key] = {"bid": round(bid_depth, 4), "ask": round(ask_depth, 4)}

        # Large order / wall detection
        if bids:
            avg_bid_qty = bid_total / len(bids)
            for price, qty in bids:
                if qty > avg_bid_qty * 3:
                    result["large_bids"].append({"price": price, "qty": round(qty, 4), "ratio": round(qty / avg_bid_qty, 1)})
            # Top 3 bid walls (densest regions)
            result["bid_walls"] = sorted(result["large_bids"], key=lambda x: -x["qty"])[:3]

        if asks:
            avg_ask_qty = ask_total / len(asks)
            for price, qty in asks:
                if qty > avg_ask_qty * 3:
                    result["large_asks"].append({"price": price, "qty": round(qty, 4), "ratio": round(qty / avg_ask_qty, 1)})
            result["ask_walls"] = sorted(result["large_asks"], key=lambda x: -x["qty"])[:3]

        return result

    def _extract_levels(self, data, side):
        """Extract price levels from orderbook data."""
        levels = []
        raw = None
        if isinstance(data, dict):
            raw = data.get("data", data).get(side) if isinstance(data.get("data"), dict) else data.get(side)
            if raw is None and isinstance(data.get("data"), list) and data["data"]:
                raw = data["data"][0].get(side)
        if isinstance(data, list) and data:
            raw = data[0].get(side)
        if not raw:
            return levels
        for item in raw:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                try:
                    levels.append((float(item[0]), float(item[1])))
                except (ValueError, TypeError):
                    continue
        return levels

    # ── Trade Flow Analysis ─────────────────────────────────

    def analyze_trades(self):
        """Analyze recent trades for delta, CVD, aggression, and large orders."""
        result = {"buy_vol": 0, "sell_vol": 0, "delta": 0, "cvd": 0,
                  "buy_count": 0, "sell_count": 0, "total_count": 0,
                  "aggressor_ratio": 0, "trade_speed": 0,
                  "large_trades": [], "avg_trade_size": 0,
                  "vwap": 0, "last_price": 0}

        trades = self._extract_trades(self.trades)
        if not trades:
            return result

        total_count = len(trades)
        buy_vol = 0
        sell_vol = 0
        buy_count = 0
        sell_count = 0
        price_vol_sum = 0
        vol_sum = 0
        sizes = []

        for t in trades:
            price = t["price"]
            qty = t["qty"]
            side = t["side"]
            sizes.append(qty)
            price_vol_sum += price * qty
            vol_sum += qty
            if side == "buy":
                buy_vol += qty * price
                buy_count += 1
            else:
                sell_vol += qty * price
                sell_count += 1

        delta = buy_vol - sell_vol
        cvd = delta  # single snapshot CVD
        aggressor_ratio = (buy_count / total_count * 100) if total_count > 0 else 50
        vwap = (price_vol_sum / vol_sum) if vol_sum > 0 else 0

        result["buy_vol"] = round(buy_vol, 2)
        result["sell_vol"] = round(sell_vol, 2)
        result["delta"] = round(delta, 2)
        result["cvd"] = round(cvd, 2)
        result["buy_count"] = buy_count
        result["sell_count"] = sell_count
        result["total_count"] = total_count
        result["aggressor_ratio"] = round(aggressor_ratio, 2)
        result["vwap"] = round(vwap, 2)
        result["last_price"] = trades[-1]["price"] if trades else 0

        # Trade speed (trades per second)
        if len(trades) >= 2:
            ts_first = trades[0].get("ts", 0)
            ts_last = trades[-1].get("ts", 0)
            duration = abs(ts_last - ts_first) / 1000  # ms to seconds
            result["trade_speed"] = round(total_count / duration, 2) if duration > 0 else 0

        # Average and large trade detection
        avg_size = vol_sum / total_count if total_count > 0 else 0
        result["avg_trade_size"] = round(avg_size, 6)
        median_size = sorted(sizes)[len(sizes) // 2] if sizes else 0
        threshold = median_size * 5 if median_size > 0 else avg_size * 3
        for t in trades:
            if t["qty"] > threshold and threshold > 0:
                result["large_trades"].append({
                    "price": t["price"], "qty": round(t["qty"], 6),
                    "side": t["side"],
                    "ratio": round(t["qty"] / median_size, 1) if median_size > 0 else 0
                })

        return result

    def _extract_trades(self, data):
        """Extract trade records from trades API response."""
        trades = []
        raw = None
        if isinstance(data, dict):
            raw = data.get("data", [])
        elif isinstance(data, list):
            raw = data
        if not raw:
            return trades
        for item in raw:
            if not isinstance(item, dict):
                continue
            try:
                price = float(item.get("px", item.get("price", 0)))
                qty = float(item.get("sz", item.get("qty", item.get("size", 0))))
                side_raw = str(item.get("side", "")).lower()
                side = "buy" if side_raw == "buy" else "sell"
                ts = int(item.get("ts", 0))
                if price > 0 and qty > 0:
                    trades.append({"price": price, "qty": qty, "side": side, "ts": ts})
            except (ValueError, TypeError):
                continue
        return trades

    # ── Funding & OI Analysis ───────────────────────────────

    def analyze_funding(self):
        """Analyze funding rate data."""
        result = {"funding_rate": None, "funding_time": None, "annual_rate": None, "sentiment": "neutral"}
        raw = self.funding
        if isinstance(raw, dict):
            data = raw.get("data", [raw])
        elif isinstance(raw, list):
            data = raw
        else:
            return result
        if not data:
            return result
        item = data[0] if isinstance(data, list) else data
        try:
            rate = float(item.get("fundingRate", item.get("funding_rate", 0)))
            result["funding_rate"] = round(rate * 100, 4)  # percentage
            result["annual_rate"] = round(rate * 3 * 365 * 100, 2)  # annualized %
            ts = item.get("fundingTime", item.get("ts", ""))
            if ts:
                result["funding_time"] = ts
            if rate > 0.0005:
                result["sentiment"] = "bullish_crowd"
            elif rate < -0.0005:
                result["sentiment"] = "bearish_crowd"
            else:
                result["sentiment"] = "neutral"
        except (ValueError, TypeError):
            pass
        return result

    def analyze_open_interest(self):
        """Analyze open interest data."""
        result = {"oi": None, "oi_usd": None, "ts": None}
        raw = self.oi
        if isinstance(raw, dict):
            data = raw.get("data", [raw])
        elif isinstance(raw, list):
            data = raw
        else:
            return result
        if not data:
            return result
        item = data[0] if isinstance(data, list) else data
        try:
            oi = float(item.get("oi", item.get("oiCcy", 0)))
            result["oi"] = round(oi, 4)
            oi_usd_val = item.get("oiUsd")
            if oi_usd_val:
                result["oi_usd"] = round(float(oi_usd_val), 2)
            result["ts"] = item.get("ts", "")
        except (ValueError, TypeError):
            pass
        return result

    # ── Scoring Engine ──────────────────────────────────────

    def compute_score(self, ob, tf, fr, oi_data):
        """Compute composite order flow score (0-100)."""
        score = 50  # neutral baseline
        signals = []

        # Orderbook imbalance
        if ob["imbalance"] > 1.3:
            score += 8; signals.append(("bid_dominance", "+8", f"imbalance={ob['imbalance']:.2f}"))
        elif ob["imbalance"] > 1.1:
            score += 4; signals.append(("bid_lean", "+4", f"imbalance={ob['imbalance']:.2f}"))
        elif ob["imbalance"] < 0.7:
            score -= 8; signals.append(("ask_dominance", "-8", f"imbalance={ob['imbalance']:.2f}"))
        elif ob["imbalance"] < 0.9:
            score -= 4; signals.append(("ask_lean", "-4", f"imbalance={ob['imbalance']:.2f}"))

        # Spread tightness (tight = good liquidity)
        if ob["spread_pct"] < 0.01:
            score += 2; signals.append(("tight_spread", "+2", f"{ob['spread_pct']:.4f}%"))

        # Trade delta
        if tf["delta"] > 0:
            delta_strength = min(10, int(abs(tf["delta"]) / (max(tf["buy_vol"], tf["sell_vol"], 1)) * 20))
            score += delta_strength
            signals.append(("positive_delta", f"+{delta_strength}", f"${tf['delta']:,.0f}"))
        elif tf["delta"] < 0:
            delta_strength = min(10, int(abs(tf["delta"]) / (max(tf["buy_vol"], tf["sell_vol"], 1)) * 20))
            score -= delta_strength
            signals.append(("negative_delta", f"-{delta_strength}", f"${tf['delta']:,.0f}"))

        # Aggressor ratio
        if tf["aggressor_ratio"] > 60:
            score += 6; signals.append(("strong_buyers", "+6", f"{tf['aggressor_ratio']:.1f}%"))
        elif tf["aggressor_ratio"] > 55:
            score += 3; signals.append(("lean_buyers", "+3", f"{tf['aggressor_ratio']:.1f}%"))
        elif tf["aggressor_ratio"] < 40:
            score -= 6; signals.append(("strong_sellers", "-6", f"{tf['aggressor_ratio']:.1f}%"))
        elif tf["aggressor_ratio"] < 45:
            score -= 3; signals.append(("lean_sellers", "-3", f"{tf['aggressor_ratio']:.1f}%"))

        # Funding rate (contrarian)
        if fr["funding_rate"] is not None:
            rate = fr["funding_rate"]
            if rate < -0.01:
                score += 5; signals.append(("negative_funding", "+5", f"{rate:.4f}%"))
            elif rate > 0.05:
                score -= 5; signals.append(("high_funding", "-5", f"{rate:.4f}%"))

        # Bid/Ask walls
        if ob["bid_walls"] and not ob["ask_walls"]:
            score += 3; signals.append(("bid_walls_only", "+3", f"{len(ob['bid_walls'])} walls"))
        elif ob["ask_walls"] and not ob["bid_walls"]:
            score -= 3; signals.append(("ask_walls_only", "-3", f"{len(ob['ask_walls'])} walls"))

        score = max(0, min(100, score))
        if score >= 70:
            verdict = "strong_buy"
        elif score >= 58:
            verdict = "buy"
        elif score >= 42:
            verdict = "neutral"
        elif score >= 30:
            verdict = "sell"
        else:
            verdict = "strong_sell"

        return {"score": score, "verdict": verdict, "signals": signals}

    # ── CLI Output Formatter ────────────────────────────────

    def format_cli_output(self, ob, tf, fr, oi_data, scoring):
        """Format analysis results for CLI terminal output."""
        lines = []
        w = 56  # box width

        # Header
        lines.append("=" * w)
        lines.append(f"  {self.coin}-USDT Order Flow Analysis".center(w))
        lines.append(f"  {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}".center(w))
        lines.append("=" * w)

        # Score bar
        score = scoring["score"]
        verdict_map = {"strong_buy": "STRONG BUY", "buy": "BUY",
                       "neutral": "NEUTRAL", "sell": "SELL", "strong_sell": "STRONG SELL"}
        verdict_cn = {"strong_buy": "Strong Buy", "buy": "Buy",
                      "neutral": "Neutral", "sell": "Sell", "strong_sell": "Strong Sell"}
        verdict = verdict_map.get(scoring["verdict"], "NEUTRAL")
        bar_len = 30
        filled = int(score / 100 * bar_len)
        bar = "[" + "#" * filled + "-" * (bar_len - filled) + "]"
        lines.append(f"\n  Score: {score}/100  {bar}  {verdict}")

        # Orderbook section
        lines.append(f"\n{'─' * w}")
        lines.append("  [Orderbook Depth]")
        lines.append(f"  Best Bid: ${ob['best_bid']:,.2f}  |  Best Ask: ${ob['best_ask']:,.2f}")
        lines.append(f"  Mid Price: ${ob['mid_price']:,.2f}  |  Spread: ${ob['spread']:,.2f} ({ob['spread_pct']:.4f}%)")
        lines.append(f"  Bid Total: {ob['bid_total']:,.4f}  |  Ask Total: {ob['ask_total']:,.4f}")
        imb = ob["imbalance"]
        imb_label = "BID > ASK" if imb > 1.05 else ("ASK > BID" if imb < 0.95 else "BALANCED")
        lines.append(f"  Imbalance Ratio: {imb:.4f}  ({imb_label})")

        # Depth levels
        lines.append(f"\n  Depth Levels (from mid):")
        for label, key in [("0.1%", "depth_01"), ("0.5%", "depth_05"), ("1.0%", "depth_10")]:
            d = ob[key]
            lines.append(f"    {label}: Bid={d['bid']:,.4f}  Ask={d['ask']:,.4f}")

        # Walls
        if ob["bid_walls"]:
            lines.append(f"\n  Bid Walls (support):")
            for wall in ob["bid_walls"][:3]:
                lines.append(f"    ${wall['price']:,.2f}  qty={wall['qty']:,.4f}  ({wall['ratio']:.1f}x avg)")
        if ob["ask_walls"]:
            lines.append(f"  Ask Walls (resistance):")
            for wall in ob["ask_walls"][:3]:
                lines.append(f"    ${wall['price']:,.2f}  qty={wall['qty']:,.4f}  ({wall['ratio']:.1f}x avg)")

        # Trade flow section
        lines.append(f"\n{'─' * w}")
        lines.append("  [Trade Flow]")
        lines.append(f"  Buy Volume:  ${tf['buy_vol']:>12,.2f}  ({tf['buy_count']} trades)")
        lines.append(f"  Sell Volume: ${tf['sell_vol']:>12,.2f}  ({tf['sell_count']} trades)")
        delta_sign = "+" if tf["delta"] >= 0 else ""
        lines.append(f"  Delta:       ${delta_sign}{tf['delta']:>11,.2f}  {'(net buying)' if tf['delta'] > 0 else '(net selling)' if tf['delta'] < 0 else '(balanced)'}")
        lines.append(f"  Aggressor:   {tf['aggressor_ratio']:>6.1f}% buyers  |  {100 - tf['aggressor_ratio']:.1f}% sellers")
        if tf["trade_speed"] > 0:
            lines.append(f"  Trade Speed: {tf['trade_speed']:.1f} trades/sec")
        if tf["vwap"] > 0:
            lines.append(f"  Trade VWAP:  ${tf['vwap']:,.2f}")

        # Large trades
        if tf["large_trades"]:
            lines.append(f"\n  Large Trades ({len(tf['large_trades'])} detected):")
            for lt in tf["large_trades"][:5]:
                side_icon = "B" if lt["side"] == "buy" else "S"
                lines.append(f"    [{side_icon}] ${lt['price']:,.2f}  qty={lt['qty']:.6f}  ({lt['ratio']:.1f}x median)")

        # Funding & OI section
        lines.append(f"\n{'─' * w}")
        lines.append("  [Derivatives]")
        if fr["funding_rate"] is not None:
            fr_label = "Long pay Short" if fr["funding_rate"] > 0 else "Short pay Long" if fr["funding_rate"] < 0 else "Neutral"
            lines.append(f"  Funding Rate: {fr['funding_rate']:.4f}%  ({fr_label})")
            if fr["annual_rate"] is not None:
                lines.append(f"  Annualized:   {fr['annual_rate']:.2f}%")
            lines.append(f"  Crowd Sentiment: {fr['sentiment'].replace('_', ' ').title()}")
        else:
            lines.append("  Funding Rate: N/A (spot only or data unavailable)")

        if oi_data["oi"] is not None:
            lines.append(f"  Open Interest: {oi_data['oi']:,.4f} {self.coin}")
            if oi_data["oi_usd"]:
                lines.append(f"  OI (USD):      ${oi_data['oi_usd']:,.2f}")
        else:
            lines.append("  Open Interest: N/A")

        # Scoring breakdown
        lines.append(f"\n{'─' * w}")
        lines.append("  [Signal Breakdown]")
        for sig_name, sig_val, sig_detail in scoring["signals"]:
            name_display = sig_name.replace("_", " ").title()
            lines.append(f"    {sig_val:>4}  {name_display:<24} {sig_detail}")

        # Summary
        lines.append(f"\n{'=' * w}")
        lines.append(f"  VERDICT: {verdict}  (Score: {score}/100)")
        if score >= 58:
            lines.append(f"  Order flow is bullish - net buying pressure detected")
        elif score <= 42:
            lines.append(f"  Order flow is bearish - net selling pressure detected")
        else:
            lines.append(f"  Order flow is mixed - no clear directional bias")
        lines.append("=" * w)

        return "\n".join(lines)

    # ── Run All ─────────────────────────────────────────────

    def run(self):
        """Run full order flow analysis and return results dict + CLI output."""
        ob = self.analyze_orderbook()
        tf = self.analyze_trades()
        fr = self.analyze_funding()
        oi_data = self.analyze_open_interest()
        scoring = self.compute_score(ob, tf, fr, oi_data)
        cli_output = self.format_cli_output(ob, tf, fr, oi_data, scoring)

        return {
            "orderbook": ob,
            "trade_flow": tf,
            "funding": fr,
            "open_interest": oi_data,
            "scoring": scoring,
            "cli_output": cli_output
        }


def _load_json(path):
    """Safely load JSON from file."""
    try:
        with open(path) as f:
            content = f.read().strip()
            if not content:
                return {}
            return json.loads(content)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Order Flow Analysis Engine")
    parser.add_argument("--orderbook", required=True, help="Path to orderbook JSON")
    parser.add_argument("--trades", required=True, help="Path to trades JSON")
    parser.add_argument("--funding", default=None, help="Path to funding rate JSON")
    parser.add_argument("--oi", default=None, help="Path to open interest JSON")
    parser.add_argument("--coin", default="BTC", help="Coin symbol")
    parser.add_argument("--output", default=None, help="Output JSON path")
    args = parser.parse_args()

    orderbook = _load_json(args.orderbook)
    trades = _load_json(args.trades)
    funding = _load_json(args.funding) if args.funding else {}
    oi = _load_json(args.oi) if args.oi else {}

    if not orderbook and not trades:
        print("Error: Both orderbook and trades data are empty. Check okx command and API responses.")
        sys.exit(1)

    engine = OrderFlowEngine(orderbook, trades, funding, oi, coin=args.coin)
    result = engine.run()

    # Print CLI formatted output to terminal
    print(result["cli_output"])

    # Save full JSON result if output path specified
    if args.output:
        json_result = {k: v for k, v in result.items() if k != "cli_output"}
        with open(args.output, "w") as f:
            json.dump(json_result, f, indent=2, default=str)
ORDERFLOW_ENGINE

# 执行订单流分析引擎
python3 /tmp/kline_orderflow.py \
  --orderbook /tmp/orderbook_${COIN}.json \
  --trades /tmp/trades_${COIN}.json \
  --funding /tmp/funding_${COIN}.json \
  --oi /tmp/oi_${COIN}.json \
  --coin $COIN \
  --output /tmp/orderflow_${COIN}.json
```

**CLI 输出示例：**
```
========================================================
       BTC-USDT Order Flow Analysis
       2026-03-10 08:30:00 UTC
========================================================

  Score: 72/100  [#####################---------]  BUY

────────────────────────────────────────────────────────
  [Orderbook Depth]
  Best Bid: $67,498.50  |  Best Ask: $67,499.00
  Mid Price: $67,498.75  |  Spread: $0.50 (0.0007%)
  Bid Total: 12.3456  |  Ask Total: 9.1234
  Imbalance Ratio: 1.3533  (BID > ASK)

  Depth Levels (from mid):
    0.1%: Bid=3.2100  Ask=2.1500
    0.5%: Bid=8.5600  Ask=6.3200
    1.0%: Bid=12.3456  Ask=9.1234

  Bid Walls (support):
    $67,200.00  qty=2.5000  (5.2x avg)
    $67,000.00  qty=1.8000  (3.8x avg)

────────────────────────────────────────────────────────
  [Trade Flow]
  Buy Volume:  $  2,534,000.00  (62 trades)
  Sell Volume: $  1,890,000.00  (38 trades)
  Delta:       $   +644,000.00  (net buying)
  Aggressor:    62.0% buyers  |  38.0% sellers
  Trade Speed: 1.2 trades/sec
  Trade VWAP:  $67,480.50

────────────────────────────────────────────────────────
  [Derivatives]
  Funding Rate: 0.0080%  (Long pay Short)
  Annualized:   8.76%
  Crowd Sentiment: Neutral
  Open Interest: 45,231.5000 BTC
  OI (USD):      $3,052,125,750.00

────────────────────────────────────────────────────────
  [Signal Breakdown]
      +8  Bid Dominance            imbalance=1.35
      +2  Tight Spread             0.0007%
      +6  Strong Buyers            62.0%
      +6  Positive Delta           $644,000

========================================================
  VERDICT: BUY  (Score: 72/100)
  Order flow is bullish - net buying pressure detected
========================================================
```

---

### 第 4A 步：宏观周期分析 — 支柱 1（模式: full / macro）

评估当前 BTC 周期位置和宏观市场环境。回答：**"我们在周期的什么位置？"**

#### 4A.1 数据获取

```bash
# ── 外部 API ──
# 恐贪指数
curl -s https://api.alternative.me/fng/ > ${TMP}/okx_fng.json 2>/dev/null || echo '{}' > ${TMP}/okx_fng.json

# BTC 主导率 + 全球加密市场数据
curl -s https://api.coingecko.com/api/v3/global > ${TMP}/okx_global.json 2>/dev/null || echo '{}' > ${TMP}/okx_global.json

# MVRV（CoinMetrics 社区 API，无需 Key）
curl -s 'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=CapMVRVCur&page_size=1' > ${TMP}/okx_mvrv.json 2>/dev/null || echo '{}' > ${TMP}/okx_mvrv.json

# ETF 净流入（需要 COINGLASS_API_KEY 环境变量）
if [ -n "$COINGLASS_API_KEY" ]; then
  curl -s 'https://open-api-v3.coinglass.com/api/etf/' -H "coinglassSecret: $COINGLASS_API_KEY" > ${TMP}/okx_etf.json 2>/dev/null || echo '{}' > ${TMP}/okx_etf.json
else
  echo '{}' > ${TMP}/okx_etf.json
fi

# ── OKX 原生数据（MCP 首选，CLI 回退） ──
# MCP: market_get_funding_rate(instId="$COIN-USDT-SWAP") → ${TMP}/okx_macro_funding.json
# CLI 回退:
# 资金费率（当前）
okx --json market funding-rate $COIN-USDT-SWAP > ${TMP}/okx_macro_funding.json 2>/dev/null || echo '{}' > ${TMP}/okx_macro_funding.json

# 资金费率历史（50 期趋势）— 仅 CLI 支持 --history 参数
okx --json market funding-rate $COIN-USDT-SWAP --history --limit 50 > ${TMP}/okx_macro_funding_hist.json 2>/dev/null || echo '{}' > ${TMP}/okx_macro_funding_hist.json

# MCP: market_get_open_interest(instType="SWAP", instId="$COIN-USDT-SWAP") → ${TMP}/okx_macro_oi.json
# CLI 回退:
okx --json market open-interest --instType SWAP --instId $COIN-USDT-SWAP > ${TMP}/okx_macro_oi.json 2>/dev/null || echo '{}' > ${TMP}/okx_macro_oi.json

# MCP: market_get_tickers(instType="SPOT") → ${TMP}/okx_tickers.json
# CLI 回退:
okx --json market tickers SPOT > ${TMP}/okx_tickers.json 2>/dev/null
# 用 Python 从 tickers 中排序提取 Top 20 gainers，保存到 ${TMP}/okx_hot.json

# 多币种对比（板块轮动）
# MCP: 对每个 INST 调用 market_get_candles(instId=INST, bar="1D", limit="30")
# CLI 回退:
for INST in $COIN-USDT ETH-USDT SOL-USDT; do
  okx --json market candles $INST --bar 1D --limit 30 > ${TMP}/okx_compare_${INST}.json
done
# 对齐时间戳后计算相对涨跌幅，保存到 ${TMP}/okx_compare.json

# BTC 日线历史（用于 Rainbow / AHR999 自算）
# MCP: market_get_candles(instId="BTC-USDT", bar="1D", limit="300") → ${TMP}/okx_btc_daily.json
# CLI 回退:
okx --json market candles BTC-USDT --bar 1D --limit 300 > ${TMP}/okx_btc_daily.json 2>/dev/null || echo '{}' > ${TMP}/okx_btc_daily.json
```

#### 4A.2 九大宏观指标

| # | 指标 | 含义 | 信号区间 | 数据源 |
|---|------|------|---------|--------|
| 1 | **Rainbow Chart** | 对数回归带 (1-9) 映射 BTC 到周期阶段 | Band <= 3 累积区; >= 7 派发区 | BTC 日线自算（Python 对数回归） |
| 2 | **AHR999 指数** | BTC 便宜度 = (价格/200日均线) × (价格/增长拟合值) | < 0.45 抄底; 0.45-1.2 定投; > 1.2 等待; > 4.0 过热 | BTC 日线自算 |
| 3 | **MVRV 比率** | 市值 / 已实现市值 | < 1.0 投降; 1.0-2.0 累积; 2.0-3.5 热度上升; > 3.5 狂热 | CoinMetrics API |
| 4 | **恐贪指数** | 复合情绪指标 (0-100) | <= 25 极度恐惧(反向做多); >= 75 极度贪婪(反向做空) | alternative.me API |
| 5 | **BTC 主导率** | BTC 市值占总加密市值 % | > 60% BTC 季; 50-60% 过渡; < 45% 山寨季 | CoinGecko Global API |
| 6 | **BTC/GDP 比率** | BTC 网络价值 / 美国年度 GDP | 长期上升 = 货币化溢价增加 | CoinGecko + FRED |
| 7 | **ETF 净流入** | 美国 BTC 现货 ETF 日净流入/流出 | 持续净流入 = 机构累积; 净流出 = 派发压力 | CoinGlass API (需 Key) |
| 8 | **CAPE 比率** | 周期调整市盈率（标普500） | > 30 股市贵→利好加密轮动; < 15 股市便宜→资金可能流出加密 | FRED/Shiller |
| 9 | **巴菲特指标** | 股市总市值 / GDP | > 140% 极度高估 risk-off; < 100% + 宽松 = risk-on 利好加密 | FRED + CoinGecko |

**Rainbow Chart 自算公式：**
```
band = floor((ln(price) - ln(regression_fit)) / band_width) + 5
# regression_fit 从 BTC 创世区块至今的对数线性回归
# 使用 MCP market_get_candles 或 CLI okx --json market candles BTC-USDT --bar 1D --limit 300 获取历史数据
# Bands: 1=Fire Sale / 2=BUY! / 3=Accumulate / 4=Still Cheap / 5=Hold /
#        6=Is this a bubble? / 7=FOMO / 8=Sell / 9=Maximum Bubble
```

**AHR999 自算公式：**
```
AHR999 = (price / 200D_SMA) * (price / fitted_growth_value)
# 200D_SMA = 200 日简单移动平均（代理持有者平均成本）
# fitted_growth_value = 10^(a * days_since_genesis + b)  （创世区块至今的对数线性回归）
```

#### 4A.3 宏观综合评分（支柱 1 评分）

加权计算各指标到 0-100 评分，然后分类到周期阶段：

- **累积期** (评分 < 30): Rainbow <= 3 + AHR999 < 1.2 + MVRV < 2.0 + 恐惧 < 30 + 巴菲特 < 100%
- **成长期** (30-60): 各指标向上过渡, CAPE 适中, ETF 持续流入
- **狂热期** (60-80): Rainbow >= 6 + MVRV > 3.0 + 贪婪 > 70 + CAPE > 30 + 巴菲特 > 140%
- **派发期** (> 80): 多个顶部信号同时出现, ETF 流出 + 高 CAPE

**优雅降级**：外部 API 调用如失败（无 API Key、限频等），标记为 N/A 并跳过该指标，使用可用指标子集计算宏观评分，自动调整权重。

---

### 第 4B 步：衍生品深度分析 — 支柱 3（模式: full / macro / orderflow）

专业级衍生品市场结构指标。回答：**"聪明钱/衍生品市场定价了什么？"**

#### 4B.1 数据获取

```bash
# ── 现货 vs 合约价格（基差计算） ──
# MCP 首选:
#   market_get_ticker(instId="$COIN-USDT")         → ${TMP}/okx_spot_ticker.json
#   market_get_ticker(instId="$COIN-USDT-SWAP")    → ${TMP}/okx_swap_ticker.json
#   market_get_mark_price(instType="SWAP", instId="$COIN-USDT-SWAP") → ${TMP}/okx_mark_price.json
# CLI 回退:
okx --json market ticker $COIN-USDT > ${TMP}/okx_spot_ticker.json 2>/dev/null || echo '{}' > ${TMP}/okx_spot_ticker.json
okx --json market ticker $COIN-USDT-SWAP > ${TMP}/okx_swap_ticker.json 2>/dev/null || echo '{}' > ${TMP}/okx_swap_ticker.json

# Mark Price — MCP market_get_mark_price 或 OKX REST API
curl -s "https://www.okx.com/api/v5/public/mark-price?instType=SWAP&instId=${COIN}-USDT-SWAP" > ${TMP}/okx_mark_price.json 2>/dev/null || echo '{}' > ${TMP}/okx_mark_price.json

# ── DVOL — Deribit 波动率指数（加密 VIX） ──
curl -s 'https://www.deribit.com/api/v2/public/get_volatility_index_data?currency=BTC&resolution=3600' > ${TMP}/okx_dvol.json 2>/dev/null || echo '{}' > ${TMP}/okx_dvol.json

# ── OKX Rubik 数据 ──
# 多空账户比
curl -s "https://www.okx.com/api/v5/rubik/stat/contracts-long-short-account-ratio?instId=${COIN}-USDT-SWAP" > ${TMP}/okx_ls_ratio.json 2>/dev/null || echo '{}' > ${TMP}/okx_ls_ratio.json

# 主动买卖量
curl -s "https://www.okx.com/api/v5/rubik/stat/taker-volume?instId=${COIN}-USDT-SWAP" > ${TMP}/okx_taker_vol.json 2>/dev/null || echo '{}' > ${TMP}/okx_taker_vol.json

# ── 爆仓数据（需要 COINGLASS_API_KEY） ──
if [ -n "$COINGLASS_API_KEY" ]; then
  curl -s "https://open-api-v3.coinglass.com/api/futures/liquidation/chart?symbol=${COIN}" -H "coinglassSecret: $COINGLASS_API_KEY" > ${TMP}/okx_liq.json 2>/dev/null || echo '{}' > ${TMP}/okx_liq.json
fi
```

#### 4B.2 衍生品指标

| # | 指标 | 含义 | 信号 |
|---|------|------|------|
| 1 | **资金费率分析** | 多空支付费率 + 年化 + 趋势(3期方向) | \|rate\| > 0.01% 偏高; \|rate\| > 0.03% 极端; 高正费率 = 反向看空 |
| 2 | **基差 & Carry** | 现货-合约价差年化收益 | 年化 > 20% 杠杆过热; < 0% (反向) 恐慌底部 |
| 3 | **DVOL (Deribit 波动率指数)** | 30日隐含波动率（加密 VIX） | < 40 低波(突破在即); 40-70 正常; > 80 高恐慌 |
| 4 | **BVOL (已实现波动率)** | RV_7d/30d/90d + IV/RV 比率 | IV/RV > 1.3 卖波动率; < 0.7 买波动率 |
| 5 | **期权偏斜** | 25-Delta 风险逆转 = IV(25d_call) - IV(25d_put) | < -5% 强看跌偏斜; > +5% 强看涨偏斜 |
| 6 | **持仓量 (OI)** | 绝对值 + 24h 变化 | OI 上升 + 价格上升 = 新多入场; OI 下降 + 价格下降 = 多头平仓 |
| 7 | **多空账户比** | OKX Rubik 多空仓比 | 极端偏多 → 反向看空; 极端偏空 → 反向看多 |
| 8 | **主动买卖量比** | Taker 买/卖成交量对比 | 买方主导 → 看多; 卖方主导 → 看空 |
| 9 | **爆仓热力图** | CoinGlass 多空爆仓分布 | 大量多头爆仓 → 底部信号; 大量空头爆仓 → 顶部信号 |

**基差计算公式：**
```
basis_pct = (swap_price - spot_price) / spot_price * 100
perp_basis = (mark_price - spot_index) / spot_index * 100
annualized_basis = basis_pct / funding_period_hours * 8760  # 年化
```

**BVOL 自算（从K线数据）：**
```
RV_Nd = sqrt(sum(ln(close_i / close_{i-1})^2) / N) * sqrt(365) * 100
IV_RV_ratio = DVOL / RV_30d
# IV/RV > 1.2 → 期权定价偏贵（波动率溢价）
# IV/RV < 0.8 → 期权定价偏低（波动率折价）
```

#### 4B.3 衍生品综合评分（支柱 3 评分）

根据以下因素加权汇总到 0-100：
- 资金费率方向及强度（反向指标，高正费率降分）
- 基差水平（适度正基差加分，极端值减分）
- DVOL 水平及趋势（低波加分，极高波减分）
- IV/RV 比率（接近1.0中性，偏离较大减分）
- 期权偏斜方向（与价格方向一致加分）
- OI 变化与价格变化同向加分
- 多空比极端值（反向信号）
- 爆仓方向（大量多头爆仓后底部信号加分）

**优雅降级**：Deribit API 或 CoinGlass API 不可用时，仅使用 OKX 原生数据（资金费率 + 持仓量 + Rubik），评分公式自动调整权重分配给可用指标。

---

### 第 4C 步：宏观情绪补充数据（模式: full / macro）

通过外部 API 获取情绪数据，补充数据源：
OKX 原生：多空比、主买/主卖比、持仓比
外部数据：CryptoPanic（新闻+投票）、CoinGecko（情绪+动量）

**补充宏观指标计算：**
- 资金费率趋势（当前值 + 50 期均值）
- 持仓量 24h 变化百分比
- 市场广度（Top 20 中看多币种占比）
- BTC 主导率代理（BTC vs 山寨币对比）
- 板块轮动（通过 compare-kline）

---

### 第 5 步：预警条件（模式: alert）

解析用户输入的预警表达式，支持格式：

```
RSI14 < 30                          # 简单阈值
RSI14 < 30 AND MACD_CROSS golden    # 多条件组合
BB_POSITION > 95 OR BB_POSITION < 5 # 或条件
RSI14 CROSS_ABOVE 70                # 交叉检测
MACD DIVERGENCE bearish             # 背离检测
VOLUME_RATIO > 2.0                  # 放量预警
PRICE ABOVE MA50                    # 价格 vs 指标
FUNDING_RATE < -0.01                # 宏观预警
PATTERN engulfing                   # K线形态预警
```

**预警评估流程：**
1. 获取当前指标值（第 1 步）
2. 解析条件为 (指标, 运算符, 值) 元组
3. 逐条评估
4. 输出：已触发 / 未触发，并显示当前值

**持续监控（配合 /loop）：**
```
/loop 5m /kline-indicators alert BTC RSI14 < 30
```

---

### 第 6 步：输出格式

**重要：所有输出必须使用中文。**

#### 快速信号输出（模式: quick）
```
=== BTC-USDT K线信号报告 ===

当前价格: $67,500.00

时间周期  | 信号        | 看多% | 关键因素
----------|------------|-------|---------------------------
5分钟     | 买入        | 62%   | MACD 金叉，RSI 上升
15分钟    | 强烈买入    | 75%   | 均线全部看多，放量
1小时     | 买入        | 58%   | BB 下半部，动量为正
4小时     | 中性        | 52%   | 信号混合
日线      | 买入        | 60%   | 站上 MA50，RSI 健康

综合判断: 买入（置信度: 65%）

关键价位:
- 支撑: $66,000 (MA50), $65,500 (BB 下轨)
- 阻力: $68,500 (BB 上轨), $69,000 (50 根K线最高)
- 止盈1: $68,175 (1.5x ATR) | 止盈2: $68,850 (3x ATR)
- 止损: $66,825 (1.5x ATR 下方)
```

#### 完整分析输出（模式: full）
```
=== BTC-USDT 全量分析报告 ===

【1】趋势指标
    SMA: 5=67100  7=67200  ...  200=62000
    EMA: 5=67150  7=67250  ...  200=62500
    ...（所有趋势指标）
    小结: 75% 看多排列

【2】动量指标
    RSI: 5=65  7=62  14=58  ...（无极端值）
    随机指标: K=72  D=68（中性区间）
    ...
    小结: 偏多

【3】波动率
    BB 带宽: 4.4%（正常）
    ATR14: $450（中等）
    Garman-Klass(20): 45.2%  Parkinson(20): 42.8%  Yang-Zhang(20): 47.1%
    波动率百分位(20): 62%（中等偏高）
    波动率状态: 稳定
    小结: 正常波动环境

【4】成交量
    OBV: 上升，确认涨势
    VWAP: $67,250（价格在上方 = 看多）
    MFI: 62（无背离）
    ...
    小结: 量价配合

【5】K线形态 ⭐新增
    检测到形态:
    ✅ 看涨吞没 (bullish_engulfing) — 可靠度: 高 — 强反转信号
    ✅ 锤子线 (hammer) — 可靠度: 高 — 底部反转信号
    形态评分: 看多 4 / 看空 0 → 净值 +4

【6】背离检测 ⭐新增
    RSI14: ⚠️ 发现底背离（价格创新低但 RSI 未新低）— 5根K线前
    MACD: 无背离
    OBV: ⚠️ 发现隐藏看多背离 — 8根K线前
    背离评分: 看多 2 / 看空 0

【7】支撑阻力 ⭐新增
    市场结构: 上升趋势 (HH, HL, HH, HL)
    最近支撑: $66,200 (强度: 3次触及)
    最近阻力: $68,800 (强度: 2次触及)
    上升趋势线: $66,500（价格在上方 ✓）
    价格位置: 50根K线范围的 72% 处

【8】订单流（内置引擎输出）
    ┌ 直接展示 kline_orderflow.py 的 CLI 格式化输出 ┐
    │ 包含: 盘口深度/挂单墙/Delta/CVD/大单/评分    │
    └ 详见 /tmp/orderflow_${COIN}.json 完整数据      ┘
    综合评分: 72/100（BUY）
    关键信号: 买盘主导(1.35x), Delta +$644K, 主动买62%

【P1】宏观周期分析（支柱 1, 权重 30%）
    Rainbow Chart: Band 5 (Hold) — 周期中段
    AHR999: 1.35 (等待区) — 不便宜
    MVRV: 2.1 (累积→热度上升过渡)
    恐贪指数: 65 (贪婪)
    BTC 主导率: 54.2% (过渡期)
    ETF 净流入: +$125M (机构累积) [如 API Key 不可用则 N/A]
    CAPE (S&P500): 32.5 (偏贵, 中性偏利好加密)
    巴菲特指标: 128% (偏高估)
    宏观评分: 52/100 — 成长期

【9】宏观/情绪（补充数据）
    资金费率趋势: 0.008% (当前) / 0.012% (50期均值) — 正常
    持仓量 24h 变化: +3.2%
    市场广度: Top 20 中 65% 看涨
    BTC vs 山寨相关性: 0.72

【P3】衍生品深度分析（支柱 3, 权重 30%）
    资金费率: 0.008% / 年化 8.76% — 正常
    基差: 永续-现货 = +0.05% / 年化 18.3% — 略偏高
    DVOL: 52.3 — 正常波动环境 [如 Deribit API 不可用则从 BVOL 替代]
    BVOL(RV30d): 48.1% / IV/RV = 1.09 — 期权定价合理
    期权偏斜(25d RR): -1.2% — 轻微看跌偏斜 [如不可用则 N/A]
    持仓量: 45,231 BTC ($3.05B) / 24h +3.2%
    多空比: 1.15 — 偏多头
    主动买卖比: 买方 55.2% — 轻微买方主导
    爆仓热力图: 大量空头爆仓集中在 $72,000 上方 [如 CoinGlass 不可用则 N/A]
    衍生品评分: 58/100 — 中性偏多

【10】综合信号 — 三支柱评分
    ┌────────────────────────────────────────────┐
    │ 支柱 1 宏观周期:  52/100 × 30% = 15.6     │
    │ 支柱 2 量价因子:  72/100 × 40% = 28.8     │
    │   技术: 72  形态: +4  背离: +2  结构: 上升  │
    │   订单流: 68                                │
    │ 支柱 3 衍生品:    58/100 × 30% = 17.4     │
    ├────────────────────────────────────────────┤
    │ 综合评分: 61.8/100                         │
    │ 市场阶段: 周期中段 / 中性偏多               │
    │ 判定: 买入 (选择性布局)                     │
    └────────────────────────────────────────────┘

【11】入场计划
    方向: 做多
    入场: $67,500
    止盈1: $68,175 (+1.0%) | 止盈2: $69,350 (+2.7%)
    止损: $66,825 (-1.0%)
    盈亏比: 1:2.7
```

---

### 第 7 步：扫描模式

扫描热门币种：
```bash
# MCP 首选: market_get_tickers(instType="SPOT") → /tmp/okx_tickers.json
# CLI 回退:
okx --json market tickers SPOT > /tmp/okx_tickers.json
# 用 Python 解析 data 数组，按 vol24h 降序排序，取前 20
```

对每个币种执行第 1 步（快速信号），按信号强度排序。

输出：按综合信号评分排序的币种表格。

---

### 第 8 步：公式 / 组合分析

利用 MCP tools / CLI 多次调用 + Python 计算进行组合级分析：
```bash
# 加权组合 (50% BTC + 30% ETH + 20% SOL)
# MCP: 对每个 INST 调用 market_get_candles(instId=INST, bar="1D", limit="100")
# CLI 回退:
for INST in BTC-USDT ETH-USDT SOL-USDT; do
  okx --json market candles $INST --bar 1D --limit 100 > /tmp/okx_formula_${INST}.json
done
# Python 计算: portfolio_close = 0.5 * BTC_close + 0.3 * ETH_close + 0.2 * SOL_close（归一化后）

# 板块指数 (equal weight: SOL, AVAX, DOT, ATOM, NEAR vs BTC)
# MCP/CLI: 对每个币种调用 market_get_candles / okx --json market candles XXX-USDT --bar 1D --limit 100
# Python 计算: 等权归一化指数 vs BTC 归一化走势

# 比率 / 价差 (ETH/BTC ratio)
# 复用上面已获取的 ETH-USDT 和 BTC-USDT 数据
# Python 计算: ratio = ETH_close / BTC_close（逐根K线）
```

---

### 第 9 步：图表可视化（模式: chart 或 --chart 或 --full）

**依赖安装**（首次使用自动安装）：
```bash
pip3 install matplotlib mplfinance plotext --break-system-packages 2>/dev/null || pip install matplotlib mplfinance plotext 2>/dev/null
```

获取K线数据用于图表渲染（使用 `$CHART_BAR` 指定的单个时间周期）：
```bash
# MCP 首选: market_get_candles(instId="$COIN-USDT", bar="$CHART_BAR", limit="200") → /tmp/chart_candles_${COIN}.json
# CLI 回退:
okx --json market candles $COIN-USDT --bar $CHART_BAR --limit 200 > /tmp/chart_candles_${COIN}.json

# 复用扩展指标引擎计算图表数据
python3 /tmp/kline_ext_indicators.py \
  --candles /tmp/chart_candles_${COIN}.json \
  --mode full \
  --output /tmp/chart_indicators_${COIN}.json

# 写入图表渲染引擎（heredoc 内置）
cat << 'CHART_ENGINE' > /tmp/kline_chart.py
#!/usr/bin/env python3
"""
Chart Engine for OKX TradeKit (okx-trade-mcp / okx-trade-cli) K-Line Indicators Skill.
Generates multi-panel technical analysis charts.

Supports two output modes:
  1. Terminal (plotext) — renders directly in CLI
  2. PNG (matplotlib + mplfinance) — saves high-res image

Usage:
    python3 kline_chart.py --candles /tmp/candles.json --indicators /tmp/indicators.json --mode terminal
    python3 kline_chart.py --candles /tmp/candles.json --indicators /tmp/indicators.json --mode png --output /tmp/chart.png
    python3 kline_chart.py --candles /tmp/candles.json --indicators /tmp/indicators.json --mode both --output /tmp/chart.png

Dependencies:
  Terminal mode: plotext (pip install plotext)
  PNG mode: matplotlib, mplfinance (pip install matplotlib mplfinance)
"""

import json, sys, argparse, math
from datetime import datetime

# ============================================================
# Terminal Chart Engine (plotext)
# ============================================================

def render_terminal(candles, indicators, coin="BTC", bar="1H", width=160, last_n=80):
    """Render multi-panel chart in terminal using plotext."""
    try:
        import plotext as plt
    except ImportError:
        print("[WARN] plotext not installed. Run: pip install plotext")
        return False

    c_data = candles[-last_n:]
    n = len(c_data)
    ts   = list(range(n))
    opens  = [float(c[1]) for c in c_data]
    highs  = [float(c[2]) for c in c_data]
    lows   = [float(c[3]) for c in c_data]
    closes = [float(c[4]) for c in c_data]
    vols   = [float(c[5]) if len(c) > 5 else 0 for c in c_data]

    # Time labels
    dates = []
    for c in c_data:
        t = float(c[0])
        if t > 1e12: t /= 1000
        try: dates.append(datetime.fromtimestamp(t).strftime("%m/%d %H:%M"))
        except Exception: dates.append("")

    # Extract indicator data
    ind = indicators if indicators else {}
    trend = ind.get("trend", {})
    momentum = ind.get("momentum", {})
    vol_data = ind.get("volume", {})
    patterns = ind.get("patterns", {})
    divergence = ind.get("divergence", {})
    structure = ind.get("structure", {})

    # --- Compute overlay series for last_n candles ---
    # MA series (recalculate for display range)
    def sma_s(data, period):
        r = []
        for i in range(len(data)):
            if i < period - 1: r.append(None)
            else: r.append(sum(data[i-period+1:i+1]) / period)
        return r

    ma7 = sma_s(closes, 7)
    ma25 = sma_s(closes, 25)

    # Bollinger Bands
    bb_upper = []; bb_lower = []
    for i in range(len(closes)):
        if i < 19:
            bb_upper.append(None); bb_lower.append(None)
        else:
            subset = closes[i-19:i+1]
            m = sum(subset)/20
            sd = math.sqrt(sum((x-m)**2 for x in subset)/20)
            bb_upper.append(m + 2*sd); bb_lower.append(m - 2*sd)

    # RSI series
    def rsi_series(data, period=14):
        r = [None] * period
        gains = []; losses = []
        for i in range(1, len(data)):
            d = data[i] - data[i-1]
            gains.append(max(d,0)); losses.append(max(-d,0))
        if len(gains) < period: return [None]*len(data)
        ag = sum(gains[:period])/period; al = sum(losses[:period])/period
        if al == 0: r.append(100.0)
        else: r.append(100.0 - 100.0/(1.0+ag/al))
        for i in range(period, len(gains)):
            ag = (ag*(period-1)+gains[i])/period
            al = (al*(period-1)+losses[i])/period
            if al == 0: r.append(100.0)
            else: r.append(100.0 - 100.0/(1.0+ag/al))
        return r[:len(data)]

    rsi = rsi_series(closes)

    # MACD series
    def ema_s(data, period):
        r = []; k = 2.0/(period+1)
        if len(data) < period: return [None]*len(data)
        r = [None]*(period-1)
        val = sum(data[:period])/period; r.append(val)
        for i in range(period, len(data)):
            val = data[i]*k + val*(1-k); r.append(val)
        return r

    ema12 = ema_s(closes, 12); ema26 = ema_s(closes, 26)
    macd_line = []; macd_signal = []; macd_hist = []
    for f, s in zip(ema12, ema26):
        if f is not None and s is not None: macd_line.append(f-s)
        else: macd_line.append(None)
    valid_macd = [x for x in macd_line if x is not None]
    sig_s = ema_s(valid_macd, 9) if len(valid_macd) >= 9 else [None]*len(valid_macd)
    # Align signal back
    macd_signal = [None]*(len(macd_line)-len(sig_s)) + sig_s
    for m, s in zip(macd_line, macd_signal):
        if m is not None and s is not None: macd_hist.append(m-s)
        else: macd_hist.append(None)

    # Support/Resistance levels from indicator data
    sr_levels = []
    if structure:
        for sr in structure.get("support_resistance", [])[:6]:
            if sr.get("price"): sr_levels.append((sr["price"], sr["type"]))
        ns = structure.get("nearest_support")
        nr = structure.get("nearest_resistance")

    # Pattern annotations
    pat_markers = []
    if patterns and patterns.get("detected"):
        for p in patterns["detected"]:
            direction = "▲" if p["direction"] == "bullish" else ("▼" if p["direction"] == "bearish" else "◆")
            pat_markers.append(f'{direction} {p["name"]}')

    # ===== RENDER =====
    plt.clear_figure()
    plt.theme("dark")
    plt.plot_size(width, 50)
    plt.title(f"  {coin}-USDT  |  {bar}  |  {dates[0]} → {dates[-1]}  ")

    # --- Subplot 1: Candlestick + MA + BB + S/R (3/5 height) ---
    plt.subplot(4, 1, 1)
    plt.plot_size(width, 22)

    # Candle bodies as colored bars
    for i in range(n):
        color = "green" if closes[i] >= opens[i] else "red"
        # Wick (high-low)
        plt.plot([ts[i], ts[i]], [lows[i], highs[i]], color="gray")

    # Plot close as line (main price action)
    plt.plot(ts, closes, color="white", label="Close")

    # MA overlays
    ma7_clean = [(ts[i], ma7[i]) for i in range(n) if ma7[i] is not None]
    ma25_clean = [(ts[i], ma25[i]) for i in range(n) if ma25[i] is not None]
    if ma7_clean:
        plt.plot([x[0] for x in ma7_clean], [x[1] for x in ma7_clean], color="yellow", label="MA7")
    if ma25_clean:
        plt.plot([x[0] for x in ma25_clean], [x[1] for x in ma25_clean], color="cyan", label="MA25")

    # Bollinger Bands
    bbu = [(ts[i], bb_upper[i]) for i in range(n) if bb_upper[i] is not None]
    bbl = [(ts[i], bb_lower[i]) for i in range(n) if bb_lower[i] is not None]
    if bbu:
        plt.plot([x[0] for x in bbu], [x[1] for x in bbu], color="blue+", label="BB Up")
        plt.plot([x[0] for x in bbl], [x[1] for x in bbl], color="blue+", label="BB Lo")

    # S/R horizontal lines
    for price, stype in sr_levels[:4]:
        color = "green+" if stype == "support" else "red+"
        plt.hline(price, color)

    plt.ylabel("Price")

    # --- Subplot 2: MACD ---
    plt.subplot(4, 1, 2)
    plt.plot_size(width, 10)
    mh_ts = [ts[i] for i in range(n) if macd_hist[i] is not None]
    mh_vals = [macd_hist[i] for i in range(n) if macd_hist[i] is not None]
    if mh_ts:
        pos_t = [mh_ts[i] for i in range(len(mh_vals)) if mh_vals[i] >= 0]
        pos_v = [mh_vals[i] for i in range(len(mh_vals)) if mh_vals[i] >= 0]
        neg_t = [mh_ts[i] for i in range(len(mh_vals)) if mh_vals[i] < 0]
        neg_v = [mh_vals[i] for i in range(len(mh_vals)) if mh_vals[i] < 0]
        if pos_t: plt.bar(pos_t, pos_v, color="green", width=0.6)
        if neg_t: plt.bar(neg_t, neg_v, color="red", width=0.6)
    ml_ts = [ts[i] for i in range(n) if macd_line[i] is not None]
    ml_vals = [macd_line[i] for i in range(n) if macd_line[i] is not None]
    if ml_ts: plt.plot(ml_ts, ml_vals, color="cyan", label="MACD")
    ms_ts = [ts[i] for i in range(n) if macd_signal[i] is not None]
    ms_vals = [macd_signal[i] for i in range(n) if macd_signal[i] is not None]
    if ms_ts: plt.plot(ms_ts, ms_vals, color="orange", label="Signal")
    plt.ylabel("MACD")

    # --- Subplot 3: RSI ---
    plt.subplot(4, 1, 3)
    plt.plot_size(width, 8)
    rsi_ts = [ts[i] for i in range(n) if rsi[i] is not None]
    rsi_vals = [rsi[i] for i in range(n) if rsi[i] is not None]
    if rsi_ts: plt.plot(rsi_ts, rsi_vals, color="magenta", label="RSI14")
    plt.hline(70, "red")
    plt.hline(30, "green")
    plt.hline(50, "gray")
    plt.ylabel("RSI")
    plt.ylim(0, 100)

    # --- Subplot 4: Volume ---
    plt.subplot(4, 1, 4)
    plt.plot_size(width, 7)
    vol_colors = ["green" if closes[i] >= opens[i] else "red" for i in range(n)]
    # plotext bar with individual colors
    for i in range(n):
        plt.bar([ts[i]], [vols[i]], color=vol_colors[i], width=0.8)
    plt.ylabel("Vol")

    plt.show()

    # Print annotations below chart
    if pat_markers:
        print(f"\n  🔍 K线形态: {' | '.join(pat_markers[:5])}")
    if divergence and divergence.get("detected"):
        divs = [f'{"🟢" if "bullish" in d["type"] else "🔴"} {d["indicator"]} {d["type"]}' for d in divergence["detected"][:3]]
        print(f"  📊 背离信号: {' | '.join(divs)}")
    if structure:
        ms = structure.get("market_structure", {})
        trend_label = ms.get("trend", "N/A")
        ns = structure.get("nearest_support")
        nr = structure.get("nearest_resistance")
        print(f"  📐 市场结构: {trend_label}", end="")
        if ns: print(f"  |  支撑: ${ns['price']}", end="")
        if nr: print(f"  |  阻力: ${nr['price']}", end="")
        print()

    return True


# ============================================================
# Helpers
# ============================================================

def dates_fmt(dt):
    try: return dt.strftime("%m/%d %H:%M")
    except Exception: return ""


# ============================================================
# PNG Chart Engine (matplotlib + mplfinance)
# ============================================================

def render_png(candles, indicators, coin="BTC", bar="1H", output="/tmp/chart.png", last_n=100):
    """Render professional multi-panel chart as PNG using matplotlib."""
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import matplotlib.dates as mdates
        from matplotlib.patches import FancyArrowPatch
        import matplotlib.ticker as ticker
    except ImportError:
        print("[WARN] matplotlib not installed. Run: pip install matplotlib")
        return False

    c_data = candles[-last_n:]
    n = len(c_data)

    # Parse data
    timestamps = []
    for c in c_data:
        t = float(c[0])
        if t > 1e12: t /= 1000
        try: timestamps.append(datetime.fromtimestamp(t))
        except Exception: timestamps.append(datetime.now())

    opens  = [float(c[1]) for c in c_data]
    highs  = [float(c[2]) for c in c_data]
    lows   = [float(c[3]) for c in c_data]
    closes = [float(c[4]) for c in c_data]
    vols   = [float(c[5]) if len(c) > 5 else 0 for c in c_data]

    ind = indicators if indicators else {}
    patterns = ind.get("patterns", {})
    divergence = ind.get("divergence", {})
    structure = ind.get("structure", {})

    # Compute indicator series
    def sma_s(data, p):
        r = []
        for i in range(len(data)):
            if i < p-1: r.append(None)
            else: r.append(sum(data[i-p+1:i+1])/p)
        return r

    def ema_s(data, p):
        if len(data) < p: return [None]*len(data)
        k = 2.0/(p+1); r = [None]*(p-1)
        val = sum(data[:p])/p; r.append(val)
        for i in range(p, len(data)): val = data[i]*k + val*(1-k); r.append(val)
        return r

    ma7 = sma_s(closes, 7)
    ma25 = sma_s(closes, 25)
    ma50 = sma_s(closes, 50)

    # Bollinger Bands
    bb_u = []; bb_l = []; bb_m = []
    for i in range(len(closes)):
        if i < 19: bb_u.append(None); bb_l.append(None); bb_m.append(None)
        else:
            s = closes[i-19:i+1]; m = sum(s)/20
            sd = math.sqrt(sum((x-m)**2 for x in s)/20)
            bb_u.append(m+2*sd); bb_l.append(m-2*sd); bb_m.append(m)

    # RSI
    def rsi_s(data, period=14):
        r = [None]*(period)
        gains=[]; losses=[]
        for i in range(1,len(data)):
            d=data[i]-data[i-1]; gains.append(max(d,0)); losses.append(max(-d,0))
        if len(gains)<period: return [None]*len(data)
        ag=sum(gains[:period])/period; al=sum(losses[:period])/period
        if al==0: r.append(100.0)
        else: r.append(100.0-100.0/(1.0+ag/al))
        for i in range(period,len(gains)):
            ag=(ag*(period-1)+gains[i])/period; al=(al*(period-1)+losses[i])/period
            if al==0: r.append(100.0)
            else: r.append(100.0-100.0/(1.0+ag/al))
        return r[:len(data)]
    rsi = rsi_s(closes)

    # MACD
    e12 = ema_s(closes, 12); e26 = ema_s(closes, 26)
    macd_l = [(e12[i]-e26[i]) if (e12[i] and e26[i]) else None for i in range(n)]
    valid_m = [x for x in macd_l if x is not None]
    sig_raw = ema_s(valid_m, 9) if len(valid_m)>=9 else [None]*len(valid_m)
    macd_sig = [None]*(n-len(sig_raw)) + sig_raw
    macd_h = [(macd_l[i]-macd_sig[i]) if (macd_l[i] and macd_sig[i]) else None for i in range(n)]

    # --- CREATE FIGURE ---
    fig = plt.figure(figsize=(20, 14), facecolor='#1a1a2e')
    fig.suptitle(f'{coin}-USDT  |  {bar}  |  Technical Analysis', fontsize=16, color='white', fontweight='bold', y=0.98)

    # GridSpec: main=50%, MACD=18%, RSI=16%, Vol=16%
    gs = fig.add_gridspec(4, 1, height_ratios=[5, 1.8, 1.6, 1.6], hspace=0.05)

    ax1 = fig.add_subplot(gs[0])  # Candlestick
    ax2 = fig.add_subplot(gs[1], sharex=ax1)  # MACD
    ax3 = fig.add_subplot(gs[2], sharex=ax1)  # RSI
    ax4 = fig.add_subplot(gs[3], sharex=ax1)  # Volume

    for ax in [ax1, ax2, ax3, ax4]:
        ax.set_facecolor('#16213e')
        ax.tick_params(colors='#8a8a8a', labelsize=8)
        ax.grid(True, alpha=0.15, color='#4a4a4a')
        for spine in ax.spines.values(): spine.set_color('#333355')

    xs = list(range(n))

    # === Panel 1: Candlestick ===
    for i in range(n):
        color = '#00e676' if closes[i] >= opens[i] else '#ff1744'
        body_lo = min(opens[i], closes[i]); body_hi = max(opens[i], closes[i])
        # Wick
        ax1.plot([xs[i], xs[i]], [lows[i], highs[i]], color=color, linewidth=0.8, alpha=0.8)
        # Body
        ax1.bar(xs[i], body_hi - body_lo, bottom=body_lo, color=color, width=0.6, edgecolor=color, linewidth=0.5)

    # MA lines
    def plot_series(ax, xs, data, color, label, lw=1.2):
        valid = [(xs[i], data[i]) for i in range(len(data)) if data[i] is not None]
        if valid: ax.plot([v[0] for v in valid], [v[1] for v in valid], color=color, linewidth=lw, label=label, alpha=0.85)

    plot_series(ax1, xs, ma7, '#ffeb3b', 'MA7')
    plot_series(ax1, xs, ma25, '#00bcd4', 'MA25')
    plot_series(ax1, xs, ma50, '#ff9800', 'MA50')

    # Bollinger Bands fill
    bbu_v = [(xs[i], bb_u[i]) for i in range(n) if bb_u[i]]
    bbl_v = [(xs[i], bb_l[i]) for i in range(n) if bb_l[i]]
    if bbu_v and bbl_v:
        bx = [v[0] for v in bbu_v]
        ax1.fill_between(bx, [v[1] for v in bbu_v], [bbl_v[i][1] for i in range(len(bbl_v))],
                         alpha=0.08, color='#2196f3')
        ax1.plot(bx, [v[1] for v in bbu_v], color='#2196f3', linewidth=0.8, alpha=0.5, linestyle='--')
        ax1.plot(bx, [v[1] for v in bbl_v], color='#2196f3', linewidth=0.8, alpha=0.5, linestyle='--')

    # Support/Resistance lines
    if structure:
        for sr in structure.get("support_resistance", [])[:6]:
            if sr.get("price"):
                color = '#00e676' if sr["type"] == "support" else '#ff1744'
                ax1.axhline(y=sr["price"], color=color, linewidth=0.8, linestyle=':', alpha=0.6)
                ax1.annotate(f'{"S" if sr["type"]=="support" else "R"} {sr["price"]:.1f}',
                    xy=(n-1, sr["price"]), fontsize=7, color=color, alpha=0.8,
                    xytext=(5, 0), textcoords='offset points')

    # Pattern markers
    if patterns and patterns.get("detected"):
        for p in patterns["detected"][:5]:
            marker = '▲' if p["direction"]=="bullish" else ('▼' if p["direction"]=="bearish" else '◆')
            color = '#00e676' if p["direction"]=="bullish" else ('#ff1744' if p["direction"]=="bearish" else '#ffeb3b')
            y_pos = lows[-1]*0.998 if p["direction"]=="bullish" else highs[-1]*1.002
            ax1.annotate(f'{marker} {p["name"]}', xy=(n-1, y_pos), fontsize=7, color=color,
                fontweight='bold', ha='right', xytext=(-5, -10 if p["direction"]=="bearish" else 10),
                textcoords='offset points')

    ax1.set_ylabel('Price', color='#8a8a8a', fontsize=9)
    ax1.legend(loc='upper left', fontsize=8, facecolor='#1a1a2e', edgecolor='#333355', labelcolor='#cccccc')
    plt.setp(ax1.get_xticklabels(), visible=False)

    # === Panel 2: MACD ===
    for i in range(n):
        if macd_h[i] is not None:
            color = '#00e676' if macd_h[i] >= 0 else '#ff1744'
            ax2.bar(xs[i], macd_h[i], color=color, width=0.6, alpha=0.7)
    plot_series(ax2, xs, macd_l, '#00bcd4', 'MACD', 1.0)
    plot_series(ax2, xs, macd_sig, '#ff9800', 'Signal', 1.0)
    ax2.axhline(y=0, color='#4a4a4a', linewidth=0.5)
    ax2.set_ylabel('MACD', color='#8a8a8a', fontsize=9)
    ax2.legend(loc='upper left', fontsize=7, facecolor='#1a1a2e', edgecolor='#333355', labelcolor='#cccccc')
    plt.setp(ax2.get_xticklabels(), visible=False)

    # Divergence arrows on MACD
    if divergence and divergence.get("detected"):
        for d in divergence["detected"]:
            if d["indicator"] == "MACD" and "bars_ago" in d:
                ba = d["bars_ago"]
                if isinstance(ba, (int, float)) and ba < n:
                    idx = n - 1 - int(ba)
                    if 0 <= idx < n and macd_l[idx] is not None:
                        color = '#00e676' if 'bullish' in d['type'] else '#ff1744'
                        marker = '▲' if 'bullish' in d['type'] else '▼'
                        ax2.annotate(f'{marker}', xy=(idx, macd_l[idx]), fontsize=12, color=color, ha='center',
                            fontweight='bold', xytext=(0, 15 if 'bullish' in d['type'] else -15),
                            textcoords='offset points',
                            arrowprops=dict(arrowstyle='->', color=color, lw=1.5))

    # === Panel 3: RSI ===
    plot_series(ax3, xs, rsi, '#e040fb', 'RSI14', 1.2)
    ax3.axhline(y=70, color='#ff1744', linewidth=0.8, linestyle='--', alpha=0.5)
    ax3.axhline(y=30, color='#00e676', linewidth=0.8, linestyle='--', alpha=0.5)
    ax3.axhline(y=50, color='#4a4a4a', linewidth=0.5, linestyle=':')
    ax3.fill_between(xs, 30, 70, alpha=0.05, color='#e040fb')
    ax3.set_ylim(0, 100)
    ax3.set_ylabel('RSI', color='#8a8a8a', fontsize=9)
    plt.setp(ax3.get_xticklabels(), visible=False)

    # RSI divergence arrows
    if divergence and divergence.get("detected"):
        for d in divergence["detected"]:
            if d["indicator"] == "RSI14" and "bars_ago" in d:
                ba = d["bars_ago"]
                if isinstance(ba, (int, float)) and ba < n:
                    idx = n - 1 - int(ba)
                    if 0 <= idx < n and rsi[idx] is not None:
                        color = '#00e676' if 'bullish' in d['type'] else '#ff1744'
                        marker = '▲' if 'bullish' in d['type'] else '▼'
                        ax3.annotate(f'{marker}', xy=(idx, rsi[idx]), fontsize=12, color=color, ha='center',
                            fontweight='bold', xytext=(0, 10 if 'bullish' in d['type'] else -10),
                            textcoords='offset points',
                            arrowprops=dict(arrowstyle='->', color=color, lw=1.5))

    # === Panel 4: Volume ===
    for i in range(n):
        color = '#00e67688' if closes[i] >= opens[i] else '#ff174488'
        ax4.bar(xs[i], vols[i], color=color, width=0.7)
    # Volume MA
    vol_ma = sma_s(vols, 20)
    plot_series(ax4, xs, vol_ma, '#ffeb3b', 'Vol MA20', 0.8)
    ax4.set_ylabel('Volume', color='#8a8a8a', fontsize=9)
    ax4.set_xlabel('Time', color='#8a8a8a', fontsize=9)

    # X-axis labels (show every nth date)
    step = max(1, n // 10)
    ax4.set_xticks([xs[i] for i in range(0, n, step)])
    ax4.set_xticklabels([dates_fmt(timestamps[i]) for i in range(0, n, step)], rotation=45, fontsize=7)

    # Info box
    last_p = closes[-1]; change = (closes[-1]/closes[-2]-1)*100 if len(closes)>=2 else 0
    info = f'Last: ${last_p:,.2f}  ({change:+.2f}%)'
    if rsi[-1]: info += f'  |  RSI: {rsi[-1]:.1f}'
    fig.text(0.5, 0.01, info, ha='center', fontsize=10, color='#cccccc',
        bbox=dict(boxstyle='round,pad=0.5', facecolor='#1a1a2e', edgecolor='#333355'))

    plt.savefig(output, dpi=150, bbox_inches='tight', facecolor='#1a1a2e', edgecolor='none')
    plt.close()
    print(f"Chart saved to {output}")
    return True


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="K-Line Chart Engine")
    parser.add_argument("--candles", required=True, help="Path to JSON candle data")
    parser.add_argument("--indicators", help="Path to JSON indicator data (from kline_ext_indicators.py)")
    parser.add_argument("--mode", choices=["terminal", "png", "both"], default="terminal",
                        help="Output mode: terminal (CLI display), png (save image), both")
    parser.add_argument("--output", default="/tmp/kline_chart.png", help="PNG output path")
    parser.add_argument("--coin", default="BTC", help="Coin symbol for title")
    parser.add_argument("--bar", default="1H", help="Timeframe for title")
    parser.add_argument("--last-n", type=int, default=80, help="Number of candles to display")
    parser.add_argument("--width", type=int, default=160, help="Terminal chart width")
    args = parser.parse_args()

    # Load candle data
    try:
        with open(args.candles) as f:
            content = f.read().strip()
            if not content:
                print("Error: Candle data file is empty. Check if data fetch succeeded."); sys.exit(1)
            raw = json.loads(content)
    except FileNotFoundError:
        print(f"Error: Candle file not found: {args.candles}"); sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in candle data: {e}"); sys.exit(1)
    candles = raw.get("data", raw.get("candles", raw)) if isinstance(raw, dict) else raw
    if not candles:
        print("Error: No candle data in file"); sys.exit(1)

    # Load indicator data
    indicators = {}
    if args.indicators:
        try:
            with open(args.indicators) as f:
                content = f.read().strip()
                if content:
                    indicators = json.loads(content)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"[WARN] Could not load indicators: {e}")
            indicators = {}

    if args.mode in ("terminal", "both"):
        ok = render_terminal(candles, indicators, args.coin, args.bar, args.width, args.last_n)
        if not ok:
            print("Terminal rendering failed, trying PNG fallback...")
            args.mode = "png"

    if args.mode in ("png", "both"):
        render_png(candles, indicators, args.coin, args.bar, args.output, min(args.last_n + 20, 120))
        print(f"PNG chart: {args.output}")


if __name__ == "__main__":
    main()
CHART_ENGINE

# 终端直显（默认模式）
python3 /tmp/kline_chart.py \
  --candles /tmp/chart_candles_${COIN}.json \
  --indicators /tmp/chart_indicators_${COIN}.json \
  --coin $COIN --bar $CHART_BAR \
  --mode terminal --last-n 80

# 同时保存 PNG（用户加了 --save）
python3 /tmp/kline_chart.py \
  --candles /tmp/chart_candles_${COIN}.json \
  --indicators /tmp/chart_indicators_${COIN}.json \
  --coin $COIN --bar $CHART_BAR \
  --mode both --output /tmp/kline_chart_${COIN}.png --last-n 100
```

**图表输出规则：**
- 默认 `terminal` 模式：用 plotext 在终端直接渲染，无需打开文件
- `--save` 或 `--full` 模式：同时生成 PNG 到 `/tmp/kline_chart_${COIN}.png`
- `--chart` 参数：任何模式下追加 `--chart` 可触发图表生成
- `--full` 模式自动启用图表（终端渲染 + 可选 PNG）

**图表面板说明（展示给用户）：**
```
┌─────────────────────────────────────────────────┐
│  面板1: 蜡烛图 (50%)                              │
│  - K线（红/绿）+ MA7(黄) + MA25(青) + MA50(橙)     │
│  - 布林带（蓝色填充区域）                            │
│  - 支撑位（绿色虚线）/ 阻力位（红色虚线）              │
│  - K线形态标记（▲看多 ▼看空）                       │
├─────────────────────────────────────────────────┤
│  面板2: MACD (18%)                               │
│  - 柱状图（红/绿）+ MACD线(青) + 信号线(橙)          │
│  - 背离箭头标记                                    │
├─────────────────────────────────────────────────┤
│  面板3: RSI (16%)                                │
│  - RSI14 线 + 超买(70)/超卖(30) 区域               │
│  - 背离箭头标记                                    │
├─────────────────────────────────────────────────┤
│  面板4: 成交量 (16%)                              │
│  - 量柱（红/绿）+ 20周期均量线                       │
└─────────────────────────────────────────────────┘
图表下方: 形态检测 | 背离信号 | 市场结构
```

---

## 第 10 步：条件交易执行（仅 `trade` 模式）

> **安全优先原则**：交易功能默认 dry-run 模式（仅展示计划，不执行）。实际下单需用户在终端明确确认。所有风控参数强制生效，不可跳过。

### 10.1 交易信号评估

在完成第 1-4 步全面分析后，从第 6 步的【10】综合信号和【11】入场计划中提取关键数据：

```bash
# 从分析输出中提取（由前面步骤生成的变量）:
# $SIGNAL_SCORE    — 加权总分 (0-100)
# $SIGNAL_DIRECTION — 方向: LONG / SHORT / NEUTRAL
# $ENTRY_PRICE     — 建议入场价
# $STOP_LOSS       — 止损价
# $TAKE_PROFIT_1   — 第一止盈目标
# $TAKE_PROFIT_2   — 第二止盈目标（如有）
# $TAKE_PROFIT_3   — 第三止盈目标（如有）
# $RISK_REWARD     — 盈亏比

# 盈利条件判定门槛
SCORE_THRESHOLD=65
RR_THRESHOLD=1.5
```

**交易门槛判定逻辑：**
```
IF $SIGNAL_SCORE < 65 OR $RISK_REWARD < 1.5 OR $SIGNAL_DIRECTION == "NEUTRAL":
    输出: "⚠️ 信号不满足交易条件（评分: $SIGNAL_SCORE/100, 盈亏比: $RISK_REWARD:1）— 建议观望"
    STOP — 不进入交易流程
ELSE:
    继续执行 10.2
```

### 10.2 账户状态检查

```
# MCP 首选（推荐，直接获取结构化数据）:
#   1. account_get_balance(ccy="USDT")
#   2. account_get_positions(instType="SWAP")
#   3. swap_get_leverage(instId=$INST_ID, mgnMode=$TRADE_MARGIN_MODE)
#   4. account_get_max_avail_size(instId=$INST_ID, tdMode=$TD_MODE)

# CLI 回退:
INST_ID="${COIN}-USDT-SWAP"
if [ "$TRADE_TYPE" = "spot" ]; then INST_ID="${COIN}-USDT"; fi
TD_MODE=$TRADE_MARGIN_MODE
if [ "$TRADE_TYPE" = "spot" ]; then TD_MODE="cash"; fi

okx account balance --ccy USDT 2>/tmp/acct_err.log | tee /tmp/acct_balance.json
okx --json account positions --instType SWAP 2>>/tmp/acct_err.log | tee /tmp/acct_positions.json
okx swap leverage --instId $INST_ID --mgnMode $TRADE_MARGIN_MODE 2>>/tmp/acct_err.log | tee /tmp/acct_leverage.json
okx account max-avail-size --instId $INST_ID --tdMode $TD_MODE 2>>/tmp/acct_err.log | tee /tmp/acct_max_avail.json
```

**检查要点（向用户展示）：**
- 账户可用余额 (USDT)
- 是否已有同方向持仓（若有：提示用户是否加仓或跳过）
- 当前杠杆是否与目标一致（不一致则需调整）
- 最大可开仓量是否满足计划仓位

### 10.3 仓位计算引擎

```python
# 仓位计算公式
account_balance = <从 acct_balance.json 解析>  # USDT 可用余额
risk_pct = $TRADE_RISK / 100                     # 默认 0.02 (2%)
leverage = $TRADE_LEVERAGE                        # 默认 5
entry_price = $ENTRY_PRICE
stop_loss = $STOP_LOSS

# 1. 最大风险金额
risk_amount = account_balance * risk_pct  # e.g. 10000 * 0.02 = 200 USDT

# 2. 每单位止损距离
stop_distance = abs(entry_price - stop_loss)
stop_pct = stop_distance / entry_price

# 3. 合约仓位大小（考虑杠杆）
if trade_type == "swap":
    position_value = risk_amount / stop_pct           # 名义价值
    position_size = position_value / entry_price      # 币数量
    margin_required = position_value / leverage       # 所需保证金
else:  # spot
    position_size = risk_amount / stop_distance       # 现货数量
    margin_required = position_size * entry_price     # 现货全额

# 4. 安全上限检查
max_avail = <从 acct_max_avail.json 解析>
if position_size > max_avail:
    position_size = max_avail * 0.95  # 留 5% 余量
    # 提醒用户仓位被截断

# 5. 强制风控上限
MAX_SINGLE_RISK_PCT = 5     # 单笔最大 5%
MAX_POSITION_PCT = 30       # 单币最大仓位占比 30%
if risk_pct > MAX_SINGLE_RISK_PCT / 100:
    risk_pct = MAX_SINGLE_RISK_PCT / 100
if margin_required > account_balance * MAX_POSITION_PCT / 100:
    position_size = (account_balance * MAX_POSITION_PCT / 100 * leverage) / entry_price
```

### 10.4 交易计划展示

向用户展示完整交易计划（无论 dry-run 还是实际执行都显示）：

```
╔══════════════════════════════════════════════════════════╗
║                    📋 交易计划                           ║
╠══════════════════════════════════════════════════════════╣
║  交易对:     $INST_ID                                    ║
║  方向:       $SIGNAL_DIRECTION (做多/做空)                ║
║  类型:       $TRADE_TYPE (现货/合约)                      ║
║  保证金模式: $TRADE_MARGIN_MODE                          ║
║  杠杆:       ${TRADE_LEVERAGE}x                          ║
╠──────────────────────────────────────────────────────────╣
║  📊 信号强度                                             ║
║  综合评分:   $SIGNAL_SCORE / 100                         ║
║  盈亏比:     $RISK_REWARD : 1                            ║
╠──────────────────────────────────────────────────────────╣
║  💰 仓位计算                                             ║
║  账户余额:   $BALANCE USDT                               ║
║  风险比例:   $TRADE_RISK%                                ║
║  风险金额:   $RISK_AMOUNT USDT                           ║
║  仓位大小:   $POSITION_SIZE $COIN                        ║
║  名义价值:   $POSITION_VALUE USDT                        ║
║  所需保证金: $MARGIN_REQUIRED USDT                       ║
╠──────────────────────────────────────────────────────────╣
║  🎯 价格计划                                             ║
║  入场价:     $ENTRY_PRICE                                ║
║  止损价:     $STOP_LOSS  (距离: $STOP_PCT%)              ║
║  止盈 T1:    $TAKE_PROFIT_1  (盈亏比: $RR1:1)           ║
║  止盈 T2:    $TAKE_PROFIT_2  (盈亏比: $RR2:1)           ║
║  止盈 T3:    $TAKE_PROFIT_3  (盈亏比: $RR3:1)           ║
╠──────────────────────────────────────────────────────────╣
║  📐 止盈分批策略                                         ║
║  T1 (40%):   平仓 $SIZE_T1 $COIN @ $TAKE_PROFIT_1      ║
║  T2 (35%):   平仓 $SIZE_T2 $COIN @ $TAKE_PROFIT_2      ║
║  T3 (25%):   平仓 $SIZE_T3 $COIN @ $TAKE_PROFIT_3      ║
║  (T1 触发后止损移至入场价 — 保本)                          ║
╠──────────────────────────────────────────────────────────╣
║  ⚠️ 最大亏损: $RISK_AMOUNT USDT ($TRADE_RISK% 账户)     ║
║  ✅ 最大盈利: $MAX_PROFIT USDT (预期值)                  ║
╚══════════════════════════════════════════════════════════╝
```

### 10.5 执行交易

**如果 `$TRADE_CONFIRM` = false（默认 dry-run）：**
```
显示以上交易计划后输出:
"🔒 Dry-Run 模式 — 以上为模拟交易计划，未实际下单。
  添加 --confirm 参数可执行实际交易。"
STOP — 不执行下单
```

**如果 `$TRADE_CONFIRM` = true：**

向用户发出最终确认提示，等待回复 "yes" / "确认" 后才执行（即使 `--confirm` 也要二次确认）：
```
"⚠️ 即将执行真实交易！请确认以下内容:
  - 交易对: $INST_ID
  - 方向: $SIGNAL_DIRECTION
  - 仓位: $POSITION_SIZE $COIN（保证金 $MARGIN_REQUIRED USDT）
  - 止损: $STOP_LOSS（最大亏损 $RISK_AMOUNT USDT）
  回复 '确认' 或 'yes' 执行，其他任意内容取消。"
```

**执行序列（用户确认后）：**

```
# ======== 第一步：设置杠杆（仅合约） ========
# MCP 首选: swap_set_leverage(instId=$INST_ID, lever=$TRADE_LEVERAGE, mgnMode=$TRADE_MARGIN_MODE)
# CLI 回退:
if [ "$TRADE_TYPE" = "swap" ]; then
  okx swap leverage --instId $INST_ID --set \
    --lever $TRADE_LEVERAGE --mgnMode $TRADE_MARGIN_MODE
  sleep 1
fi

# ======== 第二步：开仓下单 ========
SIDE="buy"
POS_SIDE="long"
if [ "$SIGNAL_DIRECTION" = "SHORT" ]; then
  SIDE="sell"
  POS_SIDE="short"
fi

# MCP 首选:
#   合约: swap_place_order(instId=$INST_ID, side=$SIDE, sz=$POSITION_SIZE, tdMode=$TRADE_MARGIN_MODE, px=$ENTRY_PRICE, posSide=$POS_SIDE)
#   现货: spot_place_order(instId=$INST_ID, side=$SIDE, sz=$POSITION_SIZE, px=$ENTRY_PRICE)
# CLI 回退:
if [ "$TRADE_TYPE" = "swap" ]; then
  okx swap place \
    --instId $INST_ID \
    --side $SIDE \
    --sz $POSITION_SIZE \
    --tdMode $TRADE_MARGIN_MODE \
    --px $ENTRY_PRICE \
    --posSide $POS_SIDE \
    2>/tmp/trade_order_err.log | tee /tmp/trade_order_result.json
else
  okx spot place \
    --instId $INST_ID \
    --side $SIDE \
    --sz $POSITION_SIZE \
    --px $ENTRY_PRICE \
    2>/tmp/trade_order_err.log | tee /tmp/trade_order_result.json
fi

# 从返回中提取 ordId
ORD_ID=$(python3 -c "import json,sys; d=json.load(open('/tmp/trade_order_result.json')); print(d.get('data',[{}])[0].get('ordId',''))" 2>/dev/null)

if [ -z "$ORD_ID" ]; then
  echo "下单失败，请检查 /tmp/trade_order_err.log"
  exit 1
fi
echo "开仓订单已提交: ordId=$ORD_ID"

# ======== 第三步：设置止盈止损 (OCO) ========
if [ "$TRADE_TYPE" = "swap" ]; then
  # 止损方向与开仓相反
  SL_SIDE="sell"
  SL_POS_SIDE="long"
  if [ "$SIGNAL_DIRECTION" = "SHORT" ]; then
    SL_SIDE="buy"
    SL_POS_SIDE="short"
  fi

  # T1 止盈 + 全仓止损 (OCO)
  # MCP 首选: swap_place_algo_order(instId=$INST_ID, side=$SL_SIDE, sz=$POSITION_SIZE, tdMode=$TRADE_MARGIN_MODE, tpTriggerPx=$TAKE_PROFIT_1, tpOrdPx=$TAKE_PROFIT_1, slTriggerPx=$STOP_LOSS, slOrdPx=$STOP_LOSS, posSide=$SL_POS_SIDE)
  # CLI 回退:
  okx swap algo place \
    --instId $INST_ID \
    --side $SL_SIDE \
    --sz $POSITION_SIZE \
    --tdMode $TRADE_MARGIN_MODE \
    --tpTriggerPx $TAKE_PROFIT_1 \
    --tpOrdPx $TAKE_PROFIT_1 \
    --slTriggerPx $STOP_LOSS \
    --slOrdPx $STOP_LOSS \
    --posSide $SL_POS_SIDE \
    2>/tmp/trade_algo_err.log | tee /tmp/trade_algo_result.json
  ALGO_ID=$(python3 -c "import json; d=json.load(open('/tmp/trade_algo_result.json')); print(d.get('data',[{}])[0].get('algoId',''))" 2>/dev/null)
  echo "止盈止损已设置: algoId=$ALGO_ID"

  # 如果有多个止盈目标，设置追踪止损替代 T2/T3
  if [ -n "$TAKE_PROFIT_2" ]; then
    # T1 触发后的追踪止损（用 callback ratio 覆盖 T2/T3 区间）
    TRAIL_RATIO=$(python3 -c "
tp1=$TAKE_PROFIT_1; tp3=${TAKE_PROFIT_3:-$TAKE_PROFIT_2}; entry=$ENTRY_PRICE
# 追踪回撤比例 = T1到T3区间的30%
trail = abs(tp3 - tp1) * 0.3 / tp1
print(f'{trail:.4f}')
" 2>/dev/null)
    echo "建议 T1 触发后设置追踪止损 (回撤比例: ${TRAIL_RATIO}):"
    echo "   MCP: swap_place_algo_order(instId=$INST_ID, side=$SL_SIDE, sz=<剩余仓位>, tdMode=$TRADE_MARGIN_MODE, callbackRatio=$TRAIL_RATIO, posSide=$SL_POS_SIDE)"
    echo "   CLI: okx swap algo place --instId $INST_ID --side $SL_SIDE --sz <剩余仓位> --tdMode $TRADE_MARGIN_MODE --callbackRatio $TRAIL_RATIO --posSide $SL_POS_SIDE"
  fi
fi

# ======== 第四步：确认与展示 ========
sleep 2
echo ""
echo "╔══════════════════════════════════════╗"
echo "║       ✅ 交易执行完成               ║"
echo "╠══════════════════════════════════════╣"
echo "║  开仓订单: $ORD_ID                  ║"
echo "║  止盈止损: $ALGO_ID                 ║"
echo "║  状态: 等待成交                      ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "后续管理操作（MCP / CLI）:"
echo "  查看持仓:   account_get_positions / okx --json account positions --instId $INST_ID"
echo "  查看成交:   swap_get_fills / okx --json account fills --instId $INST_ID"
echo "  取消订单:   swap_cancel_order / okx swap cancel --instId $INST_ID --ordId $ORD_ID"
echo "  市价平仓:   swap_close_position / okx swap close --instId $INST_ID --mgnMode $TRADE_MARGIN_MODE --posSide $POS_SIDE"
```

### 10.6 风控规则（强制执行，不可覆盖）

| 规则 | 限制值 | 说明 |
|------|--------|------|
| 单笔最大风险 | 5% 账户 | 超过自动截断至 5% |
| 单币最大仓位 | 30% 账户 | 防止过度集中 |
| 最低盈亏比 | 1.5:1 | 低于不推荐交易 |
| 最低信号评分 | 65/100 | 低于不推荐交易 |
| 最大杠杆 | 20x | 超过强制降至 20x |
| 止损必须设置 | 100% | 不允许无止损交易 |
| 下单确认 | 二次确认 | 即使 --confirm 也需最终确认 |
| 市价单限制 | 仅用于平仓 | 开仓使用限价单确保入场价 |

### 10.7 现货交易特殊处理

现货模式 (`--type spot`) 与合约的差异：
- `$INST_ID` = `$COIN-USDT`（无 `-SWAP` 后缀）
- `td-mode` = `cash`（不支持 cross/isolated）
- 无杠杆设置（杠杆固定为 1x）
- 无 `pos-side` 参数
- 止盈止损需通过 MCP `spot_place_algo_order` / CLI `okx` 条件单实现：

```
# 现货止损（条件卖出）— OKX REST API（需认证头）
# curl -X POST "https://www.okx.com/api/v5/trade/order-algo" \
#   -d '{"instId":"${COIN}-USDT","tdMode":"cash","side":"sell","ordType":"trigger",
#        "sz":"$POSITION_SIZE","triggerPx":"$STOP_LOSS","orderPx":"$STOP_LOSS"}'

# 现货止盈（条件卖出）— OKX REST API（需认证头）
# curl -X POST "https://www.okx.com/api/v5/trade/order-algo" \
#   -d '{"instId":"${COIN}-USDT","tdMode":"cash","side":"sell","ordType":"trigger",
#        "sz":"$SIZE_T1","triggerPx":"$TAKE_PROFIT_1","orderPx":"$TAKE_PROFIT_1"}'
```

---

## 快速参考

| 用户说 | 执行动作 |
|--------|---------|
| "BTC 指标" / "BTC indicators" | 模式: quick，执行第 1+6 步 |
| "BTC 完整分析" / "full analysis" | 模式: full，执行第 1-4C+6 步（含三支柱完整分析） |
| "扫描" / "scan top coins" | 模式: scan，执行第 7 步 |
| "预警 RSI < 30" / "alert" | 模式: alert，执行第 1+5 步 |
| "BTC 订单流" / "order flow" | 模式: orderflow，执行第 1+3+4B+6 步（订单流+衍生品分析） |
| "BTC 宏观" / "macro" | 模式: macro，执行第 1+4A+4B+4C+6 步（三支柱宏观+衍生品） |
| "BTC 三支柱" / "three-pillar" | 模式: full，执行第 1-4C+6 步（含三支柱完整分析） |
| "BTC 衍生品" / "derivatives" | 模式: macro+orderflow，执行第 3+4B+6 步（衍生品深度分析） |
| "BTC MACD RSI BB" | 模式: custom，执行第 1+2 步（指定指标） |
| "组合 50%BTC 30%ETH 20%SOL" | 执行第 8 步 |
| "BTC 形态" / "patterns" | 执行第 2 步（patterns 分类） |
| "BTC 背离" / "divergence" | 执行第 2 步（divergence 分类） |
| "BTC 支撑阻力" / "structure" | 执行第 2 步（structure 分类） |
| "BTC 图表" / "chart BTC" | 模式: chart，执行第 1+2+9 步 |
| "BTC --chart --save" | 模式: quick+chart，执行第 1+2+6+9 步（含 PNG 保存） |
| "BTC 完整分析 --chart" | 模式: full+chart，执行全部步骤含图表 |
| "BTC 交易" / "trade BTC" | 模式: trade，执行第 1-6+10 步（完整分析→盈利判定→条件交易） |
| "trade BTC --risk 3 --leverage 10" | 模式: trade，自定义风险 3%、杠杆 10x |
| "trade BTC --type spot" | 模式: trade+spot，执行第 1-6+10 步（现货交易模式） |
| "trade BTC --dry-run" | 模式: trade，执行分析+生成交易计划但不下单 |
| "trade BTC --confirm" | 模式: trade，信号达标时跳过确认直接下单 |

---

## 错误处理

- MCP 工具调用失败：检查 `okx-trade-mcp` 是否已配置为 MCP Server，自动回退至 CLI
- okx CLI 执行失败：检查是否已安装（`npm install -g okx-trade-mcp` 或 `npm install -g okx-trade-cli`）及网络连接
- API 限频：调用间隔 1 秒，减少并发
- 外部 API 失败（CoinMetrics/Deribit/CoinGlass/FRED/CoinGecko）：优雅降级，标记 N/A，使用可用数据子集评分
- COINGLASS_API_KEY 未设置：跳过 ETF 净流入和爆仓热力图，提示用户设置环境变量
- Deribit API 限频/不可用：跳过 DVOL，使用 BVOL（从K线自算已实现波动率）替代
- CoinMetrics API 失败：跳过 MVRV，宏观评分自动调整权重到其他可用指标
- OKX Rubik API 失败：跳过多空比和主动买卖量，衍生品评分使用资金费率+持仓量+基差
- K线数据不足：提示用户，减小指标周期
- 始终显示哪些数据源可用、哪些不可用
- 交易模式错误处理：
  - 余额不足：提示当前可用余额，建议降低仓位或风险比例
  - 杠杆设置失败：回退到当前杠杆，提示用户手动调整
  - 下单失败：显示完整错误信息，保留交易计划供用户手动执行
  - TP/SL 设置失败：主单不受影响，提示用户手动设置止盈止损
  - 分析评分未达标：输出完整分析报告，明确说明未达交易阈值原因
