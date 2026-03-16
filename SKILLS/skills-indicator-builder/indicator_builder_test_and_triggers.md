# indicator-builder 能力测试 & 触发词优化方案

## 一、多维度能力测试矩阵

### 1.1 测试维度总览

从 6 个角度全面检验 indicator-builder 的生成能力：

| 维度 | 说明 | 检测重点 |
|------|------|---------|
| A. 指标类型覆盖 | 趋势 / 动量 / 反转 / 数据 / 自定义混合 | 不同类型是否都能正确调研并生成 |
| B. 模式路径覆盖 | 调研模式 / 直接模式 / 混合模式 | 三种路径都能走通 |
| C. 数据源覆盖 | 纯 OHLCV / OKX 扩展 API / 外部 API / 多源融合 | 数据获取函数和对齐逻辑是否正确 |
| D. 复用能力 | 复用已有 calc* 函数 / 复用 formula_operators / 全新实现 | 是否正确调用已有库 |
| E. 边界与质量 | 空数组 / NaN / 浮点精度 / 单条数据 / 超长序列 | 代码健壮性 |
| F. 交付完整性 | 5 个文件齐全 / 命名规范 / 注释双语 / 测试≥5场景 | 交付标准一致性 |

### 1.2 建议测试用例（18 个场景）

#### A. 指标类型覆盖（5 个）

| # | 指标 | 类型 | 用户输入 | 预期模式 | 验证要点 |
|---|------|------|---------|---------|---------|
| A1 | Donchian Channel | 趋势 | "帮我做一个唐奇安通道指标" | 调研 | highest/lowest 滚动窗口 |
| A2 | KDJ / Stochastic | 动量 | "KDJ 指标" | 调研 | 多值输出(K,D,J)、超买超卖信号 |
| A3 | TD Sequential | 反转 | "TD 序列" | 调研 | 计数逻辑(setup 9 + countdown 13)复杂 |
| A4 | MVRV Z-Score | 数据(链上) | "MVRV" | 调研 | 需要外部链上数据 API |
| A5 | 自定义组合 | 混合 | "RSI<30 且 MACD 金叉时做多" | 直接 | 复用 calcRsi + calcMacd，AND 组合 |

#### B. 模式路径覆盖（3 个）

| # | 场景 | 用户输入 | 预期模式 | 验证要点 |
|---|------|---------|---------|---------|
| B1 | 纯名称 | "Supertrend" | 调研 | WebSearch ≥ 2 轮 |
| B2 | 完整逻辑 | "close > EMA(20) 且 vol > SMA(vol,20)*1.5 时信号=1" | 直接 | 跳过 Step 1 |
| B3 | 名称+部分描述 | "RSRS 指标，用最近18天的最高价最低价做线性回归" | 混合 | 调研补全斜率标准化等缺失部分 |

#### C. 数据源覆盖（4 个）

| # | 数据源 | 指标 | 验证要点 |
|---|--------|------|---------|
| C1 | 纯 OHLCV | Parabolic SAR | 只需 candles 接口 |
| C2 | OKX 扩展 API | 多空比反转 | `/rubik/stat/contracts-long-short-ratio` |
| C3 | 外部 API | 恐惧贪婪指数 | Alternative.me API |
| C4 | 多源融合 | "资金费率偏离 + OI 变化 + 价格动量" | 3 个不同 API 时间对齐 |

#### D. 复用能力（3 个）

| # | 场景 | 指标 | 验证要点 |
|---|------|------|---------|
| D1 | 复用 calc* | 双均线交叉 | 直接调用 calcEma × 2 + crossover |
| D2 | 复用 operators | 布林带突破 + 动量确认 | calcBbands + gt/lt + andSignals |
| D3 | 全新实现 | Fractal 分形 | Williams Fractal 需要自实现 5-bar 模式 |

#### E. 边界与质量（3 个）

| # | 边界场景 | 验证要点 |
|---|---------|---------|
| E1 | 空数组 / 单条数据 | 所有函数返回空结构，不崩溃 |
| E2 | NaN 输入 / 数据不足 | 前导 NaN 正确，不传播到后续 |
| E3 | 浮点精度 | 价格在 0.00001 级别(SHIB) 和 100000 级别(BTC) 都正确 |

### 1.3 现有测试通过的指标（已验证）

| 指标 | 类型 | 模式 | 测试结果 |
|------|------|------|---------|
| funding_rate_deviation | 数据 | 直接 | 11/11 ✅ |
| volatility_breakout | 趋势 | 直接 | 13/13 ✅ |
| cvd | 数据 | 调研 | 36/36 ✅ |

**覆盖缺口**：趋势(纯OHLCV)、动量、反转 类型尚未测试；复用 calc* 路径尚未测试。

---

## 二、用户触发提示词分类

### 2.1 当前 description 中的触发词

```
创建指标、新建指标、调研指标、指标生成、自定义公式、组合指标、
量化指标、技术指标、链上指标、CVD、RSRS、TD序列、Donchian、
Supertrend、Fractal、indicator builder、create indicator、custom formula
```

### 2.2 完整触发词分类（8 大类，覆盖中英文 + 口语化表达）

#### 类别 1：明确的创建/构建意图 ✅ 已全覆盖

**要求**：所有创建/构建相关动词必须全部覆盖。

| 提示词 | 语言 | 覆盖状态 |
|--------|------|---------|
| "创建指标" / "新建指标" / "指标生成" | 中 | ✅ |
| "做一个指标" / "写一个指标" / "搞一个指标" / "弄一个指标" | 中(口语) | ✅ |
| "帮我做一个XX指标" | 中(口语) | ✅ |
| "写一个XX的计算函数" | 中 | ✅ |
| "生成一个XX指标的代码" / "生成指标代码" | 中 | ✅ |
| "开发一个XX函数" / "开发指标" / "实现指标" | 中 | ✅ |
| "create indicator" / "build indicator" | 英 | ✅ |
| "implement indicator" / "develop indicator" / "code indicator" | 英 | ✅ |
| "add XX indicator to the toolkit" | 英 | ✅ |
| "make a new indicator for XX" / "make indicator" | 英 | ✅ |
| "write an indicator" / "generate indicator code" | 英 | ✅ |

#### 类别 2：调研/研究意图 ✅ 已全覆盖

**要求**：所有调研/研究相关表达必须全部覆盖，包括问句形式。

| 提示词 | 语言 | 覆盖状态 |
|--------|------|---------|
| "调研指标" / "调研XX" / "研究指标" | 中 | ✅ |
| "帮我调研一个指标" / "帮我研究XX指标" | 中(口语) | ✅ |
| "研究一下XX指标怎么算" | 中(口语) | ✅ |
| "XX 指标是怎么计算的" / "XX怎么算" | 中(问句) | ✅ |
| "XX 的公式是什么" | 中(问句) | ✅ |
| "查一下XX指标的原理" / "分析XX指标" | 中 | ✅ |
| "了解XX指标" / "学习XX指标" / "算一下XX" | 中 | ✅ |
| "research XX indicator" / "study indicator" | 英 | ✅ |
| "how does XX indicator work" / "what is XX formula" | 英 | ✅ |
| "explain XX indicator" / "analyze XX indicator" | 英 | ✅ |
| "look into XX indicator" | 英 | ✅ |

#### 类别 3：指标名称直接触发 ✅ 已覆盖 + 本地检查逻辑

**要求**：触发后先检查本地 `custom_indicators/{指标名}/` 是否已有实现。
- 已存在 → 告知用户，询问：查看现有 / 重新实现 / 在此基础上修改
- 不存在 → 进入调研模式生成新指标

| 提示词 | 覆盖状态 |
|--------|---------|
| CVD / RSRS / TD序列 / Donchian / Supertrend / Fractal | ✅ |
| KDJ / Stochastic / MACD 背离 / RSI 背离 | ✅ |
| 布林带突破 / Keltner 通道 / ADX | ✅ |
| Parabolic SAR / Ichimoku / VWAP | ✅ |
| OBV / MFI / Chaikin / CMF | ✅ |
| MVRV / SOPR / NUPL / NVT | ✅ |
| 恐惧贪婪指数 / Fear & Greed | ✅ |
| Squeeze Momentum / TTM Squeeze | ✅ |
| Williams %R / CCI / Aroon / DMI / TRIX | ✅ |
| Pivot Points / Fibonacci Retracement / Volume Profile | ✅ |

#### 类别 4：自定义/组合/融合逻辑 ✅ 已覆盖 + 融合分析能力

**要求**：理解用户多指标融合意图，分析各指标公式后设计统一组合方案。
融合方式包括：条件叠加型、加权打分型、过滤增强型、级联型。

| 提示词 | 语言 | 覆盖状态 |
|--------|------|---------|
| "自定义公式" / "组合指标" / "融合多个指标" | 中 | ✅ |
| "custom formula" / "combine indicators" / "composite indicator" | 英 | ✅ |
| "我想组合RSI和MACD做一个信号" | 中(口语) | ✅ |
| "当XX条件满足时做多" / "当XX且YY时做空" | 中(条件句) | ✅ |
| "combine XX and YY into one indicator" / "fuse indicators" | 英 | ✅ |
| "自定义一个策略信号" / "多指标联合判断" | 中 | ✅ |
| "写一个多因子打分指标" / "按XX打分排序" | 中 | ✅ |
| "把XX和YY合成一个指标" / "blend indicators" | 中/英 | ✅ |

#### 类别 5：与 agent-trade-kit 集成相关（保持现状）

| 提示词 | 语言 | 覆盖状态 |
|--------|------|---------|
| "indicator builder" | 英 | ✅ |
| "给 trade-kit 加一个指标" | 中 | ✅ |
| "在 MCP 里加一个指标工具" | 中 | ✅ |
| "add indicator to agent-trade-kit" | 英 | ✅ |
| "扩展 indicator tool" | 中 | ✅ |

#### 类别 6：量化/交易场景（保持现状）

| 提示词 | 语言 | 覆盖状态 |
|--------|------|---------|
| "量化指标" / "技术指标" / "链上指标" | 中 | ✅ |
| "交易信号" / "买卖信号" | 中 | ✅ |
| "trading signal" / "entry/exit signal" | 英 | ✅ |
| "量化因子" / "alpha 因子" | 中 | ✅ |
| "做一个趋势跟踪指标" / "做一个反转信号" | 中(场景) | ✅ |
| "momentum indicator" / "trend indicator" / "reversal signal" | 英 | ✅ |

#### 类别 7：修改/改进已有指标 ✅ 已覆盖 + 交互式修改流程

**要求**：先询问用户修改方向（波动率/成交量/时间框架/参数优化/信号过滤），
理解用户意图后，将已有指标与新维度重新组合成新指标。

| 提示词 | 语言 | 覆盖状态 |
|--------|------|---------|
| "改进XX指标" / "优化XX指标" / "修改指标" | 中 | ✅ |
| "给MACD加一个过滤条件" / "给XX加过滤条件" | 中 | ✅ |
| "modify the CVD indicator" / "improve indicator" | 英 | ✅ |
| "在已有指标上加XX" / "增强XX指标" | 中 | ✅ |
| "enhance indicator" / "add filter to XX" / "tweak XX" | 英 | ✅ |
| "调整XX参数" / "refine indicator" | 中/英 | ✅ |

#### 类别 8：隐式触发（不直接说"指标"）

| 提示词 | 语言 | 覆盖状态 |
|--------|------|---------|
| "帮我算一下RSI" / "算一下XX" | 中 | ✅ |
| "怎么判断超买超卖" | 中(问题) | ✅ |
| "BTC 的成交量趋势怎么看" | 中(分析) | ✅ |
| "calculate XX for me" | 英 | ✅ |
| "is XX overbought right now" / "how to detect divergence" | 英 | ✅ |

---

## 三、触发逻辑优化总结

### 3.1 已修复的缺口（全部已在 SKILL.md 中实现）

| 原缺口 | 修复方式 | 状态 |
|--------|---------|------|
| 类别 1 英文动词不足 | 补全 implement, develop, code, write, generate | ✅ 全覆盖 |
| 类别 2 问句/口语缺失 | 补全"XX怎么算"、"公式是什么"、"explain XX" | ✅ 全覆盖 |
| 类别 3 无本地检查 | Step 0.1 增加 `ls custom_indicators/` 检查，已存在时询问用户 | ✅ 已实现 |
| 类别 3 指标名不全 | 从 6 个扩展到 30+ 个，含 Williams %R, CCI, Aroon 等 | ✅ 已覆盖 |
| 类别 4 无融合能力 | Step 0.3 增加融合模式：拆解意图→公式分析→融合设计→确认 | ✅ 已实现 |
| 类别 7 无修改流程 | Step 0.4 增加修改模式：定位现有→询问方向→重组设计→确认 | ✅ 已实现 |
| 场景词缺失 | 补全"交易信号"、"买卖信号"、"趋势跟踪"、"反转信号" | ✅ 已覆盖 |
| 口语化条件句缺失 | 补全"当XX时做多"、"当XX且YY时做空" | ✅ 已覆盖 |

### 3.2 新增的执行模式（4 种 → SKILL.md Step 0）

| 模式 | 触发条件 | 关键行为 |
|------|---------|---------|
| 调研模式 | 只给指标名 | WebSearch → 公式 → 代码 |
| 直接模式 | 给出明确计算逻辑 | 跳过调研 → 公式 → 代码 |
| **融合模式** ⭐ | 多个指标名 + 组合意图 | 拆解→各子指标公式分析→设计融合方案→确认→代码 |
| **修改模式** ⭐ | 修改/改进/优化已有指标 | 定位现有→询问修改方向→重组设计→确认→代码 |

### 3.3 与 kline-indicator-research 的区分

| 维度 | indicator-builder | kline-indicator-research |
|------|-------------------|--------------------------|
| 产出物 | TypeScript 计算代码 + 测试 | 全套（PineScript、Python、PRD、UI、Lark） |
| 融合能力 | ✅ 多指标公式分析与融合 | ❌ 单指标研究 |
| 修改能力 | ✅ 交互式询问方向后重组 | ❌ 无修改流程 |
| 本地检查 | ✅ 检查已有实现 | ❌ 每次从头调研 |
| 集成目标 | agent-trade-kit | 独立文档交付 |

---

## 五、测试执行建议

### 5.1 快速验证路径（推荐 3 个指标覆盖核心缺口）

| 优先级 | 指标 | 覆盖维度 | 预计复杂度 |
|--------|------|---------|-----------|
| P0 | KDJ / Stochastic | 动量类 + 调研模式 + 多值输出 | 中 |
| P0 | Donchian Channel | 趋势类 + 纯OHLCV + 复用 operators | 低 |
| P1 | "RSI<30 且 MACD 金叉做多" | 直接模式 + 复用 calc* + 组合逻辑 | 中 |

### 5.2 完整回归测试路径（覆盖所有维度）

在上述 3 个基础上追加：

| 指标 | 覆盖缺口 |
|------|---------|
| TD Sequential | 反转类 + 高复杂度 |
| 恐惧贪婪指数 | 外部 API 数据源 |
| "资金费率偏离 + OI + 动量" | 多源融合 |
| Fractal | 全新实现(非复用) |
