# Data Model: Copy, Paste, Duplicate Nodes

**Feature**: [spec.md](spec.md)  
**Phase**: 1 - Design & Contracts  
**Date**: 2026-01-08

## Entities

### ClipboardPayload

Represents the copied node snapshot stored by the editor.

- `version: number`
  - Allows future evolution of payload shape.
- `nodes: NodeSnapshot[]`
  - Serialized node schemas to recreate on paste/duplicate.

### NodeSnapshot

A serializable snapshot of a node’s schema at copy time.

- `id: string` (source id; not reused on paste)
- `type: string`
- `position: { x: number, y: number }`
- `size?: { width: number, height: number }`
- `props?: Record<string, unknown>`
- `style?: Record<string, unknown>`
- `parentId?: string`
- `data?: unknown[]`

Notes:
- Lock state is **not** part of `NodeSchemaType`; the kernel stores lock in runtime node state.

### ClipboardState (module-local)

Ephemeral state for paste offsets.

- `payload: ClipboardPayload | null`
- `pasteCountSinceCopy: number`
  - Resets to `0` on Copy, increments on each Paste/Duplicate.

## Relationships

- ClipboardPayload contains 1..N NodeSnapshots.
- Paste/Duplicate transforms NodeSnapshots into new `NodeSchemaType` nodes by:
  - Assigning new ids
  - Applying deterministic offset to each node’s position

## Validation Rules

- ClipboardPayload is considered empty if `payload == null` or `payload.nodes.length === 0`.
- Paste is a no-op when clipboard is empty.
- On paste/duplicate, all created node IDs must be unique and must not collide with existing node IDs.

## State Transitions

- Copy:
  - `payload := serialize(selection)`
  - `pasteCountSinceCopy := 0`
- Paste:
  - if clipboard empty: no-op
  - else `pasteCountSinceCopy++` and create nodes with offset $(20n, 20n)$
- Duplicate:
  - if selection empty: no-op
  - else `pasteCountSinceCopy++` and create nodes with offset $(20n, 20n)$
