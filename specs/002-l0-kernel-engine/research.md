# Research & Decisions: Phase 2 - L0 Kernel Engine

**Branch**: `002-l0-kernel-engine`  
**Related Spec**: [spec.md](./spec.md)  
**Related Plan**: [plan.md](./plan.md)

## Overview

This document captures key design decisions and rationale for implementing the L0 Kernel Engine using the mandated ThingsVis tech stack (Rspack, TypeScript 5.x, Zustand+Immer, LeaferJS, React Bypass pattern).

## Decisions

### 1. Rspack Build Configuration Strategy

- **Decision**: Use Rspack (or Rsbuild as a wrapper) consistently across all packages and apps, with library mode for packages (ESM/CJS dual output) and app mode for `apps/preview`.  
- **Rationale**: Consistent build tooling reduces configuration complexity, enables shared Rspack configs, and aligns with constitution requirements. Rspack's performance benefits are especially valuable for the monorepo's incremental builds.  
- **Alternatives considered**:  
  - Using tsup for packages and Rspack only for apps (rejected to maintain consistency and leverage Rspack's library mode capabilities).  
  - Using Vite for apps (rejected because constitution mandates Rspack).

### 2. React Bypass Pattern Implementation

- **Decision**: Implement `VisualEngine` class that subscribes to Zustand store and manually syncs state to LeaferJS objects via a diff algorithm in `sync(nodes)` method. The `CanvasView` React component only renders the container `div` and mounts the engine; React re-renders are minimized to container-level changes only.  
- **Rationale**: Supporting 1000+ nodes at 60 FPS requires bypassing React's reconciliation for every frame. Direct LeaferJS updates are orders of magnitude faster than React re-renders.  
- **Alternatives considered**:  
  - Using React to render each node as a component (rejected due to performance - would cause thousands of re-renders per frame).  
  - Using React Three Fiber's imperative API (not applicable - we're using LeaferJS for 2D).

### 3. Kernel Store Architecture (Vanilla Zustand)

- **Decision**: Use Zustand with Immer middleware in vanilla mode (no React hooks) within `@thingsvis/kernel`. The store is a plain JavaScript class/object that can be imported and used outside React contexts.  
- **Rationale**: Kernel must remain UI-free and runnable in diverse environments (Web Workers, server-side). Vanilla Zustand allows the kernel to be framework-agnostic while still providing immutable state updates via Immer.  
- **Alternatives considered**:  
  - Using Redux Toolkit (rejected - more boilerplate, Zustand is lighter and simpler).  
  - Using plain Immer without Zustand (rejected - Zustand provides subscription model and devtools integration).

### 4. HistoryManager Command Pattern

- **Decision**: Implement `HistoryManager` using the Command Pattern, where each state-changing operation is encapsulated as a `Command` object with `execute()` and `undo()` methods. Commands are stored in a stack for undo/redo navigation.  
- **Rationale**: Command Pattern provides clean separation of operations from state, enables time-travel debugging, and makes undo/redo logic predictable and testable.  
- **Alternatives considered**:  
  - Storing full state snapshots (rejected - memory inefficient for large states).  
  - Using immutable state diffs (considered but Command Pattern is more explicit and easier to reason about).

### 5. SafeExecutor Logic Sandbox (Mock Implementation)

- **Decision**: Implement a mock `SafeExecutor` that wraps user scripts/expressions in try-catch blocks and returns safe results. Full sandboxing (isolated execution context, resource limits) is deferred to a later phase.  
- **Rationale**: Logic sandboxing is complex and requires careful security considerations. A mock implementation allows the kernel architecture to be established while deferring full sandbox implementation to a dedicated phase.  
- **Alternatives considered**:  
  - Using `vm2` or similar Node.js sandboxing (not applicable - browser environment).  
  - Using Web Workers for isolation (deferred - adds complexity, can be added later).

### 6. ResourceLoader Mock Implementation

- **Decision**: Implement a mock `ResourceLoader` that returns placeholder data or uses simple `fetch()` with basic error handling. Full Module Federation integration and remote resource caching are deferred to a later phase.  
- **Rationale**: Remote loading and Module Federation setup can be complex. A mock implementation allows the kernel to demonstrate the loader interface while deferring full remote loading capabilities.  
- **Alternatives considered**:  
  - Full Module Federation setup in this phase (deferred - adds significant complexity, better handled in a dedicated phase).

### 7. HeadlessErrorBoundary Design

- **Decision**: Implement `HeadlessErrorBoundary` as a functional React component that catches errors and renders `props.fallback` (a React element passed from the app). The boundary itself applies no styles - styling is the responsibility of the `fallback` component provided by `apps/preview`.  
- **Rationale**: Maintains headless UI principle - the UI package provides structure and error handling, but styling is applied by consuming apps. This allows different apps to style error states differently.  
- **Alternatives considered**:  
  - Including default error UI in the boundary (rejected - violates headless principle).  
  - Using class component for ErrorBoundary (rejected - functional components are preferred in React 18, and we can use `react-error-boundary` library if needed, but keeping it simple for now).

### 8. VisualEngine Diff Algorithm

- **Decision**: Implement a diff algorithm in `VisualEngine.sync(nodes)` that compares current LeaferJS objects with incoming node state, performing minimal updates (add/remove/update only changed nodes). Use a Map keyed by node ID to track existing objects.  
- **Rationale**: Efficient diffing minimizes DOM/canvas operations and maintains 60 FPS performance with 1000+ nodes. Only updating changed nodes reduces computational overhead.  
- **Alternatives considered**:  
  - Clearing and re-rendering all nodes on every sync (rejected - too slow for large scenes).  
  - Using virtual DOM diffing (not applicable - we're bypassing React, working directly with LeaferJS objects).

## Remaining Notes

- No open `NEEDS CLARIFICATION` items remain for this phase; all major technical decisions have reasonable defaults based on the constitution and performance requirements.  
- Further research on LeaferJS API details and optimization techniques will occur during implementation but does not affect high-level architecture.  
- SafeExecutor and ResourceLoader mock implementations are explicitly scoped as placeholders; full implementations will be designed in future phases with proper security and performance considerations.

