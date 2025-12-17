# Contract: Component Registry (`registry.json`)

**Feature**: Phase 3 — Component Ecosystem (L1)  
**Date**: 2025-12-17

## Purpose

Define the minimal, statically served registry that maps `componentId` → Module Federation remote bundle location.

## Data Shape (TypeScript)

```ts
export type ComponentId = string; // e.g. "basic/rect"

export type ComponentRegistry = {
  schemaVersion: 1;
  generatedAt?: string; // ISO timestamp
  components: Record<ComponentId, ComponentRegistryEntry>;
};

export type ComponentRegistryEntry = {
  remoteName: string;       // MF scope name (derived from plugin package.json name)
  remoteEntryUrl: string;   // absolute URL to remoteEntry.js
  exposedModule: './Main';  // fixed for MVP
  version: string;          // semver or content hash
};
```

## Semantics

- The host loads `registry.json` and looks up the requested `componentId`.
- The host uses `remoteName`, `remoteEntryUrl`, and `exposedModule` to load the federated module.
- The host uses `version` to validate local cached entries.

## Error Conditions

- Registry fetch fails → host displays a non-fatal error state and continues running.
- `componentId` missing from registry → host displays “component not found”.
- Entry is invalid (missing required fields) → host treats the component as unavailable and logs a clear diagnostic.


