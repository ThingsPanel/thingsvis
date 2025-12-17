# Phase 0 Research — Phase 3: Component Ecosystem (L1)

**Feature**: `F:/coding/thingsvis/specs/001-plugin-ecosystem/spec.md`  
**Date**: 2025-12-17  
**Goal**: Resolve technical unknowns for a Module Federation (MF2) plugin ecosystem with local offline-like caching.

## Decision 1: Use MF2 runtime + explicit remote registration

**Decision**: Use `@module-federation/runtime` to dynamically register remotes and load exposed modules at runtime.

**Rationale**:
- The kernel already depends on `@module-federation/runtime` and uses `init()` + `loadRemote()`.
- This allows loading plugins without rebuilding the host.

**Alternatives considered**:
- Import maps / native ESM remotes: simpler mentally, but conflicts with MF2 mandate and shared singleton constraints.
- Bundle-time federation only: fails the “registry-driven dynamic loading” requirement.

## Decision 2: Registry includes version for cache validation

**Decision**: `registry.json` entries include a `version` string (or content hash) used to validate local cached bundles.

**Rationale**:
- Enables deterministic cache invalidation when a plugin is updated.
- Keeps host behavior stable across deployments.

**Alternatives considered**:
- Rely on HTTP caching headers only: acceptable for MVP but not reliable for “offline-like” behavior.
- Timestamp-based invalidation: risks stale loads across deployments.

## Decision 3: Offline-like caching uses IndexedDB (idb-keyval) + Blob/ObjectURL execution (MVP)

**Decision**: Cache `remoteEntry.js` content in IndexedDB using `idb-keyval`. When the cached version matches the registry, generate a `Blob` + `URL.createObjectURL()` and load the remote entry from that URL.

**Rationale**:
- Works without requiring a service worker.
- Enables deterministic “still loads when offline” behavior after first successful load.

**Alternatives considered**:
- **Service Worker + Cache API**: better long-term because it preserves original URLs (important for chunk loading), but adds lifecycle complexity (registration, update strategy, scope).
- **Browser HTTP cache only**: simplest but not deterministic when network is disabled or cache is evicted.

**Important caveat (MVP constraint)**:
- Loading a federated remote from a `blob:` URL can break chunk loading if the remote produces additional split chunks, because the runtime’s “public path” may resolve relative chunk URLs against the `blob:` origin.
- **Mitigation for MVP**: plugin builds must emit a single-file remote (disable code-splitting for plugins) so `remoteEntry.js` is sufficient to run offline.
- **Follow-up**: add Service Worker caching to support multi-chunk remotes safely (cache `remoteEntry.js` and its chunks under their original URLs).

## Decision 4: Shared plugin build config enforces “no duplicated core deps”

**Decision**: Provide a shared Rspack config for plugins and enforce shared singletons for:
- `react`, `react-dom`
- `leafer-ui`
- `@thingsvis/*` workspace packages

**Rationale**:
- Prevents version skew and runtime conflicts.
- Keeps plugin bundles small and consistent with the constitution’s performance goals.

**Alternatives considered**:
- Let each plugin configure its own federation settings: too error-prone; increases drift.

## Decision 5: CLI uses Commander (entry) + prompts (UX) + fs-extra (templates)

**Decision**: Implement `vis-cli` with Commander for command parsing, `prompts` for optional interactive input, and `fs-extra` for filesystem operations.

**Rationale**:
- Matches your preferred stack and supports both scripted and interactive workflows.

**Alternatives considered**:
- Commander-only (no prompts): acceptable but less friendly for new plugin authors.


