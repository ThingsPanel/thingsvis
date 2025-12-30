# Contract: Field Picker (Kernel snapshots → Studio UI)

**Branch**: `007-widget-style`  
**Date**: 2025-12-30

This contract specifies what the Field Picker reads and what it outputs.

## Input

- Kernel store `dataSources: Record<string, DataSourceRuntimeState>`
- For each data source, the Field Picker reads:
  - `id`
  - `status`
  - `data` (JSON-like value)

## Output

- Selection output is `(dataSourceId: string, fieldPath: string)`.
- Studio converts this into a canonical expression:

```text
{{ ds.<dataSourceId>.data.<fieldPath> }}
```

## Path rules (MVP)

- `fieldPath` is a dot-separated path produced by expanding the data snapshot.
- Arrays may be represented either by numeric segments (e.g. `items.0.name`) or ignored in MVP.

## Performance guardrails

- The Field Picker MUST limit traversal:
  - max depth
  - max nodes/paths

If limits are exceeded, it SHOULD show a truncated view.
