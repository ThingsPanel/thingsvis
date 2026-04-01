# ThingsVis Engineering Conventions

This document defines the default engineering conventions for this repository.
It is intentionally practical and repo-specific. It follows patterns commonly
seen in strong TypeScript monorepos and UI projects, then narrows them to what
actually applies in `thingsvis`.

If a task spec, maintainer instruction, or existing subsystem contract conflicts
with this file, follow the more specific source first.

## 1. Scope And Priorities

Use this order of precedence:

1. Explicit maintainer or reviewer instruction
2. Approved task spec in `.ai/specs/`
3. Existing public contract in the touched module
4. This conventions file
5. Personal preference

Default principle: prefer small, reversible, contract-preserving changes.

## 2. Workspace Baseline

- Package manager: `pnpm@9.x`
- Node: `>=20.10.0`
- Language: TypeScript-first
- Test runner: `vitest`
- Formatter: `prettier`
- Bundling in most packages: `rspack`
- Repo shape: pnpm workspace monorepo with `apps/`, `packages/`, `tools/`

Before assuming a new tool or pattern is allowed, check whether the repo
already uses it. Match the local style before introducing a new dependency or
abstraction.

## 3. Monorepo Boundaries

Honor package ownership and avoid cross-layer leakage.

- `packages/thingsvis-schema`: shared data contracts and types
- `packages/thingsvis-kernel`: runtime logic, execution, state, bindings
- `apps/studio`: editor UI and authoring workflows
- `apps/server`: backend and persistence concerns
- `packages/widgets/*`: built-in widgets and widget-local assets
- `tools/`: CLI and build utilities

Rules:

- Put shared contracts in `@thingsvis/schema`, not in app-local files.
- Keep UI behavior out of kernel packages.
- Do not deep-import internal source files from sibling packages.
  Use public package entry points instead.
- Respect the existing ESLint restriction against imports such as
  `packages/thingsvis-ui/src/*`, `packages/thingsvis-kernel/src/*`,
  `packages/thingsvis-schema/src/*`.

## 4. Change Scope

- Keep each change focused on one problem.
- Do not mix feature work, broad refactors, formatting churn, and docs cleanup
  unless they are directly coupled.
- Do not rewrite adjacent files only for style consistency.
- Preserve unrelated user changes in a dirty worktree.
- When touching shared contracts, audit downstream callers before merging.

## 5. TypeScript And Code Style

Follow the existing repo style, then apply these defaults:

- Prefer explicit, readable code over compact clever code.
- Keep functions small enough to read top-to-bottom without scrolling through
  unrelated branches.
- Prefer guard clauses over deep nesting.
- Avoid boolean flags that create multiple unrelated behaviors in one function.
- Prefer pure helpers for geometry, transforms, parsing, and data mapping.
- Add comments only when the intent is not obvious from code.
- Source-code comments must be in English.
- Identifiers, commit messages, and log messages should be in English.
- Use ASCII by default in source files unless the file is data that must carry
  localized text.

Formatting baseline from `.prettierrc.json`:

- `printWidth: 100`
- `tabWidth: 2`
- `semi: true`
- `singleQuote: true`
- `trailingComma: all`
- `endOfLine: lf`

## 6. Imports And Dependencies

- Prefer existing workspace utilities over adding a new dependency.
- If a helper belongs to multiple packages, move it to a shared package instead
  of duplicating it.
- Avoid circular imports between workspace packages.
- Do not add a dependency for a task that can be solved with the platform or an
  existing utility.

## 7. Runtime Configuration, URLs, And Secrets

- Never hardcode credentials, tokens, API hosts, or environment-specific
  endpoints in runtime code.
- Read mutable runtime configuration from environment variables, server config,
  or existing config layers.
- Safe constants that are part of a public standard are allowed, for example:
  `http://www.w3.org/2000/svg`, MIME types, XML namespaces, or schema URIs.
- Package-local dev ports declared in `package.json` scripts are allowed when
  they are part of the repo's local development setup.
- Never commit real secrets. Use `.env.example` as the source of truth for
  required variables.

## 8. UI, UX, And React Conventions

- Preserve the established visual language when editing existing product areas.
- Do not change existing Studio interaction semantics, keyboard behavior, panel
  layout expectations, or editing flow unless the task explicitly requires it.
- Prefer deterministic rendering over effect-heavy implementations.
- Keep expensive calculations outside hot render paths when practical.
- Do not add `console.*` in production paths unless there is an existing,
  accepted debug convention in that file.
- When suppressing an ESLint rule, keep the suppression local and explain why.

For React code:

- Follow existing hook patterns already used in the module.
- Do not add memoization primitives by default unless profiling or local style
  shows a real need.
- Prefer state derivation over duplicated state when possible.

## 9. Widget Authoring Conventions

Widget development in this repo is based on `vis-cli` and
`@thingsvis/widget-sdk`.

Preferred flow:

1. Use `pnpm vis-cli create <category> <name>` to generate the standard scaffold
2. Define props and defaults in `schema.ts`
3. Declare editor controls in `controls.ts`
4. Define metadata, default size, and constraints in `metadata.ts`
5. Implement the canonical runtime entry in `index.ts` via `defineWidget(...)`
6. Run `pnpm vis-cli validate <widget-path-or-id>` to validate the contract
7. Run `pnpm vis-cli verify <widget-path-or-id>` for deliverability checks
8. Use `pnpm vis-cli dev <widget-path-or-id>` or `pnpm dev` for Studio
   integration work

The preferred widget structure in this repo is:

1. `schema.ts`: prop schema and defaults
2. `controls.ts`: editor controls
3. `metadata.ts`: widget metadata, default size, constraints
4. `index.ts`: runtime implementation via `defineWidget`
5. `locales/*.json`: editor i18n strings

Rules for widgets:

- Create new widgets through `vis-cli create` by default. Do not handcraft a
  package structure that diverges from the template without an explicit reason.
- The scaffold generated by `vis-cli` is the canonical widget contract in this
  repo. Do not introduce alternative legacy entry patterns as a new default.
- `index.ts` must use `defineWidget(...)` as the primary runtime entry. Do not
  export a parallel runtime protocol.
- `controls.ts` should prefer `generateControls(...)` or
  `createControlPanel(...)`. Do not invent a custom controls format that bypasses
  the SDK contract.
- `@thingsvis/widget-sdk` is the runtime contract layer for widgets. Prefer the
  SDK primitives it already provides, such as `defineWidget`,
  `generateControls`, `createControlPanel`, and existing color/locale/overlay
  helpers.
- If the SDK already provides a standard capability, do not reimplement the
  same infrastructure inside one widget package.
- `metadata.ts` is the single source of truth for default size and constraints.
  Do not redefine the same values inline in `index.ts`.
- Treat published widget IDs, package names, schema field names, control paths,
  and registry-facing metadata as persistence contracts. Do not rename or remove
  them without a migration path or compatibility layer.
- Keep `schema.ts`, `controls.ts`, and runtime behavior aligned. Do not expose
  dead fields that are ignored by rendering.
- All editor-facing text must follow the i18n rules in section 10.
- If a control supports dynamic data, explicitly enable binding in
  `controls.ts` and ensure runtime code handles changing values safely.
- Guard runtime math against invalid ranges, division by zero, `NaN`, and
  missing data.
- For SVG-based widgets, prefer simple shapes and predictable view boxes over
  deeply nested markup.
- SVG comments, if any, must be English. Remove decorative comments if they add
  no value.
- When a widget needs overlays, theme color resolution, or locale resolution,
  prefer SDK-exported types and helpers over ad-hoc local protocols.

## 10. Internationalization

- Do not hardcode user-facing strings in source code, regardless of language.
- Do not treat `zh` and `en` as the definition of "i18n complete", and do not
  infer internationalization correctness from the mere presence of Chinese or
  English.
- Design i18n for multi-language extensibility. Adding a new locale should not
  require business-logic branches, control-protocol changes, or render-path
  rewrites.
- Put UI copy in locale files or existing translation layers.
- Keep translation keys stable, descriptive, and language-agnostic.
- Avoid mixing literal language objects with translation keys in the same
  control model unless the API strictly requires it.
- Locale files and `package.json > thingsvis.i18n` are declaration-layer data
  and may contain language text. The prohibition applies to business logic,
  control protocols, and render code that hardcode language literals.
- Do not hardcode `{ zh, en }` style structures in source code as the default
  i18n pattern. If a legacy API temporarily requires that shape, treat it as a
  compatibility exception and converge back to locale-key-based i18n as soon as
  practical.
- Locale files may contain any target language; source-code comments should
  not.

## 11. Testing And Validation

Use the narrowest command that proves the change.

Preferred order:

1. Targeted package `typecheck`
2. Targeted unit tests
3. Relevant app or workspace tests
4. Build only when packaging or distribution behavior changed

Common commands:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Widget-focused examples:

- `pnpm --filter thingsvis-widget-industrial-valve typecheck`
- `pnpm --filter thingsvis-widget-industrial-pipe test`

Validation expectations:

- UI changes: include at least one manual verification note
- Geometry or transform logic: add or update tests when behavior changes
- Binding or data-flow changes: verify both static and dynamic paths
- Contract changes: verify downstream consumers

Known rule: if repo-wide tests already have unrelated red cases, document that
clearly instead of claiming a green workspace.

## 12. Review Gates

A change is not ready if any of these are true:

- it breaks an existing public contract without migration
- it adds dead config or dead props
- it hardcodes environment-specific runtime values
- it introduces user-visible strings outside i18n
- it leaves source comments in Chinese
- it skips the smallest relevant validation command without explanation
- it changes behavior but provides no verification note

## 13. Docs And Change Hygiene

Update docs when you change:

- widget authoring flow
- CLI commands or generated file structure
- Studio user-visible workflows
- embed message behavior
- backend setup or environment variables

Do not create speculative docs for APIs or flows that do not exist yet.

## 14. Commit And PR Conventions

- Use Conventional Commits
- Keep commit scope aligned with the touched area
- Prefer one logical change per commit

Examples:

- `feat(widget): add binding support for industrial controls`
- `fix(studio): normalize rotated anchor projection`
- `docs(conventions): add repo engineering rules`

## 15. Agent Notes

When an automated coding or review agent works in this repo, it should:

- read this file before planning substantial edits
- prefer repo-local conventions over generic model defaults
- cite exact files and commands used for validation
- call out unrelated failing tests instead of silently ignoring them
- avoid changing more files than the approved task requires
