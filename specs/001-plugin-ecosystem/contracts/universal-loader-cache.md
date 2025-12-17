# Contract: Universal Loader Cache Behavior

**Feature**: Phase 3 — Component Ecosystem (L1)  
**Date**: 2025-12-17

## Purpose

Define the observable behavior of the kernel’s `UniversalLoader` when caching remote entries locally.

## Inputs

- `remoteName: string`
- `remoteEntryUrl: string`
- `version: string` (from registry)
- `module: string` (default `./Main`)

## Required Behavior

1. **Cache read first**:
   - If a local cached record exists for `remoteEntryUrl` and its `version` matches, the loader uses it to load the remote without network.
2. **Network fetch when missing/stale**:
   - If no cached record exists, or version differs, the loader fetches `remoteEntryUrl`, stores it locally, then loads it.
3. **Graceful fallback**:
   - If local storage is unavailable (disabled quota, unsupported), the loader falls back to normal network loading.
4. **Non-fatal failures**:
   - If loading fails, the loader surfaces a clear error and does not crash the host.

## Caching Key

- Cache key is based on `remoteEntryUrl` (and optionally a stable prefix like `thingsvis:`).
- Validity is determined by matching `version` from the registry.

## Concurrency

- If multiple callers attempt to load the same `(remoteName, module)` concurrently, the loader deduplicates the work and returns the same in-flight promise.
- If multiple callers attempt to fetch/cache the same `remoteEntryUrl` concurrently, the loader deduplicates the fetch/cache step as well.


