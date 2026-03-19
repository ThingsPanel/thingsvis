# Iteration Log

## Sub-task 1: Stabilize save/preview/back editor behavior
- **What was done**: Removed the noisy "saved" save-indicator copy, made save payload generation read the latest canvas config via a ref-backed setter, completed the project-open rehydration path for theme/background/preview settings, and changed preview back to return to the original editor tab when preview was opened as a separate tab.
- **What was tried & failed**: No failed implementation branch yet. Initial root-cause scan showed the user-visible bugs were mixed between UX noise and deeper state divergence.
- **What succeeded**: A low-risk patch set that does not change persistence contracts but reduces state-staleness windows and removes one misleading preview-back path.
- **How it was tested**: `pnpm --filter studio typecheck` passed.
- **Key decisions & rationale**: Kept the first fix batch narrowly scoped to no-regret changes. Deeper issues around duplicated state sources and fragmented rehydration are being recorded as architecture debt instead of continuing with piecemeal fixes only.
- **Time/Iteration count**: 1 iteration

## Sub-task 2: Record editor state architecture debt for future governance
- **What was done**: Wrote a new architecture issue document covering editor/persistence/preview state divergence, created a staging copy in the workspace, and synced the issue plus updated index into `/Users/junhong/Downloads/code/thingsvis-internal-docs/docs/architecture/issues`.
- **What was tried & failed**: The first staging index draft was too minimal and would have dropped the existing issue list, so it was replaced with an additive version before sync.
- **What succeeded**: The internal architecture index now includes the new issue, and the issue document captures confirmed facts, code evidence, symptom scope, option comparison, and a final recommendation.
- **How it was tested**: Verified the copied files exist and inspected the synced index and issue file contents under `thingsvis-internal-docs/docs/architecture/issues`.
- **Key decisions & rationale**: Treated problems 2 and 3 as the same architecture issue cluster because they share the same root cause: split truth sources and fragmented rehydration/preview flows.
- **Time/Iteration count**: 1 iteration

## Sub-task 3: Choose refactor order and generate executable task files
- **What was done**: Reviewed the system map, data-flow document, and both architecture issues; chose to start with the editor/persistence/preview unification task instead of collecting more issues first; created one executable task file per architecture issue in `docs/architecture-issues-staging/tasks`.
- **What was tried & failed**: No alternate implementation was attempted; the only rejected option was “continue expanding the issue pool before acting”.
- **What succeeded**: The new task files now contain priority, scope, dependencies, target design, file list, validation, risks, and explicit do-not-do constraints, so execution can start without re-planning.
- **How it was tested**: Checked the current architecture docs and generated task files locally.
- **Key decisions & rationale**: There is already enough evidence to start. Continuing to collect more architecture issues would widen the surface area faster than it would improve the current decision quality.
- **Time/Iteration count**: 1 iteration

## Sub-task 4: Move architecture tasks into internal docs and organize issue-task structure
- **What was done**: Created `/Users/junhong/Downloads/code/thingsvis-internal-docs/docs/architecture/tasks`, synced the per-issue task files and a tasks index there, updated the internal issues index to point to its corresponding task files, and removed the temporary staging copies from the `thingsvis` workspace.
- **What was tried & failed**: No failed branch. The only correction made was to stop using the workspace staging path as a final location after the user clarified the requirement.
- **What succeeded**: The internal docs now hold the single source of truth for both architecture issues and architecture tasks, with a clear `issues/` vs `tasks/` split.
- **How it was tested**: Listed the internal docs tree and inspected both `/architecture/issues/00-index.md` and `/architecture/tasks/00-index.md` after sync.
- **Key decisions & rationale**: Keeping issues and tasks in separate directories but linking them through both indexes is the cleanest way to avoid mixing problem definition with execution planning.
- **Time/Iteration count**: 1 iteration

## Sub-task 5: Expand the architecture issue pool with a broader Studio boundary review
- **What was done**: Performed a wider cross-module architecture scan focused on mode selection, save-routing boundaries, embed integration, and the Strategy abstraction; wrote three new issue documents and updated the internal issues index under `/Users/junhong/Downloads/code/thingsvis-internal-docs/docs/architecture/issues`.
- **What was tried & failed**: No implementation branch failed. One candidate concern stayed out of the issue pool because the evidence did not justify a separate architecture issue after grouping overlapping symptoms into larger boundary problems.
- **What succeeded**: The issue pool now covers three additional confirmed debt clusters: mixed runtime/save/identity boundaries, scattered embed protocol and host-adapter responsibilities, and divergence between the Strategy abstraction and the real editor main path.
- **How it was tested**: Re-read the relevant source files with line-number evidence, reviewed the staged markdown drafts, copied them into the internal docs directory, then verified the final file list and updated `00-index.md` contents in the internal docs location.
- **Key decisions & rationale**: Added only issues with a complete evidence chain and clear long-term consequences. The docs now lead with plain-language summaries so future triage can immediately distinguish short-term pain from long-term architecture risk.
- **Time/Iteration count**: 1 iteration

## Sub-task 6: Check cross-package decoupling and widget/runtime contract integrity
- **What was done**: Extended the review beyond `apps/studio` into `thingsvis-kernel`, `thingsvis-ui`, `thingsvis-schema`, `thingsvis-widget-sdk`, and representative widgets. Confirmed and documented two additional architecture issues: hidden global/singleton runtime coupling across core packages, and fragmentation of widget contracts/loaders across schema, sdk, studio, ui, and legacy kernel interfaces.
- **What was tried & failed**: No code change branch failed. The only rejected stopping point was the earlier assumption that the issue pool was already sufficient after the Studio-only review; the cross-package scan showed that would have been premature.
- **What succeeded**: The internal architecture issue pool now includes package-boundary risks that directly affect whether editor/kernel/ui/widgets are truly decoupled, which was not fully covered by the earlier Studio-focused issues.
- **How it was tested**: Read the relevant source modules with line-number evidence, synced two new issue documents plus the refreshed index into the internal docs issue directory, and verified the copied file list and index entries.
- **Key decisions & rationale**: Concluded that it is not yet safe to stop architecture discovery. Even if the earlier Studio issues were fixed, hidden runtime singletons and fragmented widget contracts would still be capable of producing new structural regressions.
- **Time/Iteration count**: 1 iteration

## Sub-task 7: Final closure scan for dependency graph and legacy/public surface
- **What was done**: Performed a final focused scan of workspace package imports, package public exports, deprecated/legacy/MVP/stub markers, and cross-package runtime edges. Re-validated that the remaining public-surface and dependency-graph risks fold into existing issues `06` and `07`, rather than forming a new eighth architecture issue.
- **What was tried & failed**: No additional issue document was created because the scan did not reveal a new independent cross-layer problem cluster. The remaining findings were supporting evidence for already documented runtime/global coupling and widget-contract fragmentation.
- **What succeeded**: Reached architecture-discovery closure criteria for this phase: all major dependency directions are now mapped, legacy/stub public surfaces are assigned to existing issues, and the last focused scan did not produce a new core architecture category.
- **How it was tested**: Searched all package imports, reviewed package public entry points (`schema`, `kernel`, `ui`, `widget-sdk`), and examined legacy/stub/compatibility markers across the repository.
- **Key decisions & rationale**: Distinguished between “the codebase is now safe” and “the architecture problem inventory is complete enough to stop discovery”. The former is false; the latter is now true for the current planning phase.
- **Time/Iteration count**: 1 iteration

## Sub-task 8: Convert the issue pool into executable architecture task files
- **What was done**: Generated a full `issues -> tasks` mapping under `/Users/junhong/Downloads/code/thingsvis-internal-docs/docs/architecture/tasks`, adding task files for issues `03` through `07`, refreshing tasks `01` and `02`, and rewriting both the tasks index and issues index so they agree on priority, dependency order, and file mapping.
- **What was tried & failed**: No alternative branch failed. The main design choice was whether to keep the older P1/P2 ordering centered on issue `02`; it was intentionally replaced with a system-first order that starts from runtime services, runtime context, and widget contract canonicalization.
- **What succeeded**: The architecture docs now contain a complete executable backlog with one task file per issue, plus shared global guardrails covering canonical domain objects, single formal paths, no hidden runtime bridges, no public MVP/legacy dominance, and a stable target dependency graph.
- **How it was tested**: Verified the final contents of `/architecture/tasks/00-index.md`, checked the task file list under the internal docs tasks directory, and confirmed `/architecture/issues/00-index.md` now points to the new task files and priority order.
- **Key decisions & rationale**: Prioritized `06 -> 03 -> 07` ahead of the earlier user-visible symptom work because the user explicitly asked to treat “system-wide single source of truth” as the gating rule before starting execution.
- **Time/Iteration count**: 1 iteration
