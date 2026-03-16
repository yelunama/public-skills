#!/usr/bin/env node
/**
 * coinglass.mjs — Standalone CoinGlass API query for the market-intel OpenClaw skill.
 * Requires: Node >=18 (built-in fetch), COINGLASS_API_KEY env var.
 * Usage: node coinglass.mjs BTC
 */

const API_KEY = process.env.COINGLASS_API_KEY;
if (!API_KEY) {
  process.stderr.write("ERROR: COINGLASS_API_KEY is not set.\n");
  process.exit(1);
}

const SYMBOL = (process.argv[2] ?? "BTC")
  .toUpperCase()
  .replace(/-?USD[T]?$/i, "")
  .replace(/\/USD[T]?$/i, "");

const BASE = "https://open-api-v4.coinglass.com";
const HEADERS = { "CG-API-KEY": API_KEY, Accept: "application/json" };

/** GET helper with error handling */
async function cg(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  const body = await res.json();
  if (body.code !== "0") throw new Error(`API error: ${body.msg} — ${path}`);
  return body.data;
}

function num(v, dec = 2) {
  if (v == null) return "N/A";
  return Number(v).toLocaleString("en-US", { maximumFractionDigits: dec });
}
function usd(v) {
  if (v == null) return "N/A";
  const n = Number(v);
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}
function pct(v) {
  return v == null ? "N/A" : `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`;
}

async function main() {
  process.stdout.write(`# CoinGlass Market Intel — ${SYMBOL}\n\n`);

  const results = await Promise.allSettled([
    cg("/api/futures/openInterest/chart", { symbol: SYMBOL }),
    cg("/api/futures/fundingRate/exchange-list", { symbol: SYMBOL }),
    cg("/api/futures/globalLongShortAccountRatio/history", { symbol: SYMBOL, exchange: "Binance", interval: "1h", limit: 24 }),
    cg("/api/futures/liquidation/coin-list", { symbol: SYMBOL, interval: "1h", limit: 24 }),
    cg("/api/hyperliquid/whale-alert"),
  ]);

  const [oiRes, frRes, lsRes, liqRes, whaleRes] = results;

  // ── Open Interest ────────────────────────────────────────────
  if (oiRes.status === "fulfilled") {
    const d = oiRes.value;
    process.stdout.write("## Open Interest\n");
    process.stdout.write(`Price:              ${usd(d.price)}\n`);
    process.stdout.write(`Price Change 24h:   ${pct(d.priceChangePercent)}\n`);
    process.stdout.write(`Total OI (USD):     ${usd(d.openInterest)}\n`);
    if (d.openInterestChangePercent24h != null) {
      process.stdout.write(`OI Change 24h:      ${pct(d.openInterestChangePercent24h)}\n`);
    }
    if (d.exchangeList?.length) {
      process.stdout.write("By Exchange:\n");
      for (const ex of d.exchangeList.slice(0, 6)) {
        const pctShare = d.openInterest ? (ex.openInterest / d.openInterest * 100).toFixed(1) : "N/A";
        process.stdout.write(`  ${ex.exchangeName.padEnd(14)} ${usd(ex.openInterest).padStart(12)}  (${pctShare}%)\n`);
      }
    }
  } else {
    process.stdout.write(`## Open Interest — Error: ${oiRes.reason?.message}\n`);
  }

  // ── Funding Rates ────────────────────────────────────────────
  process.stdout.write("\n");
  if (frRes.status === "fulfilled") {
    const exList = frRes.value?.exchangeList ?? [];
    const avg = exList.length ? exList.reduce((s, e) => s + (e.rate ?? 0), 0) / exList.length : 0;
    const sorted = [...exList].sort((a, b) => Math.abs(b.rate ?? 0) - Math.abs(a.rate ?? 0));
    process.stdout.write("## Funding Rates (8h)\n");
    process.stdout.write(`Average rate:  ${(avg * 100).toFixed(4)}%  (ann. ${(avg * 100 * 3 * 365).toFixed(1)}%)\n`);
    process.stdout.write("Top exchanges:\n");
    for (const ex of sorted.slice(0, 6)) {
      const r = (ex.rate ?? 0) * 100;
      const sign = r >= 0 ? "+" : "";
      process.stdout.write(`  ${ex.exchangeName.padEnd(14)} ${(sign + r.toFixed(4) + "%").padStart(10)}\n`);
    }
  } else {
    process.stdout.write(`## Funding Rates — Error: ${frRes.reason?.message}\n`);
  }

  // ── Long/Short Ratio ─────────────────────────────────────────
  process.stdout.write("\n");
  if (lsRes.status === "fulfilled") {
    const data = lsRes.value ?? [];
    if (data.length > 0) {
      const latest = data[data.length - 1];
      const oldest = data[0];
      const trendDir = latest.longRatio > oldest.longRatio ? "↑ longs growing" : "↓ longs declining";
      process.stdout.write("## Long/Short Ratio (Binance, 1h x24)\n");
      process.stdout.write(`Latest:  Long ${(latest.longRatio * 100).toFixed(2)}%  Short ${(latest.shortRatio * 100).toFixed(2)}%  L/S ${(latest.longShortRatio ?? 0).toFixed(4)}\n`);
      process.stdout.write(`24h trend: ${trendDir}\n`);
    }
  } else {
    process.stdout.write(`## Long/Short Ratio — Error: ${lsRes.reason?.message}\n`);
  }

  // ── Liquidations ─────────────────────────────────────────────
  process.stdout.write("\n");
  if (liqRes.status === "fulfilled") {
    const data = Array.isArray(liqRes.value) ? liqRes.value : [];
    const first = data[0];
    if (first) {
      process.stdout.write("## Liquidations (24h)\n");
      process.stdout.write(`Long liquidations:   ${usd(first.longLiquidationUsd)}\n`);
      process.stdout.write(`Short liquidations:  ${usd(first.shortLiquidationUsd)}\n`);
      const total = (first.longLiquidationUsd ?? 0) + (first.shortLiquidationUsd ?? 0);
      if (total > 0) {
        const longPct = (first.longLiquidationUsd / total * 100).toFixed(1);
        process.stdout.write(`Long share: ${longPct}%  (>${55}% = long-heavy liquidation cascade risk)\n`);
      }
    }
  } else {
    process.stdout.write(`## Liquidations — Error: ${liqRes.reason?.message}\n`);
  }

  // ── Hyperliquid Whale Activity ────────────────────────────────
  process.stdout.write("\n");
  if (whaleRes.status === "fulfilled") {
    const alerts = (whaleRes.value ?? [])
      .filter((a) => (a.usdValue ?? 0) >= 100_000)
      .slice(0, 8);
    process.stdout.write("## Hyperliquid Whale Activity (≥$100K)\n");
    if (alerts.length === 0) {
      process.stdout.write("No whale trades found.\n");
    } else {
      process.stdout.write("Time (UTC)           Coin   Side    USD Value\n");
      for (const a of alerts) {
        const ts = new Date(a.time).toISOString().slice(0, 16).replace("T", " ");
        process.stdout.write(`  ${ts}   ${(a.coin ?? "").padEnd(6)} ${(a.side ?? "").toUpperCase().padEnd(5)}  ${usd(a.usdValue)}\n`);
      }
    }
  } else {
    process.stdout.write(`## Hyperliquid Whales — Error: ${whaleRes.reason?.message}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
