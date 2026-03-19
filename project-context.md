# Project Context

## Architecture Overview
- `apps/studio` currently keeps editor canvas state in both React local state (`canvasConfig`) and kernel store state (`page.config` / `canvas`).
- Persistence and rehydration are fragmented across `useProjectBootstrap`, `ProjectDialog.onProjectLoad`, preview loading, and embed init handling.
- Cloud persistence flows through `apps/studio/src/lib/storage/adapter/cloudAdapter.ts` and server dashboard APIs, while local persistence uses IndexedDB `projectStorage`.

## Key Technical Decisions
- Use a ref-backed `setCanvasConfig` wrapper in `useProjectBootstrap` so save operations always read the newest canvas snapshot, including immediate save/preview actions right after UI edits.
- Suppress the frequent "saved" top-nav copy instead of removing dirty/saving/error visibility entirely.
- Treat preview back-tab behavior as a flow bug: prefer returning to the original editor tab over opening a second editor instance from persisted state.

## Current State
- Direct fixes for save indicator noise, stale canvas save snapshots, project-open rehydration completeness, and preview back behavior are implemented.
- Architecture documentation for multi-source state and fragmented rehydration is completed and synced into the internal docs issue index.
- Refactor execution order is now decided: issue `02-editor-persistence-preview-state-architecture-debt` should be implemented first, then issue `01-asset-state-render-architecture-debt`.
- Per-issue executable task files are now formally stored under `/Users/junhong/Downloads/code/thingsvis-internal-docs/docs/architecture/tasks`, and the temporary workspace staging copies have been removed.
- The internal architecture issue pool has been expanded with three more confirmed issues: mixed runtime/save/identity boundaries, scattered embed protocol/host-adapter responsibilities, and divergence between the Strategy abstraction and the real editor main path.
- A follow-up cross-package review showed the issue pool was still incomplete; two more confirmed issues were added for runtime singleton/global-bridge coupling and fragmented widget contract/loader boundaries.
- A final closure scan of dependency directions and public legacy surfaces did not reveal a new eighth core architecture issue; remaining findings were absorbed into issues `06` and `07`.
- The issue pool has now been converted into a full executable task backlog under `thingsvis-internal-docs/docs/architecture/tasks`, with one task file per issue and a new execution order led by runtime services, runtime context, and widget contract canonicalization.
- Task `06` runtime desingleton is now implemented on the main path: Studio creates runtime services explicitly, kernel exposes `createRuntimeServices()`, and UI no longer reads runtime event bus / patch bridge / preview registry URL from `globalThis`.
- `DataSourceManager` and `Loader` can now be instantiated per runtime. Deprecated singleton exports still exist as compatibility shims, but Studio’s live path now uses the runtime-scoped instances from `apps/studio/src/lib/store.ts`.
- UI action execution (`buildEmit` / widget overlay paths / preview/grid canvases) now accepts an injected datasource manager runtime, so widget writes follow the Studio runtime instance instead of implicitly using the kernel singleton.

## Known Issues / Risks
- The editor still has duplicated page/canvas truth sources and multiple normalization paths.
- Preview currently still depends primarily on persisted reloads rather than a dedicated preview session snapshot.
- `ProjectDialog.onProjectLoad`, preview load, bootstrap load, and embed init still duplicate normalization logic instead of sharing a single loader.
- The direct fixes reduce symptom frequency but do not remove the underlying architectural split; future page-level fields can still drift until the recommended architecture migration is done.
- Runtime mode, save-target routing, storage backend choice, and id semantics are still decided in multiple modules instead of a single boundary object.
- Embed integration is still spread across `message-router`, `EmbedPage`, auth bootstrap, and editor bootstrap rather than a dedicated host adapter layer.
- `EditorShell + Strategy` exists as an intended abstraction, but the real editor still owns substantial mode/bootstrap/save behavior, creating a dual-path architecture.
- Core packages are not yet truly runtime-decoupled because `store`, `DataSourceManager`, `UniversalLoader`, and event bridges still rely on singletons and `globalThis` side channels.
- The widget platform contract is still split between `thingsvis-schema`, `thingsvis-widget-sdk`, Studio registry/loader code, UI loader exports, and legacy kernel interfaces.
- Public package surfaces still expose deprecated or non-canonical entries, but those risks are now explicitly classified under existing runtime-coupling and widget-contract fragmentation issues rather than as a separate uncovered problem class.
- The currently agreed system-level guardrails are now explicit in the tasks index: one canonical domain definition per core object, one formal path per core chain, no hidden runtime bridges, no public MVP/legacy dominance, no new cross-layer issue classes, and a stable target dependency graph.
- Deprecated singleton exports (`dataSourceManager`, `UniversalLoader`, `eventBus`, legacy `subscribeToPatches`) still exist for migration compatibility, so full cleanup remains a follow-up step after downstream consumers finish migrating.

## Domain Knowledge
- Theme/background regressions are tied less to schema validation and more to where/when state is read for save and which rehydration path is used for reopen.
- The repository already maintains an architecture issue index under `thingsvis-internal-docs/docs/architecture/issues`, including a template and one prior issue document.
- Problems “preview back loses edits” and “theme reopens as dawn” belong to the same issue cluster rather than two unrelated bugs.
- For current decision-making, the issue pool is already sufficient; the next highest-value step is implementation, not further issue collection.
- The clean documentation structure is now:
  - `architecture/issues/` for problem definition
  - `architecture/tasks/` for execution plans
  - both sides linked through their respective `00-index.md`
- New issue files added in this review round:
  - `03-mode-save-identity-boundary-architecture-debt.md`
  - `04-embed-protocol-platform-adapter-boundary-architecture-debt.md`
  - `05-strategy-layer-main-path-divergence-architecture-debt.md`
- New issue files added in the cross-package follow-up round:
  - `06-runtime-singleton-hidden-global-bridge-architecture-debt.md`
  - `07-widget-contract-registry-runtime-fragmentation-architecture-debt.md`
- The new issue docs intentionally start with plain-language summaries that state what the problem is, what breaks in the short term, and what gets worse in the long term, so future scans do not need another translation step from technical details to decision impact.
- Current conclusion: it is still too early to stop architecture discovery if the goal is to avoid immediate technical debt in a new project. The package-boundary/runtime-contract layer was not fully covered until issues 06 and 07 were added.
- Updated conclusion after the closure scan: architecture issue discovery can stop for the current planning phase because the core problem inventory is now complete enough. The next step should be solution design and migration planning, not more broad issue hunting.
- The current official execution order is:
  - `06` runtime services / desingleton
  - `03` runtime context / save plan / id boundary
  - `07` widget canonical contract / loader
  - `04` host adapter / embed protocol
  - `02` editor persistence / preview snapshot
  - `01` asset / background / render invalidation
  - `05` editor entry / main-path unification
- Current runtime wiring rule: `apps/studio/src/lib/store.ts` is the composition root for Studio runtime services and should remain the source for runtime-scoped `store`, `dataSourceManager`, `loader`, `eventBus`, and `actionRuntime`.
