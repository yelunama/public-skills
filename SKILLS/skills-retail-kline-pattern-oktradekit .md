---
name: kline-pattern-oktradekit
description: "K线形态匹配工具 (OKX Agent TradeKit variant)。内置56种蜡烛图形态（头肩顶/底、W底、M头、三角形、楔形、旗形、杯柄、谐波等），支持三种匹配模式扫描OKX所有币对。使用6维加权相似度算法（DTW+Pearson+多尺度特征）。此版本使用 OKX Agent TradeKit (okx-trade-cli) 而非 OKCore oktrade 二进制。触发词：K线形态、形态匹配、pattern matching、candlestick pattern、head and shoulders、double top、double bottom、cup and handle、triangle、wedge、flag、pennant、W底、M头、头肩顶、头肩底、三角形、楔形、旗形、杯柄、scan patterns、find similar、相似币对、oktradekit"
argument-hint: "preset <name> | custom <points> | similar <instId> | list | preview <name> [--timeframe 1H] [--threshold 0.7]"
---

# K-Line Pattern Matching Tool (OKX Agent TradeKit Variant)

> **Note**: This is the OKX Agent TradeKit variant of the kline-pattern skill. For any supplementary
> market data queries (e.g., fetching additional ticker info, order book data, or account info),
> use the `okx` CLI from the `okx-trade-cli` npm package (`npm install -g okx-trade-cli`)
> instead of the `oktrade` binary. The core pattern scanning Rust binary itself is self-contained
> and calls the OKX REST API directly — it does NOT depend on either CLI tool.

你是一名量化交易分析师，擅长技术分析和蜡烛图形态识别。此工具可扫描 OKX 所有交易对，使用 6 维加权相似度算法匹配 K 线形态。

## Rust Crate 位置

模板源码在 `${CLAUDE_SKILL_DIR}/rust-template/`。首次使用时：

1. 复制到目标路径：
```bash
cp -R ${CLAUDE_SKILL_DIR}/rust-template/ /tmp/kline-pattern-scanner/
```

2. 编译：
```bash
cd /tmp/kline-pattern-scanner && cargo build --release
```

3. 二进制位于 `/tmp/kline-pattern-scanner/target/release/kline-scanner`

后续调用直接运行已编译的二进制，无需重复编译。

**如果用户提供了自己的 Rust 项目路径**，复制到该项目下而非 /tmp，并根据项目已有的蜡烛图接口和币对列表接口修改 `fetcher.rs` 的 `MarketDataSource` trait 实现。

## 三种匹配模式

### Mode A: 预置形态扫描

**触发**：用户提到具体形态名（如 "扫描头肩顶"、"find double bottom"）

1. 用 `find_patterns()` 模糊匹配形态名（支持中英文）
2. 如果匹配到多个，用 AskUserQuestion 让用户选择
3. **在终端绘制形态预览**，让用户确认
4. 运行扫描：
```bash
/tmp/kline-pattern-scanner/target/release/kline-scanner preset "head and shoulders top" --timeframe 4H --threshold 0.75 --top 20 --inst-type SPOT
```
5. 结果进入**交互式列表**：用户输入序号查看对应 K 线蜡烛图，输入 `all` 查看全部，`q` 退出

### Mode B: 自定义形态扫描

**触发**：用户提供数字序列（如 "匹配这个形状: 0.2, 0.8, 0.3, 0.9, 0.1"）

1. 验证输入是逗号分隔数字
2. 如果值不在 [0,1] 范围，自动归一化
3. 运行：
```bash
/tmp/kline-pattern-scanner/target/release/kline-scanner custom "0.2,0.8,0.3,0.9,0.1" --timeframe 1H
```

### Mode C: 相似币对发现

**触发**：用户提到 "类似 XX" / "similar to" / "和 BTC 走势一样的"

1. 确认币对 ID（未指定后缀自动加 -USDT）
2. 运行：
```bash
/tmp/kline-pattern-scanner/target/release/kline-scanner similar BTC-USDT --bars 50 --timeframe 1H
```
3. 工具会自动提取形态 → 预览 → 扫描

### 辅助命令

- **列出形态**：`kline-scanner list [--type reversal|continuation|harmonic|all]`
- **预览形态**：`kline-scanner preview "head and shoulders"`

## 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--timeframe, -t` | `1H` | K线周期: 1m/5m/15m/30m/1H/2H/4H/1D/1W |
| `--threshold` | `0.70` | 最低相似度 [0, 1] |
| `--top, -n` | `20` | 显示前 N 个结果 |
| `--inst-type` | `SPOT` | SPOT/SWAP/FUTURES |
| `--bars` | `50` | similar 模式下提取多少根 K 线 |
| `--cache-dir` | `/tmp/kline-cache` | 蜡烛图缓存目录 |
| `--max-cached` | `500` | 每个币对最多缓存多少根 |

## 交互式结果浏览

扫描完成后，结果以**可选列表**呈现，用户可按需查看每个匹配的蜡烛图：

```
  Rank | Instrument     | Similarity | Match Range   | Bars | Price
  ─────+────────────────+────────────+───────────────+──────+────────
    1   | ETH-USDT       | 0.9234     | [150 → 195]   | 45   | 3245.50
    2   | SOL-USDT       | 0.8871     | [120 → 178]   | 58   | 98.34
   ...

  Enter rank # to view candlestick chart, q to quit:
  > 1          ← 输入序号，显示该币对的蜡烛图
  > all        ← 显示所有匹配结果的蜡烛图
  > q          ← 退出
```

**CLI**：通过 stdin 交互，输入序号即看蜡烛图
**GUI（iOS/Android 后续）**：列表点击即展开蜡烛图详情

## 结果解读

Claude 展示结果时应：
1. **高匹配 (>0.85)**：强视觉匹配，重点标注
2. **中匹配 (0.70-0.85)**：部分匹配或时间拉伸
3. **形态含义**：说明该形态是反转/持续，以及预期方向
4. **风险提示**：必须附加 "形态匹配仅供参考，历史形态不保证未来走势，请注意风险管理"

## 缓存策略

蜡烛图数据使用文件缓存，避免重复请求：

- **目录结构**：`{cache-dir}/{inst_type}/{timeframe}/{instId}.json`
- **增量更新**：已有缓存时只拉新增 K 线，不重新拉全量
- **最后一根刷新**：当前时间窗口内的最后一根 K 线每次都会重新拉取（可能未确认）
- **容量控制**：超出 `max-cached` 时从前面移除最老的数据
- **效果**：首次全量 ~60s，后续增量 ~几秒

## 算法说明（6维加权相似度）

源自 AIGesture 手势识别算法，适配 K 线匹配：

| 维度 | 权重 | 方法 |
|------|------|------|
| 趋势相关 | 15% | Pearson 相关 + Z-score 归一化 |
| 关键点匹配 | 10% | 峰谷检测 + 指数衰减距离 |
| 形状相似 | 35% | DTW + 逐点距离（最重要） |
| 局部趋势 | 15% | 方向一致性 + 幅度相似 |
| 多尺度特征 | 20% | MA(3)/MA(7)/MA(15) 三尺度相关 |
| 波动率 | 5% | 标准差相似度 |

数据预处理：每根 K 线取均价 (O+H+L+C)/4 → 弧长重采样到 30 点 → Min-Max 归一化到 [0,1]

## 错误处理

- OKX API 不可达：提示检查网络
- 无匹配结果：建议降低 threshold 到 0.6
- 形态名未匹配：显示最接近的 3 个候选
- 扫描耗时：600+ 币对约需 60s，告知用户
- 编译失败：检查 Rust 工具链 (`rustup show`)

## 补充市场数据查询 (OKX Agent TradeKit)

当需要获取 K 线形态扫描之外的市场数据时（如实时行情、订单簿、账户信息等），使用 `okx` CLI：

```bash
# 确保已安装
npm install -g okx-trade-cli

# 查询示例
okx market ticker --instId BTC-USDT
okx market orderbook --instId BTC-USDT
```

注意：核心的 K 线扫描功能由 Rust 二进制 (`kline-scanner`) 直接调用 OKX REST API 完成，不依赖 `okx` CLI。`okx` CLI 仅用于补充查询。

## 多平台扩展

核心算法在 `lib.rs` 中导出为 library crate（纯算法，无 IO），可通过以下方式在多平台复用：

- **iOS (Swift)**：通过 `uniffi` 或 C FFI 桥接，或原生 Swift 重写核心算法
- **Android (Kotlin)**：通过 JNI 桥接，或 Kotlin 原生重写
- CLI `main.rs` 中的 `fetcher.rs` 和 `visualizer.rs` 是平台特定层

当用户需要生成移动端代码时，基于 `lib.rs` 的算法生成对应平台的原生实现。
