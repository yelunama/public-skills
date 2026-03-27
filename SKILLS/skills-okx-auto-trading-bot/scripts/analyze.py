#!/usr/bin/env python3
"""
OKX Trading Bot - 行情分析脚本
只推荐：网格、定投、DCD、马丁格尔
"""
import os, sys, json, subprocess
from datetime import datetime

API_KEY = os.environ.get('OKX_API_KEY', '2689af93-f257-4b90-a1d3-d9a105870418')
SECRET_KEY = os.environ.get('OKX_SECRET_KEY', 'A4BE7C8AB971BF507D91945ED74E2655')
PASSPHRASE = os.environ.get('OKX_PASSPHRASE', 'Ghb19940604.')
OKX_BIN = os.environ.get('OKX_BIN', '/Users/murlin/.nvm/versions/node/v22.22.1/bin/okx')

def run_okx(args):
    env = os.environ.copy()
    env['OKX_API_KEY'] = API_KEY
    env['OKX_SECRET_KEY'] = SECRET_KEY
    env['OKX_PASSPHRASE'] = PASSPHRASE
    result = subprocess.run([OKX_BIN, '--json'] + args, capture_output=True, text=True, env=env)
    try:
        return json.loads(result.stdout)
    except:
        return []

def get_candles(instId, limit=20):
    data = run_okx(['market', 'candles', instId, '--bar', '1D', '--limit', str(limit)])
    closes = []
    if isinstance(data, list):
        for line in data:
            if isinstance(line, list) and len(line) >= 5:
                closes.append(float(line[4]))
    return closes

def get_ticker(instId):
    data = run_okx(['market', 'ticker', instId])
    if isinstance(data, list) and len(data) > 0:
        t = data[0]
        return {
            'price': float(t.get('last', 0)),
            'vol24h': float(t.get('vol24h', 0))
        }
    return {'price': 0, 'vol24h': 0}

def calculate_indicators(closes):
    if len(closes) < 10:
        return {}
    
    ma5 = sum(closes[-5:]) / 5
    ma10 = sum(closes[-10:]) / 10
    ma20 = sum(closes[-20:]) / 20
    
    # 波动率
    volatility = (max(closes[-10:]) - min(closes[-10:])) / ma10 * 100
    
    # RSI
    gains = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    avg_gain = sum([g for g in gains if g > 0]) / len(gains) if gains else 0
    avg_loss = sum([abs(g) for g in gains if g < 0]) / len(gains) if gains else 0
    rsi = round(100 - (100 / (1 + avg_gain/avg_loss)), 2) if avg_loss > 0 else 50
    
    # MACD
    ema12 = sum(closes[-12:]) / 12 if len(closes) >= 12 else ma5
    ema26 = sum(closes) / 20
    macd_hist = ema12 - ema26
    macd = "金叉" if macd_hist > 0 else "死叉"
    
    return {
        'ma5': ma5, 'ma10': ma10, 'ma20': ma20,
        'volatility': volatility, 'rsi': rsi,
        'macd': macd, 'macd_hist': macd_hist
    }

def recommend_strategy(closes, ticker, indicators):
    """推荐4种策略之一：网格、定投、DCD、马丁格尔"""
    if not indicators:
        return "数据不足", "", {}
    
    price = ticker['price']
    ma5 = indicators['ma5']
    ma10 = indicators['ma10']
    rsi = indicators['rsi']
    macd = indicators['macd']
    macd_hist = indicators['macd_hist']
    volatility = indicators.get('volatility', 0)
    
    change_pct = (price - closes[0]) / closes[0] * 100 if closes else 0
    
    # 判断条件
    ma_diff_pct = abs(ma5 - ma10) / ma10 * 100
    
    # 马丁格尔：下跌趋势 + 超卖
    if macd == "死叉" and rsi < 50 and ma5 < ma10:
        return '马丁格尔', f'MACD死叉+RSI={rsi}(超卖)+下跌趋势，摊平成本等待反弹', {}
    
    # 定投：上涨趋势
    if ma5 > ma10 and macd == "金叉" and rsi < 70:
        return '定投', f'MA5>MA10+MACD金叉+RSI={rsi}，上涨趋势定投赚取涨幅', {}
    
    # DCD双币：高波动
    if volatility > 15:
        return 'DCD双币', f'波动率{volatility:.1f}%>15%，高波动币种理财收益高', {}
    
    # 网格：震荡/无明显趋势
    if ma_diff_pct < 3 or abs(change_pct) < 2:
        return '网格', f'MA5≈MA10(差距{ma_diff_pct:.1f}%)，无明显趋势，网格低买高卖', {}
    
    # 默认网格
    return '网格', f'震荡行情，网格策略低买高卖', {}

def get_ask_params(strategy):
    """返回询问参数的文本"""
    if strategy == '网格':
        return """
请设置网格参数：
- 网格数量（默认5）：？
- 价格区间%（默认10%）：？
- 投入金额（USDT）：？

例如：5格，10%区间，3U
"""
    elif strategy == '定投':
        return """
请设置定投参数：
- 每次投入金额（USDT）：？
- 间隔小时数（默认24）：？

例如：每次3U，24小时
"""
    elif strategy == '马丁格尔':
        return """
请设置马丁格尔参数：
- 基础金额（USDT，默认1）：？
- 翻倍倍数（默认2）：？
- 最大层数（默认3）：？

例如：首单1U，翻倍2x，3层
"""
    elif strategy == 'DCD双币':
        return """
请设置DCD参数：
- 理财周期（天，默认7）：？
- 投入金额（USDT）：？

例如：7天周期，10U
"""
    return ""

def analyze_symbol(symbol):
    instId = f"{symbol}-USDT"
    closes = get_candles(instId)
    ticker = get_ticker(instId)
    
    if not closes or ticker['price'] == 0:
        return None
    
    indicators = calculate_indicators(closes)
    change_pct = round((ticker['price'] - closes[0]) / closes[0] * 100, 2)
    
    strategy, reason, _ = recommend_strategy(closes, ticker, indicators)
    
    return {
        'symbol': symbol,
        'price': ticker['price'],
        'change_pct': change_pct,
        'rsi': indicators.get('rsi', 0),
        'macd': indicators.get('macd', ''),
        'strategy': strategy,
        'reason': reason
    }

def generate_report(symbols):
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    report = f"**📊 OKX 行情分析 {now}**\n\n"
    
    for symbol in symbols:
        result = analyze_symbol(symbol)
        if result:
            report += f"**{result['symbol']}** (${result['price']:.4f})\n"
            report += f"策略：{result['strategy']}\n"
            report += f"理由：{result['reason']}\n"
            report += f"指标：RSI={result['rsi']}，MACD={result['macd']}\n"
            report += "\n"
    
    # 添加参数询问
    report += "---请回复\"买 X\"确认下单（如\"买 XRP\"）---\n"
    report += "回复\"否\"取消\n"
    
    return report

if __name__ == '__main__':
    symbols = sys.argv[1:] if len(sys.argv) > 1 else ['XRP', 'DOGE', 'BTC']
    print(generate_report(symbols))
