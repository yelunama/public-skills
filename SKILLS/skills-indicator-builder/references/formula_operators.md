# 组合运算符实现代码

## 概述

这些运算符是构建自定义指标时的基础积木，与 indicator-calc.ts 中的
calcRsi/calcEma 等函数配合使用。所有函数遵循相同的纯函数模式。

## 交叉检测

```typescript
/** a 从下方穿越 b（上穿）*/
export function crossover(a: number[], b: number[]): boolean[] {
  const len = Math.min(a.length, b.length);
  const result = new Array(len).fill(false);
  for (let i = 1; i < len; i++) {
    if (!isNaN(a[i]) && !isNaN(b[i]) && !isNaN(a[i-1]) && !isNaN(b[i-1])) {
      result[i] = a[i-1] <= b[i-1] && a[i] > b[i];
    }
  }
  return result;
}

/** a 从上方穿越 b（下穿）*/
export function crossunder(a: number[], b: number[]): boolean[] {
  const len = Math.min(a.length, b.length);
  const result = new Array(len).fill(false);
  for (let i = 1; i < len; i++) {
    if (!isNaN(a[i]) && !isNaN(b[i]) && !isNaN(a[i-1]) && !isNaN(b[i-1])) {
      result[i] = a[i-1] >= b[i-1] && a[i] < b[i];
    }
  }
  return result;
}

/** a 穿越常数值（上穿）*/
export function crossoverValue(a: number[], value: number): boolean[] {
  const len = a.length;
  const result = new Array(len).fill(false);
  for (let i = 1; i < len; i++) {
    if (!isNaN(a[i]) && !isNaN(a[i-1])) {
      result[i] = a[i-1] <= value && a[i] > value;
    }
  }
  return result;
}
```

## 滚动窗口函数

```typescript
/** 滚动最高值 */
export function highest(values: number[], period: number): number[] {
  const len = values.length;
  const result = new Array(len).fill(NaN);
  for (let i = period - 1; i < len; i++) {
    let max = -Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (values[j] > max) max = values[j];
    }
    result[i] = max;
  }
  return result;
}

/** 滚动最低值 */
export function lowest(values: number[], period: number): number[] {
  const len = values.length;
  const result = new Array(len).fill(NaN);
  for (let i = period - 1; i < len; i++) {
    let min = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (values[j] < min) min = values[j];
    }
    result[i] = min;
  }
  return result;
}

/** 滚动标准差 */
export function stddev(values: number[], period: number): number[] {
  const sma = calcSma(values, period); // 复用已有 calcSma
  const len = values.length;
  const result = new Array(len).fill(NaN);
  for (let i = period - 1; i < len; i++) {
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = values[j] - sma[i];
      sumSq += diff * diff;
    }
    result[i] = Math.sqrt(sumSq / period);
  }
  return result;
}
```

## 变化量与变化率

```typescript
/** n 期变化量 */
export function change(values: number[], n: number = 1): number[] {
  const len = values.length;
  const result = new Array(len).fill(NaN);
  for (let i = n; i < len; i++) {
    if (!isNaN(values[i]) && !isNaN(values[i - n])) {
      result[i] = values[i] - values[i - n];
    }
  }
  return result;
}

/** n 期变化率 (%) */
export function roc(values: number[], n: number = 1): number[] {
  const len = values.length;
  const result = new Array(len).fill(NaN);
  for (let i = n; i < len; i++) {
    if (!isNaN(values[i]) && !isNaN(values[i - n]) && values[i - n] !== 0) {
      result[i] = ((values[i] - values[i - n]) / values[i - n]) * 100;
    }
  }
  return result;
}
```

## 标准化

```typescript
/** 滚动 Z-Score 标准化 */
export function normalize(values: number[], period: number): number[] {
  const sma = calcSma(values, period);
  const std = stddev(values, period);
  const len = values.length;
  const result = new Array(len).fill(NaN);
  for (let i = period - 1; i < len; i++) {
    if (!isNaN(sma[i]) && !isNaN(std[i]) && std[i] !== 0) {
      result[i] = (values[i] - sma[i]) / std[i];
    }
  }
  return result;
}

/** Min-Max 归一化到 [0, 1] */
export function minMaxNorm(values: number[], period: number): number[] {
  const hi = highest(values, period);
  const lo = lowest(values, period);
  const len = values.length;
  const result = new Array(len).fill(NaN);
  for (let i = period - 1; i < len; i++) {
    const range = hi[i] - lo[i];
    if (range > 0) result[i] = (values[i] - lo[i]) / range;
  }
  return result;
}
```

## 线性回归

```typescript
/** 滚动线性回归斜率 */
export function slope(values: number[], period: number): number[] {
  const len = values.length;
  const result = new Array(len).fill(NaN);
  for (let i = period - 1; i < len; i++) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let j = 0; j < period; j++) {
      const x = j;
      const y = values[i - period + 1 + j];
      sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
    }
    const denom = period * sumX2 - sumX * sumX;
    if (denom !== 0) {
      result[i] = (period * sumXY - sumX * sumY) / denom;
    }
  }
  return result;
}
```

## 逻辑组合

```typescript
/** AND 合并多个布尔信号 */
export function andSignals(...signals: boolean[][]): boolean[] {
  const len = Math.min(...signals.map(s => s.length));
  const result = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = signals.every(s => s[i]);
  }
  return result;
}

/** OR 合并多个布尔信号 */
export function orSignals(...signals: boolean[][]): boolean[] {
  const len = Math.min(...signals.map(s => s.length));
  const result = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = signals.some(s => s[i]);
  }
  return result;
}

/** 数值比较 → 布尔 */
export function gt(a: number[], b: number[] | number): boolean[] {
  const len = a.length;
  const result = new Array(len).fill(false);
  for (let i = 0; i < len; i++) {
    const bv = typeof b === "number" ? b : b[i];
    if (!isNaN(a[i]) && !isNaN(bv)) result[i] = a[i] > bv;
  }
  return result;
}

export function lt(a: number[], b: number[] | number): boolean[] {
  const len = a.length;
  const result = new Array(len).fill(false);
  for (let i = 0; i < len; i++) {
    const bv = typeof b === "number" ? b : b[i];
    if (!isNaN(a[i]) && !isNaN(bv)) result[i] = a[i] < bv;
  }
  return result;
}
```

## 算术运算

```typescript
/** 数组逐元素加法 */
export function add(a: number[], b: number[] | number): number[] {
  return a.map((v, i) => {
    const bv = typeof b === "number" ? b : b[i];
    return isNaN(v) || isNaN(bv) ? NaN : v + bv;
  });
}

/** 数组逐元素减法 */
export function sub(a: number[], b: number[] | number): number[] {
  return a.map((v, i) => {
    const bv = typeof b === "number" ? b : b[i];
    return isNaN(v) || isNaN(bv) ? NaN : v - bv;
  });
}

/** 数组逐元素乘法 */
export function mul(a: number[], b: number[] | number): number[] {
  return a.map((v, i) => {
    const bv = typeof b === "number" ? b : b[i];
    return isNaN(v) || isNaN(bv) ? NaN : v * bv;
  });
}

/** 数组逐元素除法（除零返回 NaN）*/
export function div(a: number[], b: number[] | number): number[] {
  return a.map((v, i) => {
    const bv = typeof b === "number" ? b : b[i];
    return isNaN(v) || isNaN(bv) || bv === 0 ? NaN : v / bv;
  });
}
```
