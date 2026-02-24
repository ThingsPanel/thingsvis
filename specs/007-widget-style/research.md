# Research: Superset 风格优先的数据配置与绑定

**Branch**: `007-widget-style`  
**Date**: 2025-12-30  
**Spec**: [spec.md](./spec.md)

This document consolidates Phase 0 decisions. Each item includes the decision, rationale, and alternatives.

## Decision 1 — Keep canonical binding representation as expressions in `DataBinding`

- **Decision**: Continue storing bindings as `node.schemaRef.data: DataBinding[]` where `DataBinding.expression` is a canonical `{{ ... }}` string.
- **Rationale**:
  - Preserves backward compatibility with existing pages/projects.
  - Reuses the existing runtime resolution flow in `@thingsvis/ui` (`PropertyResolver` + `ExpressionEvaluator`).
  - Keeps MVP scope small: Field Picker becomes a UI helper that generates expressions.
- **Alternatives considered**:
  - **Structured binding object** (e.g., `{ mode: 'field', sourceId, path }`) persisted in schema and resolved at runtime. Rejected for MVP because it requires changing runtime resolution and migration/compat layers.

## Decision 2 — Canonical field reference syntax uses `ds.<id>.data.<path>`

- **Decision**: Treat `ds.<id>.data.<path>` as the canonical field access path inside expressions.
- **Rationale**:
  - Matches the existing evaluation context used by `PropertyResolver` (`{ ds: dataSources }`).
  - Allows Field Picker to generate deterministic expressions.
- **Alternatives considered**:
  - **`query`-based context** (e.g., `query.data.*`). Rejected because current runtime uses `ds` and changing it would be breaking.

## Decision 3 — Add a serializable Controls definition to widget entry

- **Decision**: Extend `WidgetMainModule` to optionally include a serializable `controls` definition.
- **Rationale**:
  - Keeps the schema package React-free while giving Studio enough information to generate a panel.
  - Allows incremental adoption (components without `controls` keep using existing hand-written panels).
- **Alternatives considered**:
  - **Infer panel from Zod schema only**. Rejected because Zod alone does not encode grouping, UI control intent, or binding modes.
  - **React component-based panel definition**. Rejected because schema package must remain React-free and serialized panel definitions are required.

## Decision 4 — Controls `path` initially maps to `DataBinding.targetProp` (flat props)

- **Decision**: In MVP, interpret each control field’s `path` as a flat prop key that maps directly to `DataBinding.targetProp` and to `node.schemaRef.props[<key>]`.
- **Rationale**:
  - Current `PropertyResolver` resolves only `node.schemaRef.props` (not `style`), so a flat mapping is the least invasive.
  - The basic text plugin already uses flat props (`text`, `fill`, `fontSize`, ...).
- **Alternatives considered**:
  - **Nested paths** like `props.text` / `style.fill`. Deferred until runtime/store semantics for `style` are fully integrated and consistently resolved.

## Decision 5 — Binding modes are a UI concept backed by existing persisted data

- **Decision**: Support binding modes `static | field | expr` in the Studio UI, but persist the final result using existing fields:
  - Static value → `node.schemaRef.props[path] = <value>` and remove any matching `DataBinding`.
  - Field binding → `DataBinding.expression = "{{ ds.<id>.data.<path> }}"`.
  - Expr binding → `DataBinding.expression = "{{ ... }}"`.
- **Rationale**:
  - Keeps persisted format stable and compatible.
  - Makes it easy for the panel to show “overridden by binding” by checking `node.schemaRef.data`.
- **Alternatives considered**:
  - Persist binding mode separately. Rejected for MVP to avoid schema migration.

## Decision 6 — Field Picker must be depth/size limited

- **Decision**: Implement Field Picker’s JSON exploration with guardrails: max depth and max total nodes/paths.
- **Rationale**:
  - Kernel snapshots can be large; unbounded tree building can freeze the UI.
- **MVP Defaults (implemented)**:
  - `maxDepth = 5`
  - `maxNodes = 200` (total emitted paths)
  - Arrays are expanded using numeric segments (e.g. `items.0.name`).
- **Alternatives considered**:
  - Full JSON schema inference + virtualized browsing. Rejected for MVP scope.

## Decision 7 — “Mapping” for MVP is implemented as direct field-to-prop binding

- **Decision**: Treat “字段映射 (Mapping)” in MVP as the act of mapping one chosen field to one component input (e.g., map a field into `text`).
- **Rationale**:
  - Satisfies the minimum acceptance loop without introducing a separate mapping layer.
- **Alternatives considered**:
  - A dedicated mapping object that remaps multiple fields into a structured `props.data` input. Deferred to a later feature once multiple complex components require it.
