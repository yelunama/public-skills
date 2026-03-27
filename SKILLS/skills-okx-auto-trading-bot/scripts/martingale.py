#!/usr/bin/env python3
"""
马丁格尔策略计算
"""
import sys

def calc_martingale(base_amount, multiplier=2, max_layers=3):
    """计算马丁格尔参数"""
    layers = []
    total_invested = 0
    
    for i in range(max_layers):
        amount = base_amount * (multiplier ** i)
        layers.append({
            'layer': i + 1,
            'amount': round(amount, 2),
            'total': round(sum(l['amount'] for l in layers) + amount, 2)
        })
        total_invested += amount
    
    return {
        'base_amount': base_amount,
        'multiplier': multiplier,
        'max_layers': max_layers,
        'total_max': round(total_invested, 2),
        'layers': layers
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: martingale.py <base_amount> [multiplier] [max_layers]")
        return
    
    base = float(sys.argv[1])
    mult = float(sys.argv[2]) if len(sys.argv) > 2 else 2
    layers = int(sys.argv[3]) if len(sys.argv) > 3 else 3
    
    result = calc_martingale(base, mult, layers)
    
    print(f"基础金额: ${result['base_amount']}")
    print(f"翻倍倍数: {result['multiplier']}x")
    print(f"最大层数: {result['max_layers']}")
    print(f"最大总投入: ${result['total_max']}")
    print()
    print("层级建议:")
    for l in result['layers']:
        print(f"  第{l['layer']}层: ${l['amount']} (累计 ${l['total']})")

if __name__ == '__main__':
    main()
