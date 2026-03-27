#!/usr/bin/env python3
"""
网格策略计算
"""
import sys

def calc_grid(current_price, grids=5, price_range=0.1):
    """计算网格参数"""
    high = current_price * (1 + price_range)
    low = current_price * (1 - price_range)
    grid_gap = (high - low) / grids
    
    prices = []
    for i in range(grids + 1):
        prices.append(round(low + i * grid_gap, 6))
    
    return {
        'high': round(high, 6),
        'low': round(low, 6),
        'grid_gap': round(grid_gap, 6),
        'prices': prices
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: grid.py <price> [grids] [range%]")
        return
    
    price = float(sys.argv[1])
    grids = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    range_pct = float(sys.argv[3]) / 100 if len(sys.argv) > 3 else 0.1
    
    result = calc_grid(price, grids, range_pct)
    
    print(f"当前价格: ${price}")
    print(f"网格区间: ${result['low']} ~ ${result['high']}")
    print(f"网格数量: {grids}")
    print(f"网格间距: ${result['grid_gap']}")
    print()
    print("网格价格:")
    for i, p in enumerate(result['prices']):
        print(f"  网格{i+1}: ${p:.6f}")

if __name__ == '__main__':
    main()
