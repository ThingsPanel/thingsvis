# Quickstart: Superset 风格优先的数据配置与绑定

**Branch**: `007-widget-style`  
**Date**: 2025-12-30

This quickstart explains how to adopt the MVP workflow as (1) a plugin author and (2) a Studio user.

## 1) Plugin author: declare Controls

In the plugin’s `Main` export (Module Federation remote), provide:

- `schema`: existing Zod props schema (already supported)
- `controls`: new serializable Controls definition (used by Studio to render the panel)

Example (conceptual):

```ts
import { z } from 'zod';
import type { PluginMainModule } from '@thingsvis/schema';

const TextPropsSchema = z.object({
  text: z.string().default('请输入文本'),
  fill: z.string().default('#000000'),
  fontSize: z.number().default(16),
});

export const Main: PluginMainModule = {
  id: 'basic-text',
  schema: TextPropsSchema,
  controls: {
    groups: [
      {
        id: 'Content',
        fields: [
          {
            path: 'text',
            label: '文本内容',
            kind: 'string',
            binding: { enabled: true, modes: ['static', 'field', 'expr'] },
          },
        ],
      },
      {
        id: 'Style',
        fields: [
          {
            path: 'fill',
            label: '文字颜色',
            kind: 'color',
            binding: { enabled: true, modes: ['static', 'field', 'expr'] },
          },
          {
            path: 'fontSize',
            label: '字号',
            kind: 'number',
            binding: { enabled: true, modes: ['static', 'field', 'expr'] },
          },
        ],
      },
    ],
  },
  create: () => {/* ... */},
};
```

## 2) Studio user: bind via Field Picker

1. Select a node on the canvas (e.g., basic text).
2. In the properties panel, find the field (e.g., **文本内容**).
3. Use the field’s mode selector to switch to **field**.
4. Pick:
   - a data source ID
   - a field path from the data snapshot
5. Studio writes the binding as:

```text
node.schemaRef.data += { targetProp: 'text', expression: '{{ ds.<id>.data.<path> }}' }
```

The runtime resolves values using `context = { ds: kernelState.dataSources }`.

Notes:

- If the data snapshot is large, the Field list may be truncated due to traversal guardrails.
- When a field is bound (Field/Expr), the panel shows that the static value is overridden.

## 3) Advanced user: expression fallback

If Field Picker is insufficient, switch the field to **Expr** and enter a `{{ ... }}` expression.

## 4) Compatibility

- Old pages that already use `{{ ... }}` inline props or `node.schemaRef.data: DataBinding[]` continue to work.
- Components without `controls` keep using the existing Studio panel implementation.

## 5) Manual end-to-end checklist (T028)

Run this once in Studio to confirm the full “controls → binding → runtime resolution” loop works.

### Setup

1. Start Studio (`pnpm dev`) and open the editor.
2. Create a Static JSON data source with a known shape, for example:

```json
{
  "val": "Hello",
  "color": "#ff0000",
  "size": 24
}
```

3. Drag a `basic-text` node onto the canvas.

### Field binding (Superset-style)

1. Select the `basic-text` node.
2. In the right panel, find **文本内容**.
3. Switch mode to **field**.
4. Pick the data source and choose `data.val`.

Expected:

- Panel indicates the field is **bound** (static value overridden).
- Canvas text updates to `Hello`.

### Style binding

1. For **文字颜色**, switch mode to **field** and pick `data.color`.

Expected:

- Canvas text color updates (e.g. to red).

2. For **字号**, switch mode to **field** and pick `data.size`.

Expected:

- Canvas text size updates.

### Expression fallback

1. For **文本内容**, switch mode to **Expr**.
2. Enter a valid expression, for example:

```text
{{ ds.<id>.data.val }}
```

Expected:

- Save is allowed (format matches `{{ ... }}`).
- Field remains bound and the canvas output still resolves correctly.

3. Enter an invalid expression (missing `{{ }}` wrappers).

Expected:

- Save is blocked and the previous binding remains unchanged.

### Guardrails

If a data source snapshot is very large, confirm Field Picker remains responsive and the field list/tree truncates rather than freezing.

### Notes (record results)

- Date:
- Studio URL:
- Data source ID used:
- Any issues observed:

