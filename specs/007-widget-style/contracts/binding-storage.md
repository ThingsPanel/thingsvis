# Contract: Binding Storage (Studio → NodeSchema)

**Branch**: `007-widget-style`  
**Date**: 2025-12-30

This contract specifies how Studio persists a field’s binding mode into the existing `NodeSchema` fields.

## Goals

- Preserve `DataBinding` compatibility and runtime resolution.
- Provide deterministic mapping between UI mode and persisted state.

## Existing Schema

- `NodeSchema.data?: DataBinding[]`
- `DataBinding = { targetProp: string; expression: string }` where `expression` matches `{{ ... }}`.

## Persisted representations

### 1) Static value

- `node.schemaRef.props[path] = <staticValue>`
- Remove any `DataBinding` where `targetProp === path`.

### 2) Field binding

- Ensure a `DataBinding` exists where:
  - `targetProp === path`
  - `expression === "{{ ds.<dataSourceId>.data.<fieldPath> }}"`

### 3) Expression binding

- Ensure a `DataBinding` exists where:
  - `targetProp === path`
  - `expression` is the user-provided `{{ ... }}` string

## Mode detection (for panel display)

For a given `path`:

- If there is no `DataBinding` entry for `targetProp === path` → show **static**.
- If there is a binding and `expression` matches `{{ ds.<id>.data.` prefix → show **field** (best-effort heuristic).
- Otherwise → show **expr**.

## Runtime behavior

At render time, `@thingsvis/ui` builds an evaluation context:

- `context = { ds: kernelState.dataSources }`

Then `ExpressionEvaluator.evaluate(binding.expression, context)` resolves the value.
