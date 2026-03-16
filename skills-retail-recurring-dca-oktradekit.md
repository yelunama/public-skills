---
description: "Recurring Buy (DCA) - create, manage, auto start/stop dollar-cost averaging strategies on OKX (OKX TradeKit)"
---

# Recurring Buy (DCA) System (OKX TradeKit)

Manage OKX recurring buy (dollar-cost averaging) strategies via OKX Recurring Buy OpenAPI (`/api/v5/tradingBot/recurring/*`), with condition-based auto start/stop.

## Setup

Use `okx` CLI directly (from `npm install -g okx-trade-cli`).

Verify availability:
```bash
which okx || echo "Install with: npm install -g okx-trade-cli"
```

Use `okx` as `$OKX` in all commands below (used only for market data queries in Section 5).

Ensure OKX API credentials are configured via one of:
1. Environment variables: `OKX_API_KEY`, `OKX_SECRET_KEY`, `OKX_PASSPHRASE`
2. `~/.oktrade.env` file (format: `OKX_API_KEY="..."`)
3. `~/.okx/config.toml` file (format: `api_key = "..."`)

Set `OKX_SIMULATED=true` for demo trading mode.

---

## OKX Recurring Buy Auth Helper

All recurring buy API calls use this Python inline function. It handles credential loading, HMAC-SHA256 signing (matching `v5_client.rs`), and request execution.

```bash
# Auth helper function — paste into any Python heredoc that needs API access
# Credentials: env vars > ~/.oktrade.env > ~/.okx/config.toml
# Signing: Base64(HMAC-SHA256(timestamp + method + request_path + body, secret_key))
# Demo mode: OKX_SIMULATED=true -> x-simulated-trading: 1

python3 << 'PYEOF'
import os, json, hmac, hashlib, base64, urllib.request, urllib.error
from datetime import datetime, timezone

def load_credentials():
    """Load OKX API credentials: env vars > ~/.oktrade.env > ~/.okx/config.toml"""
    api_key = os.environ.get("OKX_API_KEY", "")
    secret_key = os.environ.get("OKX_SECRET_KEY", "")
    passphrase = os.environ.get("OKX_PASSPHRASE", "")
    simulated = os.environ.get("OKX_SIMULATED", "false").lower() == "true"

    if api_key and secret_key and passphrase:
        return api_key, secret_key, passphrase, simulated

    # Try ~/.oktrade.env
    env_path = os.path.expanduser("~/.oktrade.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                line = line.removeprefix("export ").strip()
                if "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"')
                    if k == "OKX_API_KEY" and not api_key: api_key = v
                    if k == "OKX_SECRET_KEY" and not secret_key: secret_key = v
                    if k == "OKX_PASSPHRASE" and not passphrase: passphrase = v
                    if k == "OKX_SIMULATED" and v.lower() == "true": simulated = True
        if api_key and secret_key and passphrase:
            return api_key, secret_key, passphrase, simulated

    # Try ~/.okx/config.toml (simple key=value parse)
    toml_path = os.path.expanduser("~/.okx/config.toml")
    if os.path.exists(toml_path):
        with open(toml_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("["):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"').strip("'")
                    if k == "api_key" and not api_key: api_key = v
                    if k == "secret_key" and not secret_key: secret_key = v
                    if k == "passphrase" and not passphrase: passphrase = v
                    if k == "simulated" and v.lower() == "true": simulated = True

    if not all([api_key, secret_key, passphrase]):
        print("ERROR: OKX credentials not found. Set OKX_API_KEY/OKX_SECRET_KEY/OKX_PASSPHRASE env vars or create ~/.oktrade.env")
        raise SystemExit(1)
    return api_key, secret_key, passphrase, simulated


def okx_recurring_api(method, path, body=None, query=None):
    """Call OKX API with HMAC-SHA256 signing. Returns parsed JSON response."""
    api_key, secret_key, passphrase, simulated = load_credentials()

    # Build sign path (GET includes query string, POST does not)
    sign_path = path
    url = "https://www.okx.com" + path
    if query:
        qs = "&".join(f"{k}={v}" for k, v in query.items())
        sign_path = f"{path}?{qs}"
        url = f"https://www.okx.com{path}?{qs}"

    body_str = ""
    if body is not None:
        body_str = json.dumps(body)

    # Timestamp: ISO 8601 with milliseconds (e.g. 2024-03-11T10:30:00.123Z)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + \
         f"{datetime.now(timezone.utc).microsecond // 1000:03d}Z"

    # HMAC-SHA256 signature: Base64(HMAC-SHA256(timestamp+method+request_path+body, secret))
    prehash = ts + method.upper() + sign_path + body_str
    mac = hmac.new(secret_key.encode(), prehash.encode(), hashlib.sha256)
    signature = base64.b64encode(mac.digest()).decode()

    headers = {
        "OK-ACCESS-KEY": api_key,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": ts,
        "OK-ACCESS-PASSPHRASE": passphrase,
        "Content-Type": "application/json",
        "User-Agent": "okx-python/1.0",
    }
    if simulated:
        headers["x-simulated-trading"] = "1"

    data = body_str.encode() if body_str else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode() if e.fp else str(e)
        print(f"HTTP {e.code}: {err_body}")
        raise SystemExit(1)
    except Exception as e:
        print(f"Request failed: {e}")
        raise SystemExit(1)

    if result.get("code") != "0":
        print(f"API Error: code={result.get('code')}, msg={result.get('msg')}")
        if result.get("data"):
            for item in result["data"]:
                print(f"  sCode={item.get('sCode')}, sMsg={item.get('sMsg')}")
        raise SystemExit(1)

    return result.get("data", [])

# Example usage:
# result = okx_recurring_api("POST", "/api/v5/tradingBot/recurring/order-algo", body={...})
# result = okx_recurring_api("GET", "/api/v5/tradingBot/recurring/orders-algo-pending", query={"algoId": "123"})
PYEOF
```

---

## 1. Create a Recurring Buy

Creates a server-side recurring buy order via `POST /api/v5/tradingBot/recurring/order-algo`. The DCA runs on OKX servers — it continues even after Claude Code exits.

```bash
# Single coin: BTC daily 50 USDT at 10:00 UTC+8
python3 << 'PYEOF'
import os, json, hmac, hashlib, base64, urllib.request, urllib.error
from datetime import datetime, timezone

def load_credentials():
    api_key = os.environ.get("OKX_API_KEY", "")
    secret_key = os.environ.get("OKX_SECRET_KEY", "")
    passphrase = os.environ.get("OKX_PASSPHRASE", "")
    simulated = os.environ.get("OKX_SIMULATED", "false").lower() == "true"
    if api_key and secret_key and passphrase:
        return api_key, secret_key, passphrase, simulated
    env_path = os.path.expanduser("~/.oktrade.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"): continue
                line = line.removeprefix("export ").strip()
                if "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"')
                    if k == "OKX_API_KEY" and not api_key: api_key = v
                    if k == "OKX_SECRET_KEY" and not secret_key: secret_key = v
                    if k == "OKX_PASSPHRASE" and not passphrase: passphrase = v
                    if k == "OKX_SIMULATED" and v.lower() == "true": simulated = True
        if api_key and secret_key and passphrase:
            return api_key, secret_key, passphrase, simulated
    toml_path = os.path.expanduser("~/.okx/config.toml")
    if os.path.exists(toml_path):
        with open(toml_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("["): continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"').strip("'")
                    if k == "api_key" and not api_key: api_key = v
                    if k == "secret_key" and not secret_key: secret_key = v
                    if k == "passphrase" and not passphrase: passphrase = v
                    if k == "simulated" and v.lower() == "true": simulated = True
    if not all([api_key, secret_key, passphrase]):
        print("ERROR: OKX credentials not found.")
        raise SystemExit(1)
    return api_key, secret_key, passphrase, simulated

def okx_recurring_api(method, path, body=None, query=None):
    api_key, secret_key, passphrase, simulated = load_credentials()
    sign_path = path
    url = "https://www.okx.com" + path
    if query:
        qs = "&".join(f"{k}={v}" for k, v in query.items())
        sign_path = f"{path}?{qs}"
        url = f"https://www.okx.com{path}?{qs}"
    body_str = json.dumps(body) if body is not None else ""
    now = datetime.now(timezone.utc)
    ts = now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"
    prehash = ts + method.upper() + sign_path + body_str
    mac = hmac.new(secret_key.encode(), prehash.encode(), hashlib.sha256)
    signature = base64.b64encode(mac.digest()).decode()
    headers = {
        "OK-ACCESS-KEY": api_key, "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": ts, "OK-ACCESS-PASSPHRASE": passphrase,
        "Content-Type": "application/json",
        "User-Agent": "okx-python/1.0",
    }
    if simulated: headers["x-simulated-trading"] = "1"
    data = body_str.encode() if body_str else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode() if e.fp else str(e)
        print(f"HTTP {e.code}: {err_body}")
        raise SystemExit(1)
    except Exception as e:
        print(f"Request failed: {e}")
        raise SystemExit(1)
    if result.get("code") != "0":
        print(f"API Error: code={result.get('code')}, msg={result.get('msg')}")
        if result.get("data"):
            for item in result["data"]:
                print(f"  sCode={item.get('sCode')}, sMsg={item.get('sMsg')}")
        raise SystemExit(1)
    return result.get("data", [])

# --- Create recurring buy order ---
# Substitute $COINS, $AMT, $PERIOD, $NAME, etc. before running
COINS = "$COINS"       # e.g. "BTC" or "BTC:0.6,ETH:0.4"
AMT = "$AMT"           # e.g. "50"
PERIOD = "$PERIOD"     # hourly / daily / weekly / monthly
NAME = "$NAME"         # strategy name, e.g. "BTC Daily DCA"
INVESTMENT_CCY = "$INVESTMENT_CCY"  # default: USDT
TD_MODE = "$TD_MODE"   # default: cross
RECURRING_DAY = "$RECURRING_DAY"    # optional: 1-7 (weekly) or 1-28 (monthly)
RECURRING_HOUR = "$RECURRING_HOUR"  # optional: 1,4,8,12 (hourly only)
RECURRING_TIME = "$RECURRING_TIME"  # required: 0-23 (hour of day to execute)
TIME_ZONE = "$TIME_ZONE"           # optional: e.g. "8" for UTC+8

# Parse coins into recurringList
def parse_coins(coins_str):
    result = []
    for part in coins_str.split(","):
        part = part.strip()
        if not part: continue
        if ":" in part:
            ccy, ratio = part.split(":", 1)
            result.append({"ccy": ccy.strip().upper(), "ratio": ratio.strip()})
        else:
            result.append({"ccy": part.upper(), "ratio": "1"})
    return result

recurring_list = parse_coins(COINS)
body = {
    "stgyName": NAME,
    "recurringList": recurring_list,
    "period": PERIOD,
    "amt": AMT,
    "investmentCcy": INVESTMENT_CCY if INVESTMENT_CCY != "$INVESTMENT_CCY" else "USDT",
    "tdMode": TD_MODE if TD_MODE != "$TD_MODE" else "cross",
    "recurringTime": RECURRING_TIME if RECURRING_TIME != "$RECURRING_TIME" else "10",
}
if PERIOD == "hourly":
    body["recurringHour"] = RECURRING_HOUR if RECURRING_HOUR and RECURRING_HOUR != "$RECURRING_HOUR" else "1"
if RECURRING_DAY and RECURRING_DAY != "$RECURRING_DAY":
    body["recurringDay"] = RECURRING_DAY
if TIME_ZONE and TIME_ZONE != "$TIME_ZONE":
    body["timeZone"] = TIME_ZONE

result = okx_recurring_api("POST", "/api/v5/tradingBot/recurring/order-algo", body=body)
if result:
    algo_id = result[0].get("algoId", "")
    print(f"Recurring buy created successfully!")
    print(f"  algoId: {algo_id}")
    print(f"  Name:   {NAME}")
    print(f"  Coins:  {COINS}")
    print(f"  Amount: {AMT} {body['investmentCcy']} / {PERIOD}")
else:
    print("No response data")
PYEOF
```

### Usage Examples

```bash
# Single coin: BTC daily 50 USDT at 10:00 UTC+8
# Set variables, then run the Python block above
COINS="BTC" AMT="50" PERIOD="daily" NAME="BTC Daily DCA" RECURRING_TIME="10" TIME_ZONE="8"

# Multi-coin: BTC 60% + ETH 40%, weekly 200 USDT on Monday at 9:00 UTC+8
COINS="BTC:0.6,ETH:0.4" AMT="200" PERIOD="weekly" NAME="BTC-ETH Portfolio" RECURRING_DAY="1" RECURRING_TIME="9" TIME_ZONE="8"

# Monthly DCA on the 1st at 10:00 UTC+8, 100 USDT
COINS="BTC" AMT="100" PERIOD="monthly" NAME="BTC Monthly" RECURRING_DAY="1" RECURRING_TIME="10" TIME_ZONE="8"

# Hourly micro-DCA (every 1 hour), 50 USDT across BTC/SOL/ETH (min 10 USDT per coin)
COINS="BTC:0.5,SOL:0.3,ETH:0.2" AMT="50" PERIOD="hourly" NAME="Micro Hourly" RECURRING_HOUR="1"
```

### Parameters

| Param | Description | Default |
|-------|-------------|---------|
| `--coins` | Coin allocation. "BTC" or "BTC:0.6,ETH:0.4" | Required |
| `--amt` | Amount per period (USDT). Each coin must receive >= 10 USDT (e.g. 3 coins need amt >= 50) | Required |
| `--period` | hourly / daily / weekly / monthly | daily |
| `--name` | Strategy name | "CLI DCA" |
| `--investment-ccy` | Investment currency | USDT |
| `--td-mode` | Trade mode: cross / cash | cross |
| `--recurring-day` | 1-7 (Mon-Sun) for weekly, 1-28 for monthly | - |
| `--recurring-hour` | Hourly interval: 1, 4, 8, or 12 (hourly period only) | - |
| `--recurring-time` | Hour of day to execute (0-23). Required for all periods | - |
| `--time-zone` | Timezone offset, e.g. "8" for UTC+8 | - |

---

## 2. Manage Recurring Orders

All management operations use OKX server-side APIs. No local files.

```bash
# List all running DCA plans
# GET /api/v5/tradingBot/recurring/orders-algo-pending
python3 << 'PYEOF'
import os, json, hmac, hashlib, base64, urllib.request, urllib.error
from datetime import datetime, timezone

def load_credentials():
    api_key = os.environ.get("OKX_API_KEY", "")
    secret_key = os.environ.get("OKX_SECRET_KEY", "")
    passphrase = os.environ.get("OKX_PASSPHRASE", "")
    simulated = os.environ.get("OKX_SIMULATED", "false").lower() == "true"
    if api_key and secret_key and passphrase:
        return api_key, secret_key, passphrase, simulated
    env_path = os.path.expanduser("~/.oktrade.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"): continue
                line = line.removeprefix("export ").strip()
                if "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"')
                    if k == "OKX_API_KEY" and not api_key: api_key = v
                    if k == "OKX_SECRET_KEY" and not secret_key: secret_key = v
                    if k == "OKX_PASSPHRASE" and not passphrase: passphrase = v
                    if k == "OKX_SIMULATED" and v.lower() == "true": simulated = True
        if api_key and secret_key and passphrase:
            return api_key, secret_key, passphrase, simulated
    toml_path = os.path.expanduser("~/.okx/config.toml")
    if os.path.exists(toml_path):
        with open(toml_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("["): continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"').strip("'")
                    if k == "api_key" and not api_key: api_key = v
                    if k == "secret_key" and not secret_key: secret_key = v
                    if k == "passphrase" and not passphrase: passphrase = v
                    if k == "simulated" and v.lower() == "true": simulated = True
    if not all([api_key, secret_key, passphrase]):
        print("ERROR: OKX credentials not found.")
        raise SystemExit(1)
    return api_key, secret_key, passphrase, simulated

def okx_recurring_api(method, path, body=None, query=None):
    api_key, secret_key, passphrase, simulated = load_credentials()
    sign_path = path
    url = "https://www.okx.com" + path
    if query:
        qs = "&".join(f"{k}={v}" for k, v in query.items())
        sign_path = f"{path}?{qs}"
        url = f"https://www.okx.com{path}?{qs}"
    body_str = json.dumps(body) if body is not None else ""
    now = datetime.now(timezone.utc)
    ts = now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"
    prehash = ts + method.upper() + sign_path + body_str
    mac = hmac.new(secret_key.encode(), prehash.encode(), hashlib.sha256)
    signature = base64.b64encode(mac.digest()).decode()
    headers = {
        "OK-ACCESS-KEY": api_key, "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": ts, "OK-ACCESS-PASSPHRASE": passphrase,
        "Content-Type": "application/json",
        "User-Agent": "okx-python/1.0",
    }
    if simulated: headers["x-simulated-trading"] = "1"
    data = body_str.encode() if body_str else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode() if e.fp else str(e)
        print(f"HTTP {e.code}: {err_body}")
        raise SystemExit(1)
    except Exception as e:
        print(f"Request failed: {e}")
        raise SystemExit(1)
    if result.get("code") != "0":
        print(f"API Error: code={result.get('code')}, msg={result.get('msg')}")
        if result.get("data"):
            for item in result["data"]:
                print(f"  sCode={item.get('sCode')}, sMsg={item.get('sMsg')}")
        raise SystemExit(1)
    return result.get("data", [])

import sys
ACTION = "$ACTION"  # list / detail / sub-orders / history / stop / amend
ALGO_ID = "$ALGO_ID"
NEW_NAME = "$NEW_NAME"

if ACTION == "list":
    data = okx_recurring_api("GET", "/api/v5/tradingBot/recurring/orders-algo-pending")
    if not data:
        print("No pending recurring buy orders")
    else:
        print(f"{'#':<4} {'algoId':<18} {'Name':<20} {'Coins':<15} {'Period':<8} {'Amount':<12} {'Invested':<12} {'PnL':<10} {'Cycles':<6} {'State':<8}")
        print("-" * 130)
        for i, o in enumerate(data):
            coins = "+".join(c.get("ccy", "-") for c in o.get("recurringList", []))
            print(f"{i+1:<4} {o.get('algoId',''):<18} {o.get('stgyName',''):<20} {coins:<15} {o.get('period',''):<8} {o.get('amt','') + ' ' + o.get('investmentCcy',''):<12} {o.get('investmentAmt','-'):<12} {o.get('totalPnl','-'):<10} {o.get('cycles','-'):<6} {o.get('state',''):<8}")
        print(f"\nTotal: {len(data)} orders")

elif ACTION == "detail":
    data = okx_recurring_api("GET", "/api/v5/tradingBot/recurring/orders-algo-details", query={"algoId": ALGO_ID})
    if not data:
        print("No recurring order found")
    else:
        o = data[0]
        print("=== Recurring Buy Detail ===")
        for k in ["algoId", "stgyName", "state", "period", "amt", "investmentCcy", "investmentAmt", "totalPnl", "pnlRatio", "totalAnnRate", "cycles", "mktCap", "cTime", "uTime"]:
            print(f"  {k}: {o.get(k, '-')}")
        rl = o.get("recurringList", [])
        if rl:
            print("  Coin Allocation:")
            for c in rl:
                print(f"    {c.get('ccy','-')}: {c.get('ratio','-')}%")

elif ACTION == "sub-orders":
    data = okx_recurring_api("GET", "/api/v5/tradingBot/recurring/sub-orders", query={"algoId": ALGO_ID})
    if not data:
        print("No sub-orders found")
    else:
        print(f"{'#':<4} {'ordId':<20} {'instId':<12} {'Side':<6} {'Size':<12} {'AvgPx':<12} {'Filled':<12} {'Fee':<10} {'State':<8} {'Time':<20}")
        print("-" * 130)
        for i, o in enumerate(data):
            print(f"{i+1:<4} {o.get('ordId',''):<20} {o.get('instId',''):<12} {o.get('side',''):<6} {o.get('sz',''):<12} {o.get('avgPx',''):<12} {o.get('accFillSz',''):<12} {o.get('fee',''):<10} {o.get('state',''):<8} {o.get('cTime',''):<20}")
        print(f"\nTotal: {len(data)} sub-orders")

elif ACTION == "history":
    data = okx_recurring_api("GET", "/api/v5/tradingBot/recurring/orders-algo-history")
    if not data:
        print("No recurring buy history")
    else:
        print(f"{'#':<4} {'algoId':<18} {'Name':<20} {'Coins':<15} {'Period':<8} {'Amount':<12} {'Invested':<12} {'PnL':<10} {'Cycles':<6} {'State':<8}")
        print("-" * 130)
        for i, o in enumerate(data):
            coins = "+".join(c.get("ccy", "-") for c in o.get("recurringList", []))
            print(f"{i+1:<4} {o.get('algoId',''):<18} {o.get('stgyName',''):<20} {coins:<15} {o.get('period',''):<8} {o.get('amt','') + ' ' + o.get('investmentCcy',''):<12} {o.get('investmentAmt','-'):<12} {o.get('totalPnl','-'):<10} {o.get('cycles','-'):<6} {o.get('state',''):<8}")
        print(f"\nTotal: {len(data)} orders")

elif ACTION == "stop":
    # IMPORTANT: stop API body is an ARRAY: [{"algoId": "..."}]
    data = okx_recurring_api("POST", "/api/v5/tradingBot/recurring/stop-order-algo", body=[{"algoId": ALGO_ID}])
    print(f"Recurring buy stopped: algoId={ALGO_ID}")

elif ACTION == "amend":
    body = {"algoId": ALGO_ID}
    if NEW_NAME and NEW_NAME != "$NEW_NAME":
        body["stgyName"] = NEW_NAME
    data = okx_recurring_api("POST", "/api/v5/tradingBot/recurring/amend-order-algo", body=body)
    print(f"Recurring buy amended: algoId={ALGO_ID}")

PYEOF
```

### API Mapping

| Operation | API Endpoint | Method |
|-----------|-------------|--------|
| List pending | `/api/v5/tradingBot/recurring/orders-algo-pending` | GET |
| Detail | `/api/v5/tradingBot/recurring/orders-algo-details?algoId=<ID>` | GET |
| Sub-orders | `/api/v5/tradingBot/recurring/sub-orders?algoId=<ID>` | GET |
| History | `/api/v5/tradingBot/recurring/orders-algo-history` | GET |
| Stop | `/api/v5/tradingBot/recurring/stop-order-algo` | POST (body is **array**: `[{"algoId":"..."}]`) |
| Amend | `/api/v5/tradingBot/recurring/amend-order-algo` | POST |

---

## 3. Auto Start/Stop DCA (Condition-based)

Automatically create or stop server-side DCA based on technical indicator conditions.
This is a one-shot check: evaluates conditions once and acts. Combine with cron or `/loop` for periodic monitoring.

### Usage Examples

```bash
# RSI-based: start daily DCA when RSI14 < 30, stop when RSI14 > 70
# Step 1: Fetch candles
$OKX --json market candles BTC-USDT --bar 1H --limit 100 > /tmp/okx_dca_candles.json

# Step 2: Compute indicators + evaluate conditions + call OKX Recurring API (see Full Auto Workflow below)

# Compound: start when RSI low AND funding rate negative (bearish + oversold)
START_COND="rsi14 < 30 AND funding_rate < -0.001" STOP_COND="rsi14 > 70 OR long_short_ratio > 2.5"

# Taker flow: start when contract takers are aggressively buying
START_COND="taker_buy_sell_ratio > 1.3 AND rsi14 < 50"

# Smart money: start when top traders go long AND retail is bearish
START_COND="top_trader_long_short > 1.5 AND long_short_ratio < 0.8"

# Options sentiment: start when put/call ratio is high (fear = contrarian buy)
START_COND="put_call_oi_ratio > 1.5 AND rsi14 < 40"

# Leverage: stop when margin loan ratio is extreme (over-leveraged market)
STOP_COND="margin_loan_ratio > 10 OR price_to_sell_limit_pct < 1"

# 24h price drop: start DCA when price drops > 10% in 24h
START_COND="price_change_24h_pct < -10"

# Basis: start when futures are at deep discount (basis negative)
START_COND="basis_pct < -0.5 AND funding_rate < 0"
```

### Signal Engine

Fetch candles and compute indicators inline with Python:

```bash
# Fetch candles
$OKX --json market candles $INST --bar $BAR --limit 100 > /tmp/okx_dca_candles.json

# Evaluate conditions
python3 << 'PYEOF'
import json, math, sys

with open("/tmp/okx_dca_candles.json") as f:
    data = json.load(f)

rows = data.get("data", [])
closes = [float(r[4]) for r in reversed(rows)]
highs = [float(r[2]) for r in reversed(rows)]
lows = [float(r[3]) for r in reversed(rows)]
volumes = [float(r[5]) for r in reversed(rows)]
n = len(closes)

# RSI
def calc_rsi(prices, period=14):
    if len(prices) < period + 1:
        return 50
    gains, losses = [], []
    for i in range(1, len(prices)):
        d = prices[i] - prices[i-1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)

# MACD
def calc_ema(prices, period):
    if not prices:
        return []
    ema = [prices[0]]
    k = 2 / (period + 1)
    for i in range(1, len(prices)):
        ema.append(prices[i] * k + ema[-1] * (1 - k))
    return ema

def calc_macd(prices):
    ema12 = calc_ema(prices, 12)
    ema26 = calc_ema(prices, 26)
    dif = [ema12[i] - ema26[i] for i in range(len(prices))]
    dea = calc_ema(dif, 9)
    histogram = [dif[i] - dea[i] for i in range(len(prices))]
    return dif[-1], dea[-1], histogram[-1]

# Bollinger Band position
def calc_bb_position(prices, period=20):
    if len(prices) < period:
        return 50
    sma = sum(prices[-period:]) / period
    std = (sum((p - sma)**2 for p in prices[-period:]) / period) ** 0.5
    if std == 0:
        return 50
    upper = sma + 2 * std
    lower = sma - 2 * std
    pos = (prices[-1] - lower) / (upper - lower) * 100
    return max(0, min(100, pos))

# SMA
def calc_sma(prices, period):
    if len(prices) < period:
        return prices[-1] if prices else 0
    return sum(prices[-period:]) / period

# ATR
def calc_atr(highs, lows, closes, period=14):
    if len(closes) < period + 1:
        return 0
    trs = []
    for i in range(1, len(closes)):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
        trs.append(tr)
    return sum(trs[-period:]) / period

# Volume ratio
def calc_vol_ratio(volumes, period=20):
    if len(volumes) < period + 1:
        return 1.0
    avg_vol = sum(volumes[-period-1:-1]) / period
    return volumes[-1] / avg_vol if avg_vol > 0 else 1.0

indicators = {
    "rsi14": round(calc_rsi(closes, 14), 2),
    "rsi6": round(calc_rsi(closes, 6), 2),
    "macd_dif": round(calc_macd(closes)[0], 6),
    "macd_dea": round(calc_macd(closes)[1], 6),
    "macd_histogram": round(calc_macd(closes)[2], 6),
    "bb_position": round(calc_bb_position(closes, 20), 2),
    "atr14": round(calc_atr(highs, lows, closes, 14), 6),
    "ma7": round(calc_sma(closes, 7), 2),
    "ma25": round(calc_sma(closes, 25), 2),
    "ma50": round(calc_sma(closes, 50), 2),
    "price": closes[-1] if closes else 0,
    "vol_ratio": round(calc_vol_ratio(volumes, 20), 2),
}

print(json.dumps(indicators, indent=2))
PYEOF
```

### Full Auto Start/Stop Workflow

Combine the signal engine with condition evaluation and OKX Recurring Buy API:

```bash
# Full auto workflow: fetch candles, compute indicators, evaluate, execute via OKX API
$OKX --json market candles $INST --bar $BAR --limit 100 > /tmp/okx_dca_candles.json

python3 << 'PYEOF'
import os, json, math, sys, hmac, hashlib, base64, urllib.request, urllib.error
from datetime import datetime, timezone

# ─── Auth Helper (inline) ────────────────────────────────────────────────────
def load_credentials():
    api_key = os.environ.get("OKX_API_KEY", "")
    secret_key = os.environ.get("OKX_SECRET_KEY", "")
    passphrase = os.environ.get("OKX_PASSPHRASE", "")
    simulated = os.environ.get("OKX_SIMULATED", "false").lower() == "true"
    if api_key and secret_key and passphrase:
        return api_key, secret_key, passphrase, simulated
    env_path = os.path.expanduser("~/.oktrade.env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"): continue
                line = line.removeprefix("export ").strip()
                if "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"')
                    if k == "OKX_API_KEY" and not api_key: api_key = v
                    if k == "OKX_SECRET_KEY" and not secret_key: secret_key = v
                    if k == "OKX_PASSPHRASE" and not passphrase: passphrase = v
                    if k == "OKX_SIMULATED" and v.lower() == "true": simulated = True
        if api_key and secret_key and passphrase:
            return api_key, secret_key, passphrase, simulated
    toml_path = os.path.expanduser("~/.okx/config.toml")
    if os.path.exists(toml_path):
        with open(toml_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("["): continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip('"').strip("'")
                    if k == "api_key" and not api_key: api_key = v
                    if k == "secret_key" and not secret_key: secret_key = v
                    if k == "passphrase" and not passphrase: passphrase = v
                    if k == "simulated" and v.lower() == "true": simulated = True
    if not all([api_key, secret_key, passphrase]):
        print("ERROR: OKX credentials not found.")
        raise SystemExit(1)
    return api_key, secret_key, passphrase, simulated

def okx_recurring_api(method, path, body=None, query=None):
    api_key, secret_key, passphrase, simulated = load_credentials()
    sign_path = path
    url = "https://www.okx.com" + path
    if query:
        qs = "&".join(f"{k}={v}" for k, v in query.items())
        sign_path = f"{path}?{qs}"
        url = f"https://www.okx.com{path}?{qs}"
    body_str = json.dumps(body) if body is not None else ""
    now = datetime.now(timezone.utc)
    ts = now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"
    prehash = ts + method.upper() + sign_path + body_str
    mac = hmac.new(secret_key.encode(), prehash.encode(), hashlib.sha256)
    signature = base64.b64encode(mac.digest()).decode()
    headers = {
        "OK-ACCESS-KEY": api_key, "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": ts, "OK-ACCESS-PASSPHRASE": passphrase,
        "Content-Type": "application/json",
        "User-Agent": "okx-python/1.0",
    }
    if simulated: headers["x-simulated-trading"] = "1"
    data_bytes = body_str.encode() if body_str else None
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode() if e.fp else str(e)
        print(f"HTTP {e.code}: {err_body}")
        raise SystemExit(1)
    except Exception as e:
        print(f"Request failed: {e}")
        raise SystemExit(1)
    if result.get("code") != "0":
        print(f"API Error: code={result.get('code')}, msg={result.get('msg')}")
        if result.get("data"):
            for item in result["data"]:
                print(f"  sCode={item.get('sCode')}, sMsg={item.get('sMsg')}")
        raise SystemExit(1)
    return result.get("data", [])

# ─── Indicator Engine ─────────────────────────────────────────────────────────
with open("/tmp/okx_dca_candles.json") as f:
    data = json.load(f)

rows = data.get("data", [])
closes = [float(r[4]) for r in reversed(rows)]
highs = [float(r[2]) for r in reversed(rows)]
lows = [float(r[3]) for r in reversed(rows)]
volumes = [float(r[5]) for r in reversed(rows)]
n = len(closes)

def calc_rsi(prices, period=14):
    if len(prices) < period + 1:
        return 50
    gains, losses = [], []
    for i in range(1, len(prices)):
        d = prices[i] - prices[i-1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)

def calc_ema(prices, period):
    if not prices:
        return []
    ema = [prices[0]]
    k = 2 / (period + 1)
    for i in range(1, len(prices)):
        ema.append(prices[i] * k + ema[-1] * (1 - k))
    return ema

def calc_macd(prices):
    ema12 = calc_ema(prices, 12)
    ema26 = calc_ema(prices, 26)
    dif = [ema12[i] - ema26[i] for i in range(len(prices))]
    dea = calc_ema(dif, 9)
    histogram = [dif[i] - dea[i] for i in range(len(prices))]
    return dif[-1], dea[-1], histogram[-1]

def calc_bb_position(prices, period=20):
    if len(prices) < period:
        return 50
    sma = sum(prices[-period:]) / period
    std = (sum((p - sma)**2 for p in prices[-period:]) / period) ** 0.5
    if std == 0:
        return 50
    upper = sma + 2 * std
    lower = sma - 2 * std
    pos = (prices[-1] - lower) / (upper - lower) * 100
    return max(0, min(100, pos))

def calc_sma(prices, period):
    if len(prices) < period:
        return prices[-1] if prices else 0
    return sum(prices[-period:]) / period

def calc_atr(highs, lows, closes, period=14):
    if len(closes) < period + 1:
        return 0
    trs = []
    for i in range(1, len(closes)):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
        trs.append(tr)
    return sum(trs[-period:]) / period

def calc_vol_ratio(volumes, period=20):
    if len(volumes) < period + 1:
        return 1.0
    avg_vol = sum(volumes[-period-1:-1]) / period
    return volumes[-1] / avg_vol if avg_vol > 0 else 1.0

indicators = {
    "rsi14": round(calc_rsi(closes, 14), 2),
    "rsi6": round(calc_rsi(closes, 6), 2),
    "macd_dif": round(calc_macd(closes)[0], 6),
    "macd_dea": round(calc_macd(closes)[1], 6),
    "macd_histogram": round(calc_macd(closes)[2], 6),
    "bb_position": round(calc_bb_position(closes, 20), 2),
    "atr14": round(calc_atr(highs, lows, closes, 14), 6),
    "ma7": round(calc_sma(closes, 7), 2),
    "ma25": round(calc_sma(closes, 25), 2),
    "ma50": round(calc_sma(closes, 50), 2),
    "price": closes[-1] if closes else 0,
    "vol_ratio": round(calc_vol_ratio(volumes, 20), 2),
}

# ─── API-based Indicators (OKX Public Endpoints) ─────────────────────────────
def okx_public_get(path, query=None):
    """Call OKX public API (no auth needed). Returns data list or []."""
    url = "https://www.okx.com" + path
    if query:
        qs = "&".join(f"{k}={v}" for k, v in query.items())
        url = f"{url}?{qs}"
    req = urllib.request.Request(url, headers={"User-Agent": "okx-python/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
        if result.get("code") == "0":
            return result.get("data", [])
    except Exception:
        pass
    return []

# Derive instrument IDs from coins
_inst_base = os.environ.get("DCA_COINS", "BTC").split(",")[0].split(":")[0].strip().upper()
_inst_spot = f"{_inst_base}-USDT"
_inst_swap = f"{_inst_base}-USDT-SWAP"

# 1. Funding rate (current + predicted next)
try:
    _fr = okx_public_get("/api/v5/public/funding-rate", {"instId": _inst_swap})
    if _fr:
        indicators["funding_rate"] = round(float(_fr[0].get("fundingRate", "0")), 8)
        _nfr = _fr[0].get("nextFundingRate", "")
        if _nfr:
            indicators["next_funding_rate"] = round(float(_nfr), 8)
except Exception:
    pass

# 2. Funding rate 8-period average (from history)
try:
    _frh = okx_public_get("/api/v5/public/funding-rate-history", {"instId": _inst_swap, "limit": "8"})
    if _frh and len(_frh) >= 3:
        _fr_vals = [float(r.get("fundingRate", "0")) for r in _frh]
        indicators["funding_rate_avg8"] = round(sum(_fr_vals) / len(_fr_vals), 8)
except Exception:
    pass

# 3. Open interest (USD)
try:
    _oi = okx_public_get("/api/v5/public/open-interest", {"instType": "SWAP", "instId": _inst_swap})
    if _oi:
        indicators["open_interest_usd"] = round(float(_oi[0].get("oiUsd", "0").replace(",", "")), 2)
except Exception:
    pass

# 4. Long/short account ratio (retail sentiment)
try:
    _ls = okx_public_get("/api/v5/rubik/stat/contracts/long-short-account-ratio", {"ccy": _inst_base, "period": "1H"})
    if _ls:
        _latest = _ls[0]
        _rv = _latest[1] if isinstance(_latest, list) else _latest.get("ratio", "1")
        indicators["long_short_ratio"] = round(float(_rv), 4)
except Exception:
    pass

# 5. Top trader long/short ratio (smart money)
try:
    _tt = okx_public_get("/api/v5/rubik/stat/contracts/long-short-account-ratio-contract-top-trader",
                          {"instId": _inst_swap, "period": "1H"})
    if _tt:
        _latest = _tt[0]
        _rv = _latest[1] if isinstance(_latest, list) else _latest.get("ratio", "1")
        indicators["top_trader_long_short"] = round(float(_rv), 4)
except Exception:
    pass

# 6. Taker buy/sell ratio (contracts)
try:
    _tv = okx_public_get("/api/v5/rubik/stat/taker-volume", {"ccy": _inst_base, "instType": "CONTRACTS", "period": "1H"})
    if _tv:
        _latest = _tv[0]
        _bv = float(_latest[1]) if isinstance(_latest, list) else float(_latest.get("buyVol", "1"))
        _sv = float(_latest[2]) if isinstance(_latest, list) else float(_latest.get("sellVol", "1"))
        indicators["taker_buy_sell_ratio"] = round(_bv / _sv, 4) if _sv > 0 else 1.0
except Exception:
    pass

# 7. Taker buy/sell ratio (spot)
try:
    _tvs = okx_public_get("/api/v5/rubik/stat/taker-volume", {"ccy": _inst_base, "instType": "SPOT", "period": "1H"})
    if _tvs:
        _latest = _tvs[0]
        _bv = float(_latest[1]) if isinstance(_latest, list) else float(_latest.get("buyVol", "1"))
        _sv = float(_latest[2]) if isinstance(_latest, list) else float(_latest.get("sellVol", "1"))
        indicators["taker_buy_sell_ratio_spot"] = round(_bv / _sv, 4) if _sv > 0 else 1.0
except Exception:
    pass

# 8. Margin loan ratio (leverage level)
try:
    _ml = okx_public_get("/api/v5/rubik/stat/margin/loan-ratio", {"ccy": _inst_base, "period": "1H"})
    if _ml:
        _latest = _ml[0]
        _rv = _latest[1] if isinstance(_latest, list) else _latest.get("ratio", "1")
        indicators["margin_loan_ratio"] = round(float(_rv), 4)
except Exception:
    pass

# 9. Put/Call ratio (options sentiment) — data format: [ts, oiRatio, volRatio]
try:
    _pc = okx_public_get("/api/v5/rubik/stat/option/open-interest-volume-ratio", {"ccy": _inst_base})
    if _pc:
        _latest = _pc[0]
        _oi_r = _latest[1] if isinstance(_latest, list) else _latest.get("oiRatio", "1")
        _vol_r = _latest[2] if isinstance(_latest, list) else _latest.get("volRatio", "1")
        indicators["put_call_oi_ratio"] = round(float(_oi_r), 4)
        indicators["put_call_vol_ratio"] = round(float(_vol_r), 4)
except Exception:
    pass

# 10. 24h price change %, amplitude %, 24h volume (USD)
try:
    _tk = okx_public_get("/api/v5/market/ticker", {"instId": _inst_spot})
    if _tk:
        _last = float(_tk[0].get("last", "0"))
        _open24 = float(_tk[0].get("open24h", "0"))
        _hi24 = float(_tk[0].get("high24h", "0"))
        _lo24 = float(_tk[0].get("low24h", "0"))
        if _open24 > 0:
            indicators["price_change_24h_pct"] = round((_last - _open24) / _open24 * 100, 4)
        if _lo24 > 0:
            indicators["amplitude_24h_pct"] = round((_hi24 - _lo24) / _lo24 * 100, 4)
        indicators["vol_24h_usd"] = round(float(_tk[0].get("volCcy24h", "0").replace(",", "")), 2)
except Exception:
    pass

# 11. Basis % (spot price vs mark price)
try:
    _mp = okx_public_get("/api/v5/public/mark-price", {"instType": "SWAP", "instId": _inst_swap})
    if _mp and indicators.get("price"):
        _mark_px = float(_mp[0].get("markPx", "0"))
        if _mark_px > 0:
            indicators["basis_pct"] = round((indicators["price"] - _mark_px) / _mark_px * 100, 4)
except Exception:
    pass

# 12. OI + Volume from rubik (for trend analysis)
try:
    _oiv = okx_public_get("/api/v5/rubik/stat/contracts/open-interest-volume", {"ccy": _inst_base, "period": "1H"})
    if _oiv and len(_oiv) >= 2:
        _cur = _oiv[0]
        _prev = _oiv[1]
        _cur_oi = float(_cur[1]) if isinstance(_cur, list) else float(_cur.get("oi", "0"))
        _prev_oi = float(_prev[1]) if isinstance(_prev, list) else float(_prev.get("oi", "0"))
        if _prev_oi > 0:
            indicators["oi_change_pct"] = round((_cur_oi - _prev_oi) / _prev_oi * 100, 4)
except Exception:
    pass

# 13. Platform 24h total volume (USD)
try:
    _pv = okx_public_get("/api/v5/market/platform-24-volume")
    if _pv:
        indicators["platform_vol_usd"] = round(float(_pv[0].get("volUsd", "0").replace(",", "")), 2)
except Exception:
    pass

# 14. Price distance to limit (extreme volatility protection)
try:
    _pl = okx_public_get("/api/v5/public/price-limit", {"instId": _inst_swap})
    if _pl and indicators.get("price"):
        _buy_lmt = float(_pl[0].get("buyLmt", "0"))
        _sell_lmt = float(_pl[0].get("sellLmt", "0"))
        _px = indicators["price"]
        if _buy_lmt > 0:
            indicators["price_to_buy_limit_pct"] = round((_buy_lmt - _px) / _px * 100, 4)
        if _sell_lmt > 0:
            indicators["price_to_sell_limit_pct"] = round((_px - _sell_lmt) / _px * 100, 4)
except Exception:
    pass

# ─── Condition Evaluation (supports AND / OR) ─────────────────────────────────
# START_COND and STOP_COND are passed via environment variables
# Single:    START_COND="rsi14 < 30"
# AND:       START_COND="rsi14 < 30 AND funding_rate < -0.001"
# OR:        STOP_COND="rsi14 > 70 OR long_short_ratio > 2"
# Mixed:     START_COND="rsi14 < 30 AND funding_rate < 0 OR bb_position < 10"
#            (evaluated left to right: (rsi14<30 AND funding_rate<0) OR bb_position<10)
start_cond = os.environ.get("START_COND", "")
stop_cond = os.environ.get("STOP_COND", "")
dry_run = os.environ.get("DRY_RUN", "false") == "true"
coins = os.environ.get("DCA_COINS", "BTC")
amt = os.environ.get("DCA_AMT", "50")
period = os.environ.get("DCA_PERIOD", "daily")
name = os.environ.get("DCA_NAME", "Auto DCA")
investment_ccy = os.environ.get("DCA_INVESTMENT_CCY", "USDT")
td_mode = os.environ.get("DCA_TD_MODE", "cross")
recurring_day = os.environ.get("DCA_RECURRING_DAY", "")
recurring_hour = os.environ.get("DCA_RECURRING_HOUR", "")
recurring_time = os.environ.get("DCA_RECURRING_TIME", "")
time_zone = os.environ.get("DCA_TIME_ZONE", "")

def _eval_single(expr, indicators):
    """Evaluate a single condition like 'rsi14 < 30'."""
    parts = expr.strip().split()
    if len(parts) != 3:
        print(f"Invalid condition: {expr}")
        return False
    key, op, val = parts[0], parts[1], float(parts[2])
    actual = indicators.get(key)
    if actual is None:
        print(f"Unknown indicator: {key}. Available: {', '.join(sorted(indicators.keys()))}")
        return False
    if op == "<": return actual < val
    if op == ">": return actual > val
    if op == "<=": return actual <= val
    if op == ">=": return actual >= val
    if op == "==": return actual == val
    print(f"Unknown operator: {op}")
    return False

def eval_condition(cond, indicators):
    """Evaluate condition with AND/OR support. Left-to-right evaluation."""
    if not cond:
        return False
    # Split by OR first, then AND within each OR branch
    or_groups = [g.strip() for g in cond.split(" OR ")]
    for group in or_groups:
        and_parts = [p.strip() for p in group.split(" AND ")]
        all_true = True
        for part in and_parts:
            if not _eval_single(part, indicators):
                all_true = False
                break
        if all_true:
            return True
    return False

# ─── Check Active DCA on Server ──────────────────────────────────────────────
def parse_coins(coins_str):
    result = []
    for part in coins_str.split(","):
        part = part.strip()
        if not part: continue
        if ":" in part:
            ccy, ratio = part.split(":", 1)
            result.append({"ccy": ccy.strip().upper(), "ratio": ratio.strip()})
        else:
            result.append({"ccy": part.upper(), "ratio": "1"})
    return result

def find_active_dca(coins_str):
    """Query pending recurring orders and find one matching the given coins."""
    try:
        pending = okx_recurring_api("GET", "/api/v5/tradingBot/recurring/orders-algo-pending")
    except SystemExit:
        return None

    target_ccys = sorted(
        c["ccy"] for c in parse_coins(coins_str)
    )
    for order in pending:
        order_ccys = sorted(
            c.get("ccy", "").upper()
            for c in order.get("recurringList", [])
        )
        if target_ccys == order_ccys:
            return order.get("algoId")
    return None

active_algo_id = find_active_dca(coins)

start_triggered = eval_condition(start_cond, indicators)
stop_triggered = eval_condition(stop_cond, indicators)

print("Indicators:", json.dumps(indicators, indent=2))
print(f"Start condition ({start_cond}): {start_triggered}")
print(f"Stop condition ({stop_cond}): {stop_triggered}")
print(f"Active DCA algoId: {active_algo_id or 'None'}")

action = "none"
if start_triggered and not active_algo_id:
    action = "start"
elif stop_triggered and active_algo_id:
    action = "stop"

print(f"Action: {action}")

if dry_run:
    print("[DRY RUN] No action taken")
else:
    if action == "start":
        # Create server-side recurring buy via OKX API
        body = {
            "stgyName": name,
            "recurringList": parse_coins(coins),
            "period": period,
            "amt": amt,
            "investmentCcy": investment_ccy,
            "tdMode": td_mode,
            "recurringTime": recurring_time if recurring_time else "10",
        }
        if period == "hourly":
            body["recurringHour"] = recurring_hour if recurring_hour else "1"
        if recurring_day: body["recurringDay"] = recurring_day
        if time_zone: body["timeZone"] = time_zone

        result = okx_recurring_api("POST", "/api/v5/tradingBot/recurring/order-algo", body=body)
        if result:
            algo_id = result[0].get("algoId", "")
            print(f"DCA created on OKX server: algoId={algo_id}")
        else:
            print("Failed to create DCA")

    elif action == "stop":
        # Stop server-side recurring buy (body is ARRAY)
        okx_recurring_api("POST", "/api/v5/tradingBot/recurring/stop-order-algo",
                          body=[{"algoId": active_algo_id}])
        print(f"DCA stopped on OKX server: algoId={active_algo_id}")

PYEOF
```

### Supported Indicators

**K-line based (from candle data):**

| Indicator | Source | Description |
|-----------|--------|-------------|
| `rsi14` | K-line | RSI 14-period (0-100) |
| `rsi6` | K-line | RSI 6-period (0-100) |
| `macd_histogram` | K-line | MACD histogram value |
| `macd_dif` | K-line | MACD DIF line |
| `macd_dea` | K-line | MACD DEA line |
| `bb_position` | K-line | Bollinger Band position (0-100%) |
| `atr14` | K-line | Average True Range 14-period |
| `ma7`, `ma25`, `ma50` | K-line | Simple moving averages |
| `price` | K-line | Current close price |
| `vol_ratio` | K-line | Volume ratio vs 20-period average |

**API-based (from OKX public endpoints, fetched in real-time):**

| Indicator | Source Endpoint | Description |
|-----------|----------------|-------------|
| `funding_rate` | `/api/v5/public/funding-rate` | Current perpetual swap funding rate (e.g. -0.0001 = -0.01%) |
| `next_funding_rate` | `/api/v5/public/funding-rate` | Predicted next funding rate |
| `funding_rate_avg8` | `/api/v5/public/funding-rate-history` | Average of last 8 funding rate periods |
| `open_interest_usd` | `/api/v5/public/open-interest` | Total open interest in USD |
| `long_short_ratio` | `/api/v5/rubik/stat/contracts/long-short-account-ratio` | Retail long/short account ratio (>1 = more longs) |
| `top_trader_long_short` | `/api/v5/rubik/stat/.../top-trader` | Top trader long/short ratio (smart money direction) |
| `taker_buy_sell_ratio` | `/api/v5/rubik/stat/taker-volume` (CONTRACTS) | Contract taker buy/sell volume ratio (>1 = buy dominant) |
| `taker_buy_sell_ratio_spot` | `/api/v5/rubik/stat/taker-volume` (SPOT) | Spot taker buy/sell volume ratio |
| `margin_loan_ratio` | `/api/v5/rubik/stat/margin/loan-ratio` | Margin lending ratio (leverage level indicator) |
| `put_call_oi_ratio` | `/api/v5/rubik/stat/option/open-interest-volume-ratio` | Put/Call open interest ratio (>1 = bearish sentiment) |
| `put_call_vol_ratio` | `/api/v5/rubik/stat/option/open-interest-volume-ratio` | Put/Call volume ratio |
| `price_change_24h_pct` | `/api/v5/market/ticker` | 24h price change percentage |
| `amplitude_24h_pct` | `/api/v5/market/ticker` | 24h high-low amplitude percentage |
| `vol_24h_usd` | `/api/v5/market/ticker` | 24h trading volume in USD |
| `basis_pct` | ticker + `/api/v5/public/mark-price` | Spot vs mark price basis (%) |
| `oi_change_pct` | `/api/v5/rubik/stat/contracts/open-interest-volume` | OI hourly change percentage |
| `platform_vol_usd` | `/api/v5/market/platform-24-volume` | OKX platform total 24h volume (USD) |
| `price_to_buy_limit_pct` | `/api/v5/public/price-limit` | Distance to buy limit price (%) |
| `price_to_sell_limit_pct` | `/api/v5/public/price-limit` | Distance to sell limit price (%) |

### Supported Operators

`<`, `>`, `<=`, `>=`, `==`

### Compound Conditions (AND / OR)

Conditions can be combined with `AND` and `OR` (must be uppercase, with spaces):

```
# Single condition
START_COND="rsi14 < 30"

# AND: all must be true
START_COND="rsi14 < 30 AND funding_rate < -0.001"

# OR: any one true is enough
STOP_COND="rsi14 > 70 OR long_short_ratio > 2"

# Mixed (left-to-right: (A AND B) OR C)
START_COND="rsi14 < 30 AND funding_rate < 0 OR bb_position < 10"
```

### Auto Parameters

| Param | Description | Default |
|-------|-------------|---------|
| `--start-when` | Condition to create DCA, e.g. "rsi14 < 30" | - |
| `--stop-when` | Condition to stop DCA, e.g. "rsi14 > 70" | - |
| `--bar` | K-line period for indicators | 1H |
| `--candle-limit` | Number of candles for calculation | 100 |
| `--dry-run` | Show results without executing | false |

### How Auto Works

1. Fetches candles via `$OKX --json market candles` and computes indicators with inline Python
2. Evaluates start/stop conditions against current indicator values
3. Queries OKX server for active recurring orders matching the specified coins (`GET orders-algo-pending`)
4. If **start condition met** AND **no active DCA on server** --> creates server-side recurring buy via `POST order-algo`
5. If **stop condition met** AND **active DCA exists on server** --> stops it via `POST stop-order-algo`
6. Otherwise --> no action taken

---

## 4. Continuous Monitoring (Auto-pilot)

Combine the auto start/stop workflow with the built-in `/loop` skill to achieve **persistent monitoring**: periodically check indicator conditions and automatically start or stop DCA.

### How to Start Monitoring

When the user wants continuous monitoring, construct the full auto workflow first, then wrap it with `/loop`:

```
/loop <interval> /retail-recurring-dca-oktradekit <natural language description of the monitoring task>
```

### Examples

```
# Every 10 minutes: check RSI, start DCA if RSI < 30, stop if RSI > 70
/loop 10m /retail-recurring-dca-oktradekit monitor BTC, start daily DCA 50 USDT when RSI < 30, stop when RSI > 70

# Every 30 minutes: monitor funding rate
/loop 30m /retail-recurring-dca-oktradekit monitor BTC funding rate, start hourly DCA 10 USDT when negative

# Every 1 hour: monitor Bollinger Band position
/loop 1h /retail-recurring-dca-oktradekit monitor BTC BB position, start DCA when below 20, stop when above 80
```

### How Continuous Monitoring Works

1. `/loop` periodically invokes this skill at the specified interval
2. Each invocation runs the auto start/stop workflow as a one-shot check
3. The auto workflow is **idempotent** -- safe to run repeatedly:
   - If start condition met AND no active DCA on server --> creates server-side DCA
   - If stop condition met AND active DCA on server --> stops it
   - If DCA already active and start condition met --> skips (no duplicate)
   - If no active DCA and stop condition met --> skips (nothing to stop)
4. **Server-side execution**: Once created, the DCA runs on OKX servers continuously. It does NOT require Claude Code to remain running. Claude Code only manages start/stop decisions based on indicator conditions.

### Monitoring Parameters

| Param | Description | Example |
|-------|-------------|---------|
| Interval | How often to check | `5m`, `10m`, `30m`, `1h` |
| Start condition | When to create DCA | `rsi14 < 30` |
| Stop condition | When to stop DCA | `rsi14 > 70` |

**Tip**: Use `DRY_RUN=true` first to verify the monitoring logic before going live.

---

## 5. Query Market Data (Reference Only)

Users may want to check market data before making their own decisions. Only show data, never give buy/sell/start/stop advice.

```bash
# Technical indicators (RSI, MACD, BB, MA) - fetch candles and compute with Python
$OKX --json market candles BTC-USDT --bar 1D --limit 100 > /tmp/okx_dca_candles.json

python3 << 'PYEOF'
import json

with open("/tmp/okx_dca_candles.json") as f:
    data = json.load(f)

rows = data.get("data", [])
closes = [float(r[4]) for r in reversed(rows)]
highs = [float(r[2]) for r in reversed(rows)]
lows = [float(r[3]) for r in reversed(rows)]
volumes = [float(r[5]) for r in reversed(rows)]

def calc_rsi(prices, period=14):
    if len(prices) < period + 1:
        return 50
    gains, losses = [], []
    for i in range(1, len(prices)):
        d = prices[i] - prices[i-1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100
    rs = avg_gain / avg_loss
    return 100 - 100 / (1 + rs)

def calc_ema(prices, period):
    if not prices:
        return []
    ema = [prices[0]]
    k = 2 / (period + 1)
    for i in range(1, len(prices)):
        ema.append(prices[i] * k + ema[-1] * (1 - k))
    return ema

def calc_macd(prices):
    ema12 = calc_ema(prices, 12)
    ema26 = calc_ema(prices, 26)
    dif = [ema12[i] - ema26[i] for i in range(len(prices))]
    dea = calc_ema(dif, 9)
    histogram = [dif[i] - dea[i] for i in range(len(prices))]
    return dif[-1], dea[-1], histogram[-1]

def calc_bb_position(prices, period=20):
    if len(prices) < period:
        return 50
    sma = sum(prices[-period:]) / period
    std = (sum((p - sma)**2 for p in prices[-period:]) / period) ** 0.5
    if std == 0:
        return 50
    upper = sma + 2 * std
    lower = sma - 2 * std
    pos = (prices[-1] - lower) / (upper - lower) * 100
    return max(0, min(100, pos))

def calc_sma(prices, period):
    if len(prices) < period:
        return prices[-1] if prices else 0
    return sum(prices[-period:]) / period

def calc_atr(highs, lows, closes, period=14):
    if len(closes) < period + 1:
        return 0
    trs = []
    for i in range(1, len(closes)):
        tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
        trs.append(tr)
    return sum(trs[-period:]) / period

def calc_vol_ratio(volumes, period=20):
    if len(volumes) < period + 1:
        return 1.0
    avg_vol = sum(volumes[-period-1:-1]) / period
    return volumes[-1] / avg_vol if avg_vol > 0 else 1.0

indicators = {
    "rsi14": round(calc_rsi(closes, 14), 2),
    "rsi6": round(calc_rsi(closes, 6), 2),
    "macd_dif": round(calc_macd(closes)[0], 6),
    "macd_dea": round(calc_macd(closes)[1], 6),
    "macd_histogram": round(calc_macd(closes)[2], 6),
    "bb_position": round(calc_bb_position(closes, 20), 2),
    "atr14": round(calc_atr(highs, lows, closes, 14), 6),
    "ma7": round(calc_sma(closes, 7), 2),
    "ma25": round(calc_sma(closes, 25), 2),
    "ma50": round(calc_sma(closes, 50), 2),
    "price": closes[-1] if closes else 0,
    "vol_ratio": round(calc_vol_ratio(volumes, 20), 2),
}

print(json.dumps(indicators, indent=2))
PYEOF

# Funding rate
$OKX --json market funding-rate BTC-USDT-SWAP

# Open interest
$OKX --json market open-interest --instType SWAP --instId BTC-USDT-SWAP

# Current price
$OKX --json market ticker BTC-USDT

# Long/short account ratio (1H period)
python3 -c "
import json, urllib.request
req = urllib.request.Request('https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=BTC&period=1H', headers={'User-Agent': 'okx-python/1.0'})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read().decode())
for r in data.get('data', [])[:5]:
    print(f'  ts={r[0]}, ratio={r[1]}')
"

# Top trader long/short ratio
python3 -c "
import json, urllib.request
req = urllib.request.Request('https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio-contract-top-trader?instId=BTC-USDT-SWAP&period=1H', headers={'User-Agent': 'okx-python/1.0'})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read().decode())
for r in data.get('data', [])[:5]:
    print(f'  ts={r[0]}, ratio={r[1]}')
"

# Taker buy/sell volume (contracts)
python3 -c "
import json, urllib.request
req = urllib.request.Request('https://www.okx.com/api/v5/rubik/stat/taker-volume?ccy=BTC&instType=CONTRACTS&period=1H', headers={'User-Agent': 'okx-python/1.0'})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read().decode())
for r in data.get('data', [])[:5]:
    bv, sv = float(r[1]), float(r[2])
    ratio = round(bv/sv, 4) if sv > 0 else 0
    print(f'  ts={r[0]}, buyVol={r[1]}, sellVol={r[2]}, ratio={ratio}')
"

# Margin loan ratio
python3 -c "
import json, urllib.request
req = urllib.request.Request('https://www.okx.com/api/v5/rubik/stat/margin/loan-ratio?ccy=BTC&period=1H', headers={'User-Agent': 'okx-python/1.0'})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read().decode())
for r in data.get('data', [])[:5]:
    print(f'  ts={r[0]}, ratio={r[1]}')
"

# Put/Call ratio (options) — returns [ts, oiRatio, volRatio]
python3 -c "
import json, urllib.request
req = urllib.request.Request('https://www.okx.com/api/v5/rubik/stat/option/open-interest-volume-ratio?ccy=BTC', headers={'User-Agent': 'okx-python/1.0'})
resp = urllib.request.urlopen(req, timeout=15)
data = json.loads(resp.read().decode())
for r in data.get('data', [])[:5]:
    print(f'  ts={r[0]}, oiRatio={r[1]}, volRatio={r[2]}')
"
```

---

## Instructions

When the user asks about DCA, recurring buy, or scheduled investment:

1. Determine the intent from the table below
2. Construct the matching Python script with OKX Recurring Buy API calls
3. Run via Bash
4. Summarize the results in Chinese

**When the user mentions "持续监控", "自动盯盘", "一直监控", "帮我盯着", "条件不满足就停", "自动启停" with continuous/repeated intent:**
1. First construct the full auto workflow with all params (candle fetch + Python indicator evaluation + API condition check)
2. Determine a reasonable check interval (default 10m if user doesn't specify)
3. Tell the user you will use `/loop` to set up continuous monitoring
4. Execute: `/loop <interval> /retail-recurring-dca-oktradekit <user's original request>`

**IMPORTANT: Never give investment advice. Do not recommend whether to start, stop, increase, or reduce DCA. Only execute the requested operation and present factual data. Investment decisions are the user's own responsibility.**

## Intent Mapping

| User says | Action |
|-----------|--------|
| "create DCA" / "start DCA" / "定投 BTC" | Python: `okx_recurring_api("POST", "/api/v5/tradingBot/recurring/order-algo", body={...})` with coins, amt, period params |
| "定投 BTC+ETH every week 200" | Python: `okx_recurring_api("POST", "/api/v5/tradingBot/recurring/order-algo", body={"recurringList":[{"ccy":"BTC","ratio":"0.6"},{"ccy":"ETH","ratio":"0.4"}], "amt":"200", "period":"weekly", ...})` |
| "list DCA" / "view DCA" / "DCA list" | Python: `okx_recurring_api("GET", "/api/v5/tradingBot/recurring/orders-algo-pending")` |
| "DCA detail" / "DCA details" | Python: `okx_recurring_api("GET", "/api/v5/tradingBot/recurring/orders-algo-details", query={"algoId": "<ID>"})` |
| "DCA sub orders" / "DCA sub-orders" | Python: `okx_recurring_api("GET", "/api/v5/tradingBot/recurring/sub-orders", query={"algoId": "<ID>"})` |
| "stop DCA" / "pause DCA" | Python: `okx_recurring_api("POST", "/api/v5/tradingBot/recurring/stop-order-algo", body=[{"algoId": "<ID>"}])` (**body is array**) |
| "rename DCA" / "amend DCA" | Python: `okx_recurring_api("POST", "/api/v5/tradingBot/recurring/amend-order-algo", body={"algoId": "<ID>", "stgyName": "..."})` |
| "DCA history" / "DCA history list" | Python: `okx_recurring_api("GET", "/api/v5/tradingBot/recurring/orders-algo-history")` |
| "check market" / "BTC price" | `$OKX --json market ticker BTC-USDT` |
| "check indicators" / "technical analysis" | Fetch candles via `$OKX --json market candles BTC-USDT --bar 1D --limit 100` + Python indicator computation (only show data, no advice) |
| "auto DCA when RSI below 30" / "auto DCA" | Auto workflow: fetch candles, compute indicators, query server pending list, create/stop via API |
| "use funding rate to control DCA" | Auto workflow with `START_COND="funding_rate < -0.001"` |
| "资金费率为负就开始定投" | Auto workflow with `START_COND="funding_rate < 0"` |
| "多空比太高就停" / "散户太多就停" | Auto workflow with `STOP_COND="long_short_ratio > 2"` |
| "聪明钱做多就开始" | Auto workflow with `START_COND="top_trader_long_short > 1.5"` |
| "taker 买盘强就定投" | Auto workflow with `START_COND="taker_buy_sell_ratio > 1.2"` |
| "杠杆太高就暂停" | Auto workflow with `STOP_COND="margin_loan_ratio > 10"` |
| "看跌情绪重就加仓" | Auto workflow with `START_COND="put_call_oi_ratio > 1.5"` |
| "跌了10%就开始定投" | Auto workflow with `START_COND="price_change_24h_pct < -10"` |
| "期货折价就买入" | Auto workflow with `START_COND="basis_pct < -0.5"` |
| "RSI低且资金费率为负" | Compound: `START_COND="rsi14 < 30 AND funding_rate < 0"` |
| "test auto start/stop" / "dry run" | Set `DRY_RUN=true` environment variable in the auto workflow |
| "持续监控" / "帮我盯着" / "自动盯盘" / "条件不满足就停" | Use `/loop` + auto workflow. E.g.: `/loop 10m /retail-recurring-dca-oktradekit monitor BTC, stop DCA when RSI > 70` |
| "每10分钟检查一次" / "monitor every 10m" | `/loop 10m /retail-recurring-dca-oktradekit <monitoring task>` |
| "停止监控" / "stop monitoring" | Tell user to press Ctrl+C or use `/loop stop` |
| "should I DCA now" / "is it good time to DCA" | Politely decline: "I can show you market data for reference, but cannot give investment advice. Would you like to see the current indicators?" |
