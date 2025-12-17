# Data Model — Phase 3: Component Ecosystem (L1)

**Feature**: `F:/coding/thingsvis/specs/001-plugin-ecosystem/spec.md`  
**Plan**: `F:/coding/thingsvis/specs/001-plugin-ecosystem/plan.md`  
**Date**: 2025-12-17

## Overview

This feature introduces a minimal “component registry” and a local “remote bundle cache” to support dynamic plugin loading and offline-like reuse after first load.

## Entities

### 1) ComponentRegistry

Represents a static JSON artifact served by the host application.

**Fields**:
- `schemaVersion: number` — registry schema version (start at `1`)
- `generatedAt?: string` — ISO timestamp (optional)
- `components: Record<string, ComponentRegistryEntry>` — key is `componentId` (e.g., `basic/rect`)

**Validation rules**:
- `schemaVersion` must be supported by the host
- `components` keys must be non-empty strings and unique

### 2) ComponentRegistryEntry

Resolves a `componentId` to a federated module location and a cache validation version.

**Fields**:
- `remoteName: string` — MF “scope” name (derived from plugin package name)
- `remoteEntryUrl: string` — URL to `remoteEntry.js`
- `exposedModule: string` — MF exposed module path (default: `./Main`)
- `version: string` — semver or content hash used for cache invalidation

**Validation rules**:
- `remoteEntryUrl` must be a valid absolute URL at runtime (dev can allow `http`)
- `version` must be non-empty

### 3) CachedRemoteEntry

A local record stored on-device to support offline reuse.

**Fields**:
- `remoteEntryUrl: string`
- `version: string`
- `contentType: string` — typically `text/javascript`
- `sourceText: string` — JS source of `remoteEntry.js`
- `storedAt: string` — ISO timestamp

**Validation rules**:
- Cache record is considered valid only when `version` matches the registry entry’s `version`

## Relationships

- `ComponentRegistry.components[componentId]` identifies one `ComponentRegistryEntry`.
- `ComponentRegistryEntry.remoteEntryUrl + version` identifies one `CachedRemoteEntry`.

## State Transitions (Cache)

1. **Empty** → (first successful fetch) → **Cached**
2. **Cached (valid)** → (registry version changes) → **Stale**
3. **Stale** → (refetch succeeds) → **Cached (new version)**
4. **Any** → (user clears cache) → **Empty**


