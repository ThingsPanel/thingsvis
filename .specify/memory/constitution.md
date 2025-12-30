<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: Filled previously-empty template principles
- Added sections: Additional Constraints, Development Workflow, Plugin Independence (VI)
- Removed sections: N/A
- Templates requiring updates: ✅ none (plan/spec/tasks templates remain valid)
-->

# ThingsVis Constitution

## Core Principles

### I. Micro‑Kernel & Separation of Concerns

- Kernel logic MUST remain UI‑free. Any React/DOM/UI dependencies belong in apps or UI packages, not `packages/thingsvis-kernel`.
- Visual rendering MUST remain behind the existing Leafer/Overlay engine boundaries.
- Components (plugins) MUST be primarily data-driven: they render from props and do not perform network side effects.

Rationale: This preserves testability, performance, and plugin isolation.

### II. Schema‑First Contracts (Zod)

- Runtime data structures that are persisted or exchanged across packages MUST have schemas in `packages/thingsvis-schema`.
- Zod is the source of truth for validation. TypeScript types MUST be derived from schemas where applicable.
- Public schema APIs MUST remain backward compatible unless a migration plan is provided.

Rationale: Prevents silent runtime drift and supports incremental evolution.

### III. Type Safety & Predictability

- TypeScript strict mode MUST remain enabled.
- Avoid `any` in shared contracts. If unavoidable at boundaries, keep it isolated and well‑documented.
- “Magic strings” used as contracts (e.g., binding paths) MUST be explicitly documented and kept stable.

Rationale: Protects a low‑code system from hard-to-debug configuration regressions.

### IV. Backward Compatibility & Incremental Adoption

- Existing saved pages/projects MUST keep rendering and editing without user action.
- New capabilities MUST be opt‑in and degrade gracefully (fallback paths for older content and components).
- Any breaking changes MUST include a migration strategy and validation coverage.

Rationale: Enables rolling upgrades across many dashboards/pages.

### V. Simplicity & Performance

- Prefer the smallest viable feature slice that proves the user workflow.
- Avoid introducing new global abstractions unless the feature requires them.
- Keep interactive editing responsive; avoid heavy computation on the UI thread.

Rationale: The editor must remain usable at scale (many nodes, frequent updates).

### VI. Plugin Independence & Third‑Party Development

- Plugins MUST NOT import from `@thingsvis/*` internal packages (kernel, schema, ui, utils). These packages are for host application use only.
- Plugins MUST define their types inline. The plugin entry interface is a "contract by convention" — the host expects a specific shape, but plugins define it themselves.
- Plugins MAY only depend on:
  - Standard npm packages (e.g., `zod`, `lodash`)
  - Rendering libraries declared as peerDependencies (e.g., `react`, `leafer-ui`)
  - Their own internal modules
- The host uses duck typing to validate plugin exports. If a plugin exports an object with the expected shape, it will work.

Rationale: Third-party developers MUST be able to build, test, and distribute plugins independently without access to this monorepo. This enables a healthy plugin ecosystem beyond the core team.

## Additional Constraints

- Monorepo uses `pnpm` workspaces + Turborepo; new work MUST fit within the existing package/app boundaries.
- Rendering discipline: Leafer/Overlay architecture is authoritative; do not replace or bypass it without an explicit project decision.
- Property resolution and expression evaluation SHOULD remain centralized (single canonical resolver), to avoid divergent behavior between Studio and runtime.

## Development Workflow

- Use Spec‑Driven Development (`/speckit.*`) for non-trivial features.
- Update shared contracts first (schemas/types), then UI, then plugin examples.
- For shared utilities and pure logic, add unit tests where a test harness already exists.

## Quality Gates

- `pnpm typecheck` MUST pass for affected packages/apps.
- Changes to `packages/thingsvis-schema` MUST not break existing imports.
- MVP acceptance scenarios in the feature spec MUST be demonstrable in Studio.

## Governance

- This constitution is authoritative for Specs/Plans/Tasks.
- Amendments MUST be explicit and reviewed; if a principle changes, update dependent templates or feature plans as needed.
- Versioning policy:
	- MAJOR: backward-incompatible governance change
	- MINOR: new principle/section added or materially expanded
	- PATCH: clarifications and non-semantic wording updates

**Version**: 1.1.0 | **Ratified**: 2025-12-30 | **Last Amended**: 2025-12-30
