---
name: okx-position
description: Show OKX account balances, open swap/spot positions, and recent orders
user-invocable: true
metadata: {"openclaw":{"requires":{"bins":["node"],"env":["OKX_API_KEY","OKX_SECRET_KEY","OKX_PASSPHRASE"]}}}
---

## Usage

`/okx-position [SYMBOL]`

- **SYMBOL** — optional instrument filter, e.g. `BTC-USDT`, `ETH-USDT-SWAP` (default: all)

## Steps

The OKX CLI binary is located at:

```
<repo>/OKX_MCP/packages/cli/dist/index.js
```

Resolve the repo root from the skill directory:

```bash
SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../.." && pwd)"
OKX="node $REPO_ROOT/OKX_MCP/packages/cli/dist/index.js"
```

Then run all three queries in sequence:

**1. Account balance:**
```bash
$OKX account balance
```

**2. All open swap positions:**
```bash
$OKX swap positions
```

**3. Recent swap orders (last 10):**
```bash
$OKX swap orders
```

**4. Recent spot orders (last 10):**
```bash
$OKX spot orders
```

If SYMBOL was given, add `--instId SYMBOL` (or use the swap instrument format `SYMBOL-SWAP` for swap queries).

## Output Format

After collecting the raw JSON output, present a clean summary:

### Account Balance
Table of currency → total equity → available.

### Open Positions
Table: Instrument | Side | Size | Entry Price | Mark Price | Unrealised PnL | Liq Price | Leverage

If no open positions: "No open positions."

### Recent Activity (last 5 orders combined)
Table: Time | Instrument | Side | Type | Size | Fill Price | Status

### Risk Summary
- Largest position by notional value
- Any position within 10% of its liquidation price (⚠️ warning)
- Total unrealised PnL across all positions
