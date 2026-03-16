#!/usr/bin/env bash
# analyze.sh — Run TradingAgents_Crypto analysis
# Called by the analyze-crypto OpenClaw skill.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../.." && pwd)"
TRADING_DIR="$REPO_ROOT/TradingAgents_Crypto"

if [[ ! -d "$TRADING_DIR" ]]; then
  echo "ERROR: TradingAgents_Crypto not found at $TRADING_DIR" >&2
  exit 1
fi

SYMBOL="${1:-BTC-USD}"
DATE="${2:-$(date +%Y-%m-%d)}"

# Normalise bare symbols: BTC → BTC-USD
if [[ "$SYMBOL" != *"-"* && "$SYMBOL" != *"/"* ]]; then
  SYMBOL="${SYMBOL^^}-USD"
fi

echo "Analysing $SYMBOL on $DATE …"
exec python3 "$TRADING_DIR/main_crypto.py" "$SYMBOL" "$DATE"
