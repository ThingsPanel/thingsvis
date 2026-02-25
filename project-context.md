# Project Context

## Architecture Overview
The Thingsvis platform uses React components spanning multiple editor panels. Custom input configurations inside `PropsPanel` include rendering dynamic rows based on binding modes (`ControlFieldRow.tsx`).

## Key Technical Decisions
- React hooks, particularly `useTranslation`, must be initialized exactly within the functional component's block rendering scope, even on private component definitions within the same file (e.g. `NodeSelector`). 

## Current State
- Missing `t` translation variable injected on `ControlFieldRow.tsx`. Fixed by explicitly importing and defining `useTranslation` in both internal components to prevent runtime ReferenceErrors during node type specific panel configuration setups.

## Known Issues / Risks
- An unresolved minor downstream binary module typescript warning (`@leafer/interface` format) exists in the build pipeline but does not block development operations.

## Domain Knowledge
- `ControlFieldRow.tsx` utilizes `NodeSelector` purely for internal routing logic. Internationalization `T` hooks required everywhere translatable literals exist.
