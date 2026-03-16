# 外部数据源完整列表

## 一、OKX 公共 API（已集成）

### 行情数据
| 端点 | 说明 | 关键字段 | 频率 |
|------|------|---------|------|
| `/api/v5/market/candles` | K线蜡烛 | ts,o,h,l,c,vol | 1m~1M |
| `/api/v5/market/history-candles` | 历史K线 | 同上 | 同上 |
| `/api/v5/market/ticker` | 实时行情 | last,bidPx,askPx,vol24h | 实时 |
| `/api/v5/market/tickers` | 批量行情 | 同上(多币种) | 实时 |
| `/api/v5/market/books` | 深度 | asks[],bids[] | 实时 |
| `/api/v5/market/trades` | 最新成交 | px,sz,side,ts | 实时 |

### 衍生品数据
| 端点 | 说明 | 关键字段 |
|------|------|---------|
| `/api/v5/public/funding-rate` | 资金费率 | fundingRate,nextFundingRate,fundingTime |
| `/api/v5/public/funding-rate-history` | 历史资金费率 | fundingRate,realizedRate,ts |
| `/api/v5/public/open-interest` | 持仓量 | oi,oiCcy,ts |
| `/api/v5/public/open-interest-history` | 历史持仓量 | oi,oiCcy,ts |
| `/api/v5/public/insurance-fund` | 保险基金 | balance,ts |

### Rubik 统计数据
| 端点 | 说明 | 关键字段 |
|------|------|---------|
| `/api/v5/rubik/stat/contracts-long-short-ratio` | 多空比 | ts,ratio |
| `/api/v5/rubik/stat/taker-volume` | 主动买卖量 | ts,buyVol,sellVol |
| `/api/v5/rubik/stat/margin-lending-ratio` | 借币比率 | ts,ratio |
| `/api/v5/rubik/stat/option-open-interest-volume` | 期权OI/成交量 | ts,oi,vol |

## 二、链上数据 API

### Glassnode（需 API Key）
- 基础URL: `https://api.glassnode.com/v1/metrics`
- 认证: `?api_key=YOUR_KEY`
- 免费层: 部分指标，1天延迟

| 指标类别 | 端点示例 | 字段 |
|---------|---------|------|
| MVRV | `/market/mvrv` | t, v (ratio) |
| SOPR | `/indicators/sopr` | t, v (ratio) |
| NUPL | `/indicators/net_unrealized_profit_loss` | t, v (ratio) |
| NVT | `/indicators/nvt` | t, v (ratio) |
| 活跃地址 | `/addresses/active_count` | t, v (count) |
| 交易所净流入 | `/transactions/transfers_to_exchanges_count` | t, v |

### CryptoQuant（需 API Key）
- 基础URL: `https://api.cryptoquant.com/v1`
- 免费层: 有限额

| 指标 | 端点 | 字段 |
|------|------|------|
| 交易所储备 | `/btc/exchange-flows/reserve` | date, value |
| 矿工流出 | `/btc/miner-flows/outflow` | date, value |
| 市场周期 | `/btc/market-indicator/puell-multiple` | date, value |

### DefiLlama（免费，无需 Key）
- 基础URL: `https://api.llama.fi`

| 端点 | 说明 | 字段 |
|------|------|------|
| `/v2/historicalChainTvl/{chain}` | 链TVL历史 | date, tvl |
| `/protocol/{protocol}` | 协议详情 | tvl, chainTvls |
| `/stablecoins` | 稳定币供应 | totalCirculatingUSD |

## 三、市场情绪数据

### Alternative.me（免费）
- URL: `https://api.alternative.me/fng/`
- 参数: `?limit=30&format=json`
- 字段: `{ data: [{ value, value_classification, timestamp }] }`
- 值域: 0(极度恐惧) ~ 100(极度贪婪)

### CoinGlass（部分免费）
- URL: `https://open-api.coinglass.com/public/v2/`
- 端点: `funding`, `open_interest`, `liquidation`

## 四、传统金融数据

### Yahoo Finance（通过 yfinance 或直接 API）
- 股指: ^SPX, ^DJI, ^IXIC
- VIX: ^VIX
- 国债: ^TNX (10年期)
- 美元指数: DX-Y.NYB

### FRED API（免费，需注册）
- URL: `https://api.stlouisfed.org/fred/series/observations`
- 利率: FEDFUNDS
- CPI: CPIAUCSL
- M2货币供应: M2SL

## 五、用户自定义数据

### CSV 格式要求
```
timestamp,value1,value2,...
1709251200000,100.5,200.3,...
```
- 第一列必须为毫秒时间戳或 ISO 日期
- 数值列使用浮点数
- 缺失值留空或使用 NaN

### JSON 格式要求
```json
{
  "data": [
    { "ts": 1709251200000, "value": 100.5 },
    ...
  ]
}
```

### 自定义 REST API
用户提供：
- URL 模板: `https://api.example.com/data?symbol={instId}&from={startTs}`
- 认证方式: none / apiKey / bearer
- 响应路径: `data[].value` (JSONPath)
- 时间字段路径: `data[].timestamp`

## 六、数据对齐策略

当混合不同频率的数据源时：

| 策略 | 适用场景 | 实现 |
|------|---------|------|
| Forward Fill | 低频数据对齐高频 | 使用最近的已知值 |
| 线性插值 | 平滑数据 | 两端已知值线性内插 |
| 最近时间戳 | 非均匀采样 | 找最近的时间戳匹配 |
| 降采样 | 高频对齐低频 | 取区间最后一个值 |

```typescript
// Forward Fill 示例
function forwardFill(ts: number[], values: number[], targetTs: number[]): number[] {
  const result = new Array(targetTs.length).fill(NaN);
  let j = 0;
  for (let i = 0; i < targetTs.length; i++) {
    while (j < ts.length - 1 && ts[j + 1] <= targetTs[i]) j++;
    if (ts[j] <= targetTs[i]) result[i] = values[j];
  }
  return result;
}
```
