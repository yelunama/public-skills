# 现有指标函数签名与模式

## indicator-calc.ts 函数签名

所有函数遵循统一模式：纯函数、零IO、时间正序输入、NaN前导期。

### reverseCandleData
```typescript
function reverseCandleData(candles: string[][]): {
  ts: number[]; open: number[]; high: number[];
  low: number[]; close: number[]; vol: number[];
}
```
将 OKX API 返回的逆序K线数据转为正序。

### calcEma
```typescript
function calcEma(values: number[], period: number): number[]
```
指数移动平均。种子值=前 period 个值的 SMA。前 period-1 个值为 NaN。

### calcSma
```typescript
function calcSma(values: number[], period: number): number[]
```
简单移动平均。滑动窗口求和。前 period-1 个值为 NaN。

### calcRsi
```typescript
function calcRsi(closes: number[], period: number = 14): number[]
```
Wilder 平滑法 RSI。需要至少 period+1 个数据点。前 period 个值为 NaN。

### calcMacd
```typescript
function calcMacd(
  closes: number[], fast: number = 12,
  slow: number = 26, signal: number = 9
): MacdResult
// MacdResult = { macd: number[]; signal: number[]; histogram: number[] }
```
MACD = EMA(fast) - EMA(slow)，信号线 = EMA(MACD, signal)，柱状图 = MACD - 信号线。

### calcBbands
```typescript
function calcBbands(
  closes: number[], period: number = 20, mult: number = 2
): BbandsResult
// BbandsResult = { upper: number[]; middle: number[]; lower: number[] }
```
布林带。middle = SMA(period)，upper/lower = middle ± mult × stddev。

### calcAtr
```typescript
function calcAtr(
  highs: number[], lows: number[], closes: number[],
  period: number = 14
): number[]
```
ATR = Wilder 平滑的 True Range。首个 ATR = 前 period 个 TR 的 SMA。

### calcSummary
```typescript
function calcSummary(
  highs: number[], lows: number[], closes: number[]
): IndicatorSummary
```
一次性计算所有指标最新值。返回结构化对象。

## indicator.ts ToolSpec 模式

### 注册结构
```typescript
export function registerIndicatorTools(): ToolSpec[] {
  return [{
    name: "indicator",
    module: "market",
    description: "...",
    isWrite: false,
    inputSchema: { type: "object", properties: {...}, required: ["instId", "indicator"] },
    handler: async (rawArgs, context) => { ... }
  }];
}
```

### 路由表
```typescript
const INDICATOR_NAMES = ["rsi","macd","ema","sma","bbands","atr","summary"] as const;
const ROUTING_TABLE: Record<IndicatorName, "local" | "server"> = { ... };
```

### handler 管线
```
rawArgs → parse → fetchCandles → reverseCandleData → computeIndicator → response
```

### response 格式
```typescript
{
  endpoint: string,      // API 端点
  requestTime: string,   // 请求时间
  data: {
    indicator: string,   // 指标名
    params: {...},       // 参数
    latest: number|null, // 最新值
    lastTs: number,      // 最新时间戳
    lastClose: number,   // 最新收盘价
    series: Array<[number, number]> | Array<Record<string, number>>
  }
}
```

### 系列压缩
- 单值指标：`trimNaN(ts, values)` → `[[ts, value], ...]`
- 多值指标：`trimNaNMulti(ts, {key: values})` → `[{ts, key: value}, ...]`
- 精度：`round6(v)` = 6位小数
