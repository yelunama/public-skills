---
name: indicator-builder
description: >
  量化指标自动调研与TypeScript代码生成，集成到agent-trade-kit。四种模式：调研、直接生成、多指标融合、修改已有指标。
  触发：创建/新建/做/写/生成/开发/实现指标，调研/研究指标，XX怎么算，XX公式，
  create/build/implement/research indicator，
  CVD、RSRS、TD序列、KDJ、Donchian、Supertrend、Fractal、SAR、Ichimoku、ADX、OBV、VWAP、MFI、MVRV、SOPR、NUPL、Squeeze Momentum，
  组合/融合指标、自定义公式、多因子打分、combine/composite indicator，
  改进/优化/修改指标、improve/enhance indicator，
  量化指标、技术指标、链上指标、交易信号、trading signal、indicator builder。
  只产出TypeScript代码和测试。如需PineScript/PRD/UI设计稿请用kline-indicator-research。
---

# K 线指标构建器（Indicator Builder）

## 概述

本技能将"指标名称或想法"变成"可集成到 agent-trade-kit 的可运行代码"。

**核心能力**：
- **自动调研**：用户只给指标名，自动搜索原理、公式、参数推荐
- **公式推导**：将调研结果转为标准计算步骤
- **代码生成**：产出兼容 `indicator-calc.ts` 的纯函数代码
- **验证测试**：自动生成并运行测试脚本

**不包含**（已精简）：
- ❌ PineScript 代码
- ❌ Python 回测代码
- ❌ iOS / Android App 代码
- ❌ PRD 文档
- ❌ UI 设计稿
- ❌ Lark 文档更新

如需上述交付物，使用 `kline-indicator-research` skill。

---

## 支持的指标类型

**趋势类**：Donchian 通道、Keltner 通道、布林带突破、双均线交叉、
三均线系统、自适应均线（AMA/KAMA）、ADX、Supertrend、Parabolic SAR、
ATR 突破、Squeeze Momentum

**动量类**：MACD 变体、RSI 动量、KDJ/Stochastic、OBV、VWAP 偏离、
动量因子轮动、动量衰减检测

**反转类**：RSI 背离、MACD 背离、OBV 背离、TD Sequential、TD Combo、
Fractal 分形、RSRS（阻力支撑相对强度）、均值回归、布林带反转

**数据类**：CVD（累积成交量差值）、资金费率偏离、未平仓合约变化、
多空比、MVRV、SOPR、NUPL、交易所净流入、恐惧贪婪指数

**自定义**：用户描述的任意组合逻辑

---

## 全流程步骤

### 第 0 步：需求理解与模式判定

与用户确认以下信息（如已在对话中提供则直接提取）：

1. **指标名称或描述**
2. **指标类型**：价量指标 / 组合指标 / 外部数据指标 / 混合指标
3. **目标用途**：信号生成 / 风控过滤 / 仪表盘展示 / 回测因子

#### 0.1 本地存在检查（类别 3 触发时必须执行）

当用户直接说出指标名时，**先检查本地是否已有实现**：

```bash
ls custom_indicators/{指标名}/ 2>/dev/null
```

- **已存在** → 告知用户：
  "本地已有 `{指标名}` 的实现（{N} 个文件），你想：
  A. 查看/使用现有实现
  B. 重新实现（覆盖）
  C. 在此基础上修改（进入修改模式）"
  等待用户选择后再继续。
- **不存在** → 继续下方模式判定。

#### 0.2 模式判定

根据用户输入决定执行路径：

| 用户输入 | 模式 | 是否调研 |
|---------|------|---------|
| 只给指标名（如"CVD"、"RSRS"） | 调研模式 | ✅ 执行第 1 步 |
| 给出明确计算逻辑 | 直接模式 | ⏭️ 跳到第 2 步 |
| 指标名 + 部分描述 | 混合模式 | ✅ 调研补全缺失信息 |
| 多个指标名 + 组合/融合意图 | **融合模式** | ✅ 执行第 0.3 步 |
| 修改/改进/优化已有指标 | **修改模式** | ⏭️ 执行第 0.4 步 |

#### 0.3 融合模式（类别 4：多指标组合/融合）

当用户提到多个指标并表达组合意图时（如"组合 RSI 和 MACD 做一个信号"、
"把波动率和动量融合成一个打分指标"），执行以下分析：

1. **拆解意图**：识别用户提到的所有指标名和组合目标
2. **公式分析**：对每个子指标确认其公式（已有的直接引用，未知的先调研）
3. **融合设计**：根据用户目标设计融合方式：
   - **条件叠加型**：`AND/OR` 逻辑组合多个信号（如 RSI<30 且 MACD 金叉）
   - **加权打分型**：多因子加权评分（如 0.4×RSI分 + 0.3×MACD分 + 0.3×OBV分）
   - **过滤增强型**：主信号 + 过滤器（如 Supertrend 信号 + ATR 波动率过滤）
   - **级联型**：一个指标的输出作为另一个的输入（如 RSI 的 RSI）
4. **向用户确认融合方案后**，进入第 2 步继续执行

#### 0.4 修改模式（类别 7：改进/优化已有指标）

当用户表达修改、改进、优化已有指标的意图时：

1. **定位现有实现**：检查 `custom_indicators/` 和内置 `indicator-calc.ts` 中的已有代码
2. **询问修改方向**：主动询问用户想从哪个维度改进，例如：
   - 波动率维度：加入 ATR / 布林带宽度作为过滤
   - 成交量维度：加入 OBV / 成交量确认
   - 时间框架：多周期确认 / 高低时间框架联动
   - 参数优化：调整默认参数、增加自适应参数
   - 信号过滤：减少假信号、加入确认条件
   - 其他：用户自述方向
3. **重组设计**：根据用户选择的修改方向，将已有指标与新维度重新组合，
   设计新的计算公式
4. **向用户确认修改方案后**，进入第 2 步，产出全新的文件集（新指标名命名）

---

### 第 1 步：自动调研（调研模式 / 混合模式）

**目标**：搞清楚指标的数学原理、核心公式、常用参数、加密货币适配建议。

**执行方式**：

1. **WebSearch 搜索**（至少 2 轮）：
   - 英文搜索：`"{指标名} indicator formula calculation cryptocurrency"`
   - 中文搜索：`"{指标名} 计算公式 量化 加密货币"`
   - 补充搜索（如需要）：`"{指标名} TradingView PineScript"` （PineScript 社区通常有最清晰的公式）

2. **从搜索结果中提取**：
   - 数学公式（精确的计算步骤）
   - 输入数据要求（需要哪些字段：OHLCV / 资金费率 / 链上数据等）
   - 参数默认值与推荐值
   - 信号生成条件（买卖/背离/突破等）
   - 加密货币市场适配建议

3. **整理为调研摘要**（内部使用，不单独输出文件）：
   ```
   指标名：XXX
   核心公式：（精确数学表达）
   输入数据：（字段列表）
   参数：（名称、默认值、推荐值）
   信号逻辑：（做多/做空/中性条件）
   注意事项：（边界情况、近似计算方式等）
   ```

**注意**：
- 调研的目的是获取精确公式，不是写研报
- 部分网站可能被 WebFetch 拦截，依赖 WebSearch 摘要即可
- TradingView PineScript 社区和 Investopedia 通常有最清晰的公式定义
- 如果搜索结果中公式不够清晰，追加搜索 `"{指标名} calculation step by step"`

---

### 第 2 步：数据源确认

根据调研结果（或用户描述），确认所需数据源。

**内置数据源**（agent-trade-kit 已支持的 OKX API）：

| 数据类型 | API 端点 | 字段 |
|---------|---------|------|
| K线蜡烛 | `/api/v5/market/candles` | ts, open, high, low, close, vol |
| 实时行情 | `/api/v5/market/ticker` | last, bid, ask, vol24h |
| 资金费率 | `/api/v5/public/funding-rate` | fundingRate, nextFundingRate |
| 持仓量 | `/api/v5/public/open-interest` | oi, oiCcy |
| 多空比 | `/api/v5/rubik/stat/contracts-long-short-ratio` | ratio |
| 买卖量 | `/api/v5/rubik/stat/taker-volume` | buyVol, sellVol |

**外部数据源**（如需要，搜索 API 可用性）：
- 链上数据：Glassnode、CryptoQuant、DefiLlama
- 市场情绪：Alternative.me（恐惧贪婪）、Santiment
- 传统金融：Yahoo Finance、FRED

产出 **`{指标名}_data_spec.md`**：
- 所需数据源列表
- 每个字段的名称、类型、获取方式
- 时间对齐策略
- 缺失数据处理规则

---

### 第 3 步：公式定义

将调研结果 / 用户描述转为标准化计算步骤表。

**计算步骤表格式**：

```markdown
| 步骤 | 操作 | 输入 | 参数 | 输出变量 |
|-----|------|------|------|---------|
| 1   | XXX  | close | period=14 | result_1 |
| 2   | YYY  | result_1 | — | result_2 |
| ...  | AND  | cond_1, cond_2 | — | signal |
```

**可复用的已有计算函数**（来自 indicator-calc.ts）：
- `calcRsi(closes, period)` → number[]
- `calcMacd(closes, fast, slow, signal)` → { macd, signal, histogram }
- `calcEma(values, period)` → number[]
- `calcSma(values, period)` → number[]
- `calcBbands(closes, period, mult)` → { upper, middle, lower }
- `calcAtr(highs, lows, closes, period)` → number[]

**可复用的组合运算符**（来自 references/formula_operators.md）：
- `crossover(a, b)` / `crossunder(a, b)` — 交叉检测
- `highest(values, period)` / `lowest(values, period)` — 滚动极值
- `change(values, n)` / `roc(values, n)` — 变化量/变化率
- `stddev(values, period)` — 滚动标准差
- `normalize(values, period)` — Z-Score 标准化
- `slope(values, period)` — 线性回归斜率
- `andSignals(a, b)` / `orSignals(a, b)` — 逻辑组合
- `gt(a, b)` / `lt(a, b)` — 逐元素比较

产出 **`{指标名}_formula.md`**：
- 计算步骤表
- 参数表（名称、默认值、说明）
- 输出结构定义（接口字段说明）

---

### 第 4 步：代码生成

#### 4.1 生成计算函数 `{指标名}_calc.ts`

遵循 `indicator-calc.ts` 规范：

```typescript
// 模板
export interface {IndicatorName}Result {
  // 各输出字段
}

export function calc{IndicatorName}(
  // 输入：按需选取 closes, highs, lows, vol, externalData
  // 参数：带默认值
): {IndicatorName}Result {
  // 1. 空数组保护：if (len === 0) return 空结构
  // 2. 中间计算（复用已有 calc* 函数或自行实现）
  // 3. 组合逻辑
  // 4. 返回结果
}
```

**代码规范**：
- 零 IO 依赖，纯函数，确定性输入→输出
- 输入数组为时间正序（oldest-first）
- NaN 表示数据不足的前导期
- 空数组保护：每个内部函数检查 `len === 0` 提前返回
- 浮点数比较使用 `EPSILON = 1e-15` 而非 `!== 0`
- 导出接口类型
- 代码注释中英双语

#### 4.2 生成路由补丁 `{指标名}_tool_patch.ts`

注释形式的集成指南，说明在 indicator.ts 中：
- INDICATOR_NAMES 添加什么
- ROUTING_TABLE 添加什么
- IndicatorArgs 添加什么参数
- inputSchema 添加什么定义
- computeIndicator switch 添加什么 case
- MCP 调用示例 JSON

#### 4.3 外部数据获取函数（仅当需要非 OKX candles 数据时）

```typescript
async function fetch{DataName}(
  instId: string,
  params: Record<string, unknown>,
): Promise<{ ts: number[]; values: number[] }>
```

---

### 第 5 步：验证测试

生成测试脚本 `{指标名}_test.mjs`（使用 `.mjs` + `node` 运行，不依赖 tsx）：

**必须覆盖的场景**：
1. 正常数据 — 验证核心计算正确性
2. 空数组 — 返回空结构
3. 数据不足（length < period）— 无信号，NaN 处理正确
4. 边界条件 — 根据指标特性设计（如仅满足部分条件时不触发信号）
5. 参数自定义 — 非默认参数下计算正确

**执行方式**：
```bash
node custom_indicators/{指标名}/{指标名}_test.mjs
```

运行测试，修复失败项直到全部通过。

---

### 第 6 步：文件整理

将所有文件整理到 `custom_indicators/{指标名}/`：

```
custom_indicators/{指标名}/
├── {指标名}_data_spec.md      # 数据源规格
├── {指标名}_formula.md        # 公式定义
├── {指标名}_calc.ts           # 计算函数代码
├── {指标名}_tool_patch.ts     # ToolSpec 路由补丁
└── {指标名}_test.mjs          # 验证脚本
```

---

## 执行策略

**调研模式**（用户只给指标名）：
1. 第 0.1 步 → 检查本地是否已有实现
2. 第 0.2 步 → 确认指标名，判定为调研模式
3. 第 1 步 → WebSearch 调研原理和公式
4. 第 2 步 → 确认数据源，产出 data_spec.md
5. 第 3 步 → 推导公式，产出 formula.md
6. 第 4 步 → 生成 calc.ts + tool_patch.ts
7. 第 5 步 → 生成 test.mjs 并运行验证
8. 第 6 步 → 整理文件

**直接模式**（用户给出明确计算逻辑）：
1. 第 0.2 步 → 提取计算逻辑，判定为直接模式
2. 第 2 步 → 确认数据源（跳过调研）
3. 第 3 步 → 直接定义公式
4. 第 4~6 步 → 同上

**融合模式**（用户提到多个指标 + 组合意图）：
1. 第 0.3 步 → 拆解用户意图，分析各子指标公式，设计融合方案
2. 向用户确认融合方案
3. 第 2~6 步 → 按融合方案执行（对未知子指标先调研）

**修改模式**（用户要改进/优化已有指标）：
1. 第 0.4 步 → 定位现有实现，询问用户修改方向
2. 设计重组方案，向用户确认
3. 第 2~6 步 → 按重组方案执行，产出新指标文件集

**每一步产出后继续下一步，无需等待用户确认**（除非公式有歧义需要澄清）。
融合模式和修改模式在第 0 步需要用户确认方案后再继续。

---

## 质量标准

- 调研模式下，公式必须基于至少 2 个搜索来源交叉验证
- 生成的计算函数必须为纯函数，零 IO 依赖
- 所有数组操作使用时间正序（oldest-first）
- NaN 处理与 indicator-calc.ts 现有函数一致
- 空数组保护：每个函数 `len === 0` 时返回空结构
- 浮点数比较使用 EPSILON 而非 `!== 0`
- TypeScript 类型完整，导出接口定义
- 测试至少覆盖 5 个场景（正常、空数组、不足、边界、自定义参数）
- 代码注释使用中英双语

---

## 参考资源

如需更详细的信息，读取 `references/` 目录下的文件：
- `references/existing_indicators.md` — 现有指标函数签名和模式
- `references/data_sources.md` — 外部数据源完整列表与 API 详情
- `references/formula_operators.md` — 组合运算符实现代码
- `references/integration_guide.md` — 代码集成到 agent-trade-kit 的详细步骤
- `references/example_indicators.md` — 3 个完整示例指标及通用模板
