# Project Context

## Architecture Overview
The Thingsvis platform uses React components spanning multiple editor panels. Custom input configurations inside `PropsPanel` include rendering dynamic rows based on binding modes (`ControlFieldRow.tsx`). Platform supports multi-language i18n configurations (`i18next`).

## Key Technical Decisions
- React hooks, particularly `useTranslation`, must be initialized exactly within the functional component's block rendering scope, even on private component definitions within the same file (e.g. `NodeSelector`). 
- When new user interface tabs (e.g., Target Property, Data Source Bindings, Platform configurations) are merged into the `PropsPanel`, `locale/*/editor.json` paths must explicitly accompany frontend UI definitions.

### Schema and Widget Property Editor
- `generateControls` function drives the side panel UX. A critical behavior discovered: wrapping Zod schemas in `default()` creates `ZodDefault` interceptor layers, requiring recursive unwrapping to read the actual `ZodBoolean` or `ZodNumber` node in `zodTypeToKind`, without which it falls back to a string `<input>`.

## Current State
- Missing `t` translation variable injected on `ControlFieldRow.tsx`. Fixed by explicitly importing and defining `useTranslation` in both internal components to prevent runtime ReferenceErrors during node type specific panel configuration setups.
- Discovered 19 missing multi-lingual JSON identifiers (missing keys) within `propsPanel` category. Restored dictionaries on `zh` and `en` definitions correctly avoiding raw uppercase placeholder names from bleeding into the visual editor.
- Mined the entire `apps/studio/src/**/*.tsx` codebase for scattered `t('key', 'defaultVal')` usages missing from JSON roots context. Successfully identified and inserted ~80 nested missing mappings into JSON localization to cover hidden tabs like 'DataSource Config', 'Image upload', and 'Field selection.'
- ECharts Line, Bar, and Pie schemas were radically minified to mirror Grafana plugin philosophy. Removed legacy unmanageable styles, implementing `echarts-gauge` and replacing manual hardcoded logic with `ctx.theme` bindings and `Dataset` mechanisms.

## Known Issues / Risks
- An unresolved minor downstream binary module typescript warning (`@leafer/interface` format) exists in the build pipeline but does not block development operations.

## Domain Knowledge
- `ControlFieldRow.tsx` utilizes `NodeSelector` purely for internal routing logic. Internationalization `t` hooks required everywhere translatable literals exist. If `PropsPanel.tsx` invokes `t('propsPanel.exampleKey')` without corresponding dict maps, uppercase raw namespaces `PROPSPANEL.EXAMPLEKEY` leak on interface rendering.
- Code architecture includes usages defining dynamic translations (e.g. `t('中文', 'English')`). Missing mapping forces fallback renders on 'zh' locale mapping improperly. Root inclusion to `zh/editor.json` mitigates all undefined mappings.
- **ECharts Plugin Philosophy**: To allow pure "Data Mapping" visual separation, dataset inputs skip explicit `json` input kinds in the right panel and lock exclusively to `['field', 'expr']` modes within the `bindings`. Visual style adapts universally across instances by reading the injected `ctx.theme.isDark` state during chart initialization.
