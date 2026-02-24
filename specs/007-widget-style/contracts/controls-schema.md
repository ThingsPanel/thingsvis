# Contract: Controls Schema (Plugin → Studio)

**Branch**: `007-widget-style`  
**Date**: 2025-12-30

This contract specifies the serializable Controls schema a widget may export, and how Studio interprets it.

## Goals

- Allow plugins to declare property panel structure (grouping + fields) without React dependencies.
- Allow Studio to generate panels dynamically and show binding mode status per field.
- Preserve backward compatibility: plugins without Controls continue to use existing hand-authored panel paths.

## Producer / Consumer

- **Producer**: Plugin package (Module Federation remote), exporting `Main: WidgetMainModule`.
- **Consumer**: Studio application, when rendering the right-side properties panel.

## Data Shape (MVP)

> This is a *data contract*; validation should be implemented in `@thingsvis/schema` using Zod.

### Types

```ts
type BindingMode = 'static' | 'field' | 'expr' | 'rule';

type ControlKind = 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json';

type ControlOption = { label: string; value: string | number };

type ControlBinding = {
  enabled: boolean;
  modes: BindingMode[];
};

type ControlField = {
  path: string;      // MVP: flat prop key (maps to DataBinding.targetProp)
  label: string;
  kind: ControlKind;
  options?: ControlOption[];
  default?: unknown;
  binding?: ControlBinding;
};

type ControlGroupId = 'Content' | 'Style' | 'Data' | 'Advanced';

type ControlGroup = {
  id: ControlGroupId;
  label?: string;
  fields: ControlField[];
};

type WidgetControls = {
  groups: ControlGroup[];
};
```

### Mapping to Node Schema (MVP)

- `ControlField.path` MUST map to a single `targetProp` string.
- Studio uses `path` to read/write:
  - Static: `node.schemaRef.props[path]`
  - Binding: `node.schemaRef.data[]` entry where `targetProp === path`

### Binding modes semantics

- `static`: UI shows direct input control; no `DataBinding` for the field.
- `field`: UI shows Field Picker; writing results in canonical expression: `{{ ds.<id>.data.<path> }}`.
- `expr`: UI shows expression editor; writing results in `{{ ... }}`.
- `rule`: reserved (do not implement in MVP; may appear in `modes` list but UI can disable or hide it).

## Compatibility rules

- If `Main.controls` is missing, Studio MUST fall back to the existing panel implementation.
- If `Main.controls` is present but invalid, Studio SHOULD fall back and surface a diagnostic in dev mode.
