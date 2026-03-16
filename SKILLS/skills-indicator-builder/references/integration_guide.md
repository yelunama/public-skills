# 代码集成到 agent-trade-kit 的详细步骤

## 前提

- 项目路径：agent-trade-kit（pnpm monorepo）
- 核心包：`packages/core/src/tools/`
- 构建工具：tsup
- 构建命令：`pnpm run build`（按 core → mcp → cli 顺序）

## 步骤 1：添加计算函数

**文件**：`packages/core/src/tools/indicator-calc.ts`

在文件末尾添加：

```typescript
// ─── {IndicatorName} ──────────────────────────────────────────
// {简要说明}

export interface {IndicatorName}Result {
  // 定义返回类型
}

export function calc{IndicatorName}(
  // 参数列表
): {IndicatorName}Result | number[] {
  // 实现
}
```

**检查清单**：
- [ ] 函数是纯函数（无 IO、无副作用）
- [ ] 输入数组为时间正序
- [ ] 前导期返回 NaN
- [ ] 导出了函数和接口
- [ ] 复用了已有函数（calcEma, calcSma 等）

## 步骤 2：注册到路由表

**文件**：`packages/core/src/tools/indicator.ts`

### 2.1 添加 import
```typescript
import {
  ...existing imports,
  calc{IndicatorName},
} from "./indicator-calc.js";
```

### 2.2 扩展 INDICATOR_NAMES
```typescript
const INDICATOR_NAMES = [
  "rsi", "macd", "ema", "sma", "bbands", "atr", "summary",
  "{new_name}",  // ← 新增
] as const;
```

### 2.3 添加 ROUTING_TABLE 条目
```typescript
const ROUTING_TABLE: Record<IndicatorName, CalcMode> = {
  ...existing,
  {new_name}: "local",  // ← 新增
};
```

### 2.4 扩展 IndicatorArgs 接口（如有新参数）
```typescript
interface IndicatorArgs {
  ...existing,
  newParam?: number;  // ← 按需添加
}
```

### 2.5 添加 inputSchema 参数定义
在 `registerIndicatorTools()` → `inputSchema.properties` 中添加：
```typescript
newParam: {
  type: "number",
  description: "说明 (default X)",
},
```

### 2.6 添加 computeIndicator case
```typescript
case "{new_name}": {
  const param1 = args.newParam ?? defaultValue;
  const result = calc{IndicatorName}(close, param1);
  // 单值返回
  const latest = result instanceof Array
    ? (result.findLast(v => !isNaN(v)) ?? null)
    : result; // 如果是对象
  return {
    indicator: "{new_name}",
    params: { param1 },
    latest,
    lastTs, lastClose,
    series: trimNaN(ts, result as number[]),
  };
}
```

### 2.7 解析新参数（在 handler 中）
```typescript
const parsedArgs: IndicatorArgs = {
  ...existing,
  newParam: readNumber(args, "newParam"),
};
```

## 步骤 3：外部数据获取（如需要）

如果指标依赖非K线数据，需要修改 handler 的数据获取逻辑：

```typescript
// 在 handler 中，fetchCandles 之后添加：
if (indicator === "{new_name}") {
  const externalData = await fetchExternalData(parsedArgs, context);
  // 将外部数据传入 computeIndicator
}
```

外部数据获取函数放在 `indicator.ts` 中（因为涉及 IO）：

```typescript
async function fetchExternalData(
  args: IndicatorArgs,
  context: { client: ... },
): Promise<{ ts: number[]; values: number[] }> {
  const response = await context.client.publicGet(
    "/api/v5/...",
    compactObject({ instId: args.instId }),
    publicRateLimit("external_data", 20),
  );
  // 解析和对齐
  return { ts, values };
}
```

## 步骤 4：更新描述文字

在 `registerIndicatorTools()` 的 description 中添加新指标名称：

```typescript
description:
  "Calculate a technical indicator... " +
  "Supported indicators: rsi, macd, ema, sma, bbands, atr, {new_name}, summary.",
```

同样更新 `indicator` 属性的 enum 和 description。

## 步骤 5：构建验证

```bash
# 在项目根目录
pnpm run build

# 应该看到三个包都成功编译：
# @anthropic/agent-trade-kit-core
# @anthropic/agent-trade-kit-mcp
# @anthropic/agent-trade-kit-cli
```

**常见错误**：
- `Cannot find name 'calc{X}'` → 检查 import 是否正确
- `Type ... is not assignable` → 检查 IndicatorName 类型
- `Property 'x' does not exist on type 'IndicatorArgs'` → 添加到接口

## 步骤 6：测试

```bash
# CLI 方式测试
npx agent-trade-kit indicator BTC-USDT {new_name}

# MCP 方式测试（通过 Claude）
# 调用 indicator 工具，参数：
# instId: "BTC-USDT"
# indicator: "{new_name}"
# ...其他参数
```

## 文件修改总结

| 文件 | 修改内容 |
|------|---------|
| `indicator-calc.ts` | 添加计算函数和接口 |
| `indicator.ts` | 添加 import、NAMES、ROUTING、Args、Schema、case、parse |

最小改动 = 2 个文件。如需外部数据则还需要在 indicator.ts 中添加 fetch 函数。
