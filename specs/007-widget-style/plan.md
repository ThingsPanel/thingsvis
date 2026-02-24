# Implementation Plan: Superset 风格优先的数据配置与绑定

**Branch**: `007-widget-style` | **Date**: 2025-12-30 | **Spec**: [spec.md](./spec.md)

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver a “Superset-style first” binding UX in Studio where users primarily bind component fields by selecting a data source + field (Field Picker), while preserving `{{ ... }}` expressions as an advanced fallback.

MVP scope:

- Add a serializable, React-free `controls` definition to plugin entries so Studio can generate a property panel.
- Implement field-level binding UI modes (static | field | expr) that persist via the existing `node.schemaRef.data: DataBinding[]` mechanism.
- Implement Field Picker that generates canonical expressions `{{ ds.<id>.data.<path> }}`.
- Prove the workflow end-to-end with the `plugins/basic/text` component.

## Technical Context

**Language/Version**: TypeScript 5.3.x (strict), React 18 (Studio UI)  
**Primary Dependencies**: pnpm workspaces + Turbo; Zod; Rsbuild/Rspack; Zustand + Immer (+ zundo); Radix UI + Tailwind  
**Storage**: N/A (kernel store is in-memory; some packages use `idb-keyval` for persistence)  
**Testing**: `pnpm typecheck` (turbo) for affected packages; no repo-wide unit test runner currently configured  
**Target Platform**: Web (Studio) + shared packages
**Project Type**: Monorepo (apps + packages + plugins)  
**Performance Goals**: Keep editing interactions responsive; Field Picker exploration must be depth/size limited  
**Constraints**: Preserve existing `node.schemaRef.props` + `node.schemaRef.data` semantics; keep kernel UI-free; do not change Leafer/Overlay boundaries; incremental opt-in for components  
**Scale/Scope**: MVP targets basic-text and the minimal binding loop; extend to other components later

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Micro‑Kernel & Separation**: PASS (controls are schema-only; Studio UI changes stay in `apps/studio`; runtime stays in `@thingsvis/ui`)
- **Schema‑First (Zod)**: PASS (new Controls contract lives in `packages/thingsvis-schema`)
- **Type Safety & Predictability**: PASS (avoid `any` in shared contracts; keep canonical binding strings documented)
- **Backward Compatibility & Incremental Adoption**: PASS (bindings remain `DataBinding[]`; components without `controls` keep existing panel)
- **Simplicity & Performance**: PASS (MVP focuses on basic-text + Field Picker; enforce depth/size limits)

## Project Structure

### Documentation (this feature)

```text
specs/007-widget-style/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 conceptual model
├── quickstart.md        # Phase 1 integration scenarios
├── contracts/           # Phase 1 contracts
└── tasks.md             # Phase 2 output (/speckit.tasks) - not created by /speckit.plan
```

### Source Code (repository root)
```text
apps/studio/
└── src/
  └── components/RightPanel/PropsPanel.tsx     # Dynamic panel (controls-first) target

packages/thingsvis-schema/
└── src/
  ├── plugin-module.ts                        # Extend WidgetMainModule to include controls
  └── (new) plugin-controls.ts                # Controls contract (React-free)

plugins/basic/text/
└── src/
  ├── index.ts                                # Plugin Main export (adds controls)
  └── spec.tsx                                # Existing prop defaults/types (flat props)

packages/thingsvis-ui/
└── src/engine/PropertyResolver.ts              # Canonical runtime resolution

packages/thingsvis-utils/
└── src/ExpressionEvaluator.ts                  # Evaluates {{ ... }} expressions

packages/thingsvis-kernel/
└── src/store/KernelStore.ts                    # DataSource runtime state for Field Picker
```

**Structure Decision**: This feature is implemented incrementally across existing packages (schema → Studio UI → plugin sample) with no new apps/packages introduced.

## Complexity Tracking

No constitution violations require justification for this MVP.

## Phases & Outputs

### Phase 0 — Outline & Research

Output: [research.md](./research.md)

- Establish canonical binding representation (keep `DataBinding.expression` as `{{ ... }}`).
- Define canonical field reference syntax (`ds.<id>.data.<path>`).
- Define MVP mapping scope (flat prop keys only).
- Define Field Picker guardrails (depth/size limits).

### Phase 1 — Design & Contracts

Outputs:

- [data-model.md](./data-model.md)
- [contracts/controls-schema.md](./contracts/controls-schema.md)
- [contracts/binding-storage.md](./contracts/binding-storage.md)
- [contracts/field-picker.md](./contracts/field-picker.md)
- [quickstart.md](./quickstart.md)

Design highlights:

- Plugin entry adds optional `controls` (React-free) for Studio panel generation.
- Studio persists binding mode results into existing `node.schemaRef.props` and `node.schemaRef.data`.
- Field Picker generates expressions `{{ ds.<id>.data.<path> }}`.

### Phase 2 — Task Breakdown (next command)

Run `/speckit.tasks` to generate `specs/007-widget-style/tasks.md` from this plan and the existing design artifacts.

## Post-Design Constitution Recheck

All principles remain satisfied after Phase 1 design. No unresolved NEEDS CLARIFICATION remains in this plan.

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
