# Contract: Plugin Remote Module (`./Main`)

**Feature**: Phase 3 — Component Ecosystem (L1)  
**Date**: 2025-12-17

## Purpose

Define what a plugin must expose via Module Federation so the host can instantiate and render it.

## Exposed Module Name

- Each plugin remote MUST expose `./Main` (mapped to `./src/index` in the plugin package).

## Export Shape (MVP)

Each plugin’s `./Main` module exports:

```ts
export type ComponentId = string; // e.g. "basic/rect"

export type PluginMainModule = {
  componentId: ComponentId;
  /**
   * Creates a new renderer instance for this component.
   * The returned object is used by the host’s rendering layer.
   */
  create: () => unknown;
  /**
   * Optional visual test entry.
   * Note: kept as `unknown` in shared schema types to avoid coupling the schema package to React types.
   */
  Spec?: unknown;
};
```

## Semantics

- `componentId` MUST match the registry key used to load this plugin.
- `create()` MUST return a new, independent instance each time.
- Any errors thrown during module evaluation or `create()` MUST NOT crash the host; the host wraps these boundaries with sandbox/error handling.

## Notes

- The concrete renderer interface will be aligned with the host rendering layer (Leafer-based) during implementation. The key contract for federation is the existence of `./Main` and a stable `componentId`.


