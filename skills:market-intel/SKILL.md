---
name: market-intel
description: Get comprehensive crypto market intelligence — open interest, funding rates, long/short ratio, liquidations, and Hyperliquid whale activity from CoinGlass
user-invocable: true
metadata: {"openclaw":{"primaryEnv":"COINGLASS_API_KEY","requires":{"bins":["node"],"env":["COINGLASS_API_KEY"]}}}
---

## Usage

`/market-intel [SYMBOL]`

- **SYMBOL** — crypto symbol without suffix: `BTC`, `ETH`, `SOL` (default: `BTC`)

## Steps

1. Parse SYMBOL from the request. Normalise to uppercase, strip `-USD` / `USDT` suffixes.

2. Run the market intelligence query:

```bash
node "$(dirname "$0")/coinglass.mjs" SYMBOL
```

3. The script fetches 5 data points from CoinGlass in parallel:
   - **Open Interest** — total OI across exchanges + 24h change
   - **Funding Rates** — current rate per exchange + average
   - **Long/Short Ratio** — account L/S ratio trend (1h, last 24 points)
   - **Liquidations** — 24h longs vs shorts across exchanges
   - **Hyperliquid Whales** — recent large trades (≥$100k)

4. After the script outputs the raw data, write a concise market intelligence report (~250 words):
   - **Market Structure**: OI trend and what it signals (accumulation / distribution)
   - **Funding Sentiment**: positive = longs paying = bullish crowding, negative = bearish bias
   - **Crowd Positioning**: L/S ratio — extreme readings often precede reversals
   - **Liquidation Risk**: which side (longs or shorts) faces greater cascade risk
   - **Whale Activity**: notable large trades and what side they favor
   - **Overall Bias**: bullish / bearish / neutral with a confidence level (low / medium / high)
