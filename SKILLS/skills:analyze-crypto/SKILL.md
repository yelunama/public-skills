---
name: analyze-crypto
description: Run full multi-agent AI analysis on a crypto asset — 9 specialized agents produce a BUY/HOLD/SELL signal with detailed reasoning
user-invocable: true
metadata: {"openclaw":{"requires":{"bins":["python3"],"env":["OPENAI_API_KEY"]}}}
---

## Usage

`/analyze-crypto [SYMBOL] [DATE]`

- **SYMBOL** — crypto ticker: `BTC`, `ETH`, `SOL`, `BTC-USD`, `ETH-USD` (default: `BTC-USD`)
- **DATE** — analysis date `YYYY-MM-DD` (default: today)

## Steps

1. Parse SYMBOL and optional DATE from the request.
   - Bare symbols like `BTC` → append `-USD` → `BTC-USD`
   - If no DATE, use today's date in `YYYY-MM-DD` format

2. Run the analysis pipeline:

```bash
bash "$(dirname "$0")/analyze.sh" SYMBOL DATE
```

3. The pipeline runs 9 agents in sequence:
   - **Fundamentals Analyst** → CoinGecko data (market cap, supply, ATH, developer activity)
   - **Market Analyst** → OHLCV + RSI, MACD, Bollinger Bands, ATR
   - **News Analyst** → Crypto market news and macro sentiment
   - **Social Analyst** → Community sentiment
   - **Bull Researcher** → Bullish thesis with supporting evidence
   - **Bear Researcher** → Bearish thesis and downside risks
   - **Trader** → Synthesises both sides into a trade recommendation
   - **Risk Manager** → Position sizing and risk parameters
   - **Portfolio Manager** → Final BUY / HOLD / SELL decision

4. Stream the output. After the pipeline completes, present a concise summary:
   - **Signal**: BUY / HOLD / SELL
   - **Confidence**: extracted from portfolio manager
   - **Key Bull Points** (2–3 bullet points)
   - **Key Bear Points** (2–3 bullet points)
   - **Risk Notes**: from risk manager
