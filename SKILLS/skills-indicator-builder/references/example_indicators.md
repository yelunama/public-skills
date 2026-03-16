# 示例自定义指标

## 示例 1：RSI-MACD 综合信号（组合指标）

### 需求描述
> "当 RSI 从超卖区上穿 30，同时 MACD 柱状图由负转正，产生买入信号；
> 当 RSI 从超买区下穿 70，同时 MACD 柱状图由正转负，产生卖出信号。"

### 公式定义表
| 步骤 | 操作 | 输入 | 参数 | 输出 |
|-----|------|------|------|------|
| 1 | RSI | close | period=14 | rsi |
| 2 | MACD | close | 12,26,9 | macd_hist |
| 3 | crossover | rsi, 30 | — | rsi_cross_up |
| 4 | crossunder | rsi, 70 | — | rsi_cross_down |
| 5 | 比较 | hist>0 AND hist[-1]<0 | — | macd_flip_up |
| 6 | 比较 | hist<0 AND hist[-1]>0 | — | macd_flip_down |
| 7 | AND | rsi_cross_up, macd_flip_up | — | buy_signal |
| 8 | AND | rsi_cross_down, macd_flip_down | — | sell_signal |

### 计算函数
```typescript
export interface RsiMacdSignalResult {
  rsi: number[];
  macdHist: number[];
  buySignal: boolean[];
  sellSignal: boolean[];
  /** 综合得分 -100~100，正=看多 负=看空 */
  score: number[];
}

export function calcRsiMacdSignal(
  closes: number[],
  rsiPeriod: number = 14,
  macdFast: number = 12,
  macdSlow: number = 26,
  macdSignal: number = 9,
): RsiMacdSignalResult {
  const len = closes.length;
  const rsi = calcRsi(closes, rsiPeriod);
  const macd = calcMacd(closes, macdFast, macdSlow, macdSignal);

  const buySignal = new Array(len).fill(false);
  const sellSignal = new Array(len).fill(false);
  const score = new Array(len).fill(NaN);

  for (let i = 1; i < len; i++) {
    if (isNaN(rsi[i]) || isNaN(rsi[i-1]) ||
        isNaN(macd.histogram[i]) || isNaN(macd.histogram[i-1])) {
      continue;
    }

    const rsiCrossUp = rsi[i-1] <= 30 && rsi[i] > 30;
    const rsiCrossDown = rsi[i-1] >= 70 && rsi[i] < 70;
    const histFlipUp = macd.histogram[i-1] < 0 && macd.histogram[i] > 0;
    const histFlipDown = macd.histogram[i-1] > 0 && macd.histogram[i] < 0;

    buySignal[i] = rsiCrossUp && histFlipUp;
    sellSignal[i] = rsiCrossDown && histFlipDown;

    // 综合得分：RSI 贡献 + MACD 柱状图方向
    const rsiScore = (rsi[i] - 50) * 2; // -100~100
    const macdScore = macd.histogram[i] > 0 ? 50 : -50;
    score[i] = Math.max(-100, Math.min(100, rsiScore * 0.6 + macdScore * 0.4));
  }

  return { rsi, macdHist: macd.histogram, buySignal, sellSignal, score };
}
```

---

## 示例 2：资金费率偏离度（外部数据指标）

### 需求描述
> "计算当前资金费率相对于过去 N 期均值的偏离程度，
> 当偏离度超过 2 个标准差时产生信号。"

### 数据源
- OKX `/api/v5/public/funding-rate-history`
- 字段：fundingRate, ts
- 频率：每 8 小时一次

### 公式
```
偏离度 = (当前费率 - SMA(费率, N)) / StdDev(费率, N)
```

### 计算函数
```typescript
export interface FundingDeviationResult {
  deviation: number[];
  mean: number[];
  upperBand: number[];
  lowerBand: number[];
}

export function calcFundingDeviation(
  fundingRates: number[],
  period: number = 30,
  mult: number = 2,
): FundingDeviationResult {
  const mean = calcSma(fundingRates, period);
  const len = fundingRates.length;
  const deviation = new Array(len).fill(NaN);
  const upperBand = new Array(len).fill(NaN);
  const lowerBand = new Array(len).fill(NaN);

  for (let i = period - 1; i < len; i++) {
    if (isNaN(mean[i])) continue;
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = fundingRates[j] - mean[i];
      sumSq += diff * diff;
    }
    const std = Math.sqrt(sumSq / period);
    if (std > 0) {
      deviation[i] = (fundingRates[i] - mean[i]) / std;
    } else {
      deviation[i] = 0;
    }
    upperBand[i] = mean[i] + mult * std;
    lowerBand[i] = mean[i] - mult * std;
  }

  return { deviation, mean, upperBand, lowerBand };
}
```

### 数据获取函数（indicator.ts 中）
```typescript
async function fetchFundingRateHistory(
  instId: string,
  limit: number,
  context: { client: import("../client/rest-client.js").OkxRestClient },
): Promise<{ ts: number[]; rates: number[] }> {
  const response = await context.client.publicGet(
    "/api/v5/public/funding-rate-history",
    compactObject({ instId, limit }),
    publicRateLimit("funding_rate", 10),
  );
  const raw = (response.data as Array<Record<string, string>>) ?? [];
  // 逆序转正序
  const sorted = [...raw].reverse();
  return {
    ts: sorted.map(r => Number(r.fundingTime)),
    rates: sorted.map(r => Number(r.fundingRate)),
  };
}
```

---

## 示例 3：自适应动量（价量混合指标）

### 需求描述
> "根据波动率自动调整动量指标的回看周期。
> 高波动时用短周期（快速响应），低波动时用长周期（减少噪音）。"

### 公式
```
volatility = ATR(14) / close  // 相对波动率
adaptive_period = round(min_period + (max_period - min_period) * (1 - volatility_percentile))
momentum = ROC(close, adaptive_period)
```

### 计算函数
```typescript
export interface AdaptiveMomentumResult {
  momentum: number[];
  adaptivePeriod: number[];
  volatility: number[];
}

export function calcAdaptiveMomentum(
  highs: number[], lows: number[], closes: number[],
  atrPeriod: number = 14,
  minPeriod: number = 5,
  maxPeriod: number = 50,
  volLookback: number = 100,
): AdaptiveMomentumResult {
  const len = closes.length;
  const atr = calcAtr(highs, lows, closes, atrPeriod);

  // 相对波动率
  const relVol = new Array(len).fill(NaN);
  for (let i = 0; i < len; i++) {
    if (!isNaN(atr[i]) && closes[i] > 0) {
      relVol[i] = atr[i] / closes[i];
    }
  }

  // 波动率百分位
  const momentum = new Array(len).fill(NaN);
  const adaptivePeriod = new Array(len).fill(NaN);

  for (let i = volLookback; i < len; i++) {
    if (isNaN(relVol[i])) continue;

    // 计算百分位
    let below = 0;
    let total = 0;
    for (let j = i - volLookback; j <= i; j++) {
      if (!isNaN(relVol[j])) {
        total++;
        if (relVol[j] < relVol[i]) below++;
      }
    }
    const percentile = total > 0 ? below / total : 0.5;

    // 自适应周期：高波动→短周期
    const period = Math.round(minPeriod + (maxPeriod - minPeriod) * (1 - percentile));
    adaptivePeriod[i] = period;

    // 动量 = ROC
    if (i >= period && !isNaN(closes[i - period]) && closes[i - period] > 0) {
      momentum[i] = ((closes[i] - closes[i - period]) / closes[i - period]) * 100;
    }
  }

  return { momentum, adaptivePeriod, volatility: relVol };
}
```

---

## 通用模板

新指标的最小代码模板：

```typescript
// ─── indicator-calc.ts 新增 ────────────────────────────────

export interface {Name}Result {
  values: number[];
  // ...其他字段
}

export function calc{Name}(
  closes: number[],
  period: number = 默认值,
): {Name}Result {
  const len = closes.length;
  const values = new Array(len).fill(NaN);

  // 计算逻辑
  for (let i = period - 1; i < len; i++) {
    values[i] = /* 你的公式 */;
  }

  return { values };
}

// ─── indicator.ts 新增 case ────────────────────────────────

case "{name}": {
  const period = args.period ?? 默认值;
  const result = calc{Name}(close, period);
  return {
    indicator: "{name}",
    params: { period },
    latest: result.values.findLast(v => !isNaN(v)) ?? null,
    lastTs, lastClose,
    series: trimNaN(ts, result.values),
  };
}
```
