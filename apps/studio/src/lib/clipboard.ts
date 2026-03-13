/**
 * In-memory clipboard module for Copy, Paste, Duplicate
 *
 * Stores a serialized snapshot of nodes and tracks paste offset counter.
 * The clipboard is scoped to the current editor session.
 */

import type { NodeSchemaType } from '@thingsvis/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * Data binding type (matches NodeSchemaType.data element)
 */
type DataBindingEntry = { targetProp: string; expression: string }

/**
 * A serializable snapshot of a node's schema at copy time.
 */
export interface NodeSnapshot {
  id: string // source id; not reused on paste
  type: string
  position: { x: number; y: number }
  size?: { width: number; height: number }
  props?: Record<string, unknown>
  style?: Record<string, unknown>
  parentId?: string
  data?: DataBindingEntry[]
}

/**
 * Clipboard payload containing the copied node snapshots.
 */
export interface ClipboardPayload {
  version: number
  nodes: NodeSnapshot[]
}

// =============================================================================
// Module State
// =============================================================================

let clipboardPayload: ClipboardPayload | null = null
let pasteCountSinceCopy = 0

// =============================================================================
// UUID Generation
// =============================================================================

/**
 * Generate a unique ID for pasted/duplicated nodes.
 * Uses crypto.randomUUID when available, otherwise falls back to timestamp + random.
 */
function generateNodeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// =============================================================================
// Copy Operations
// =============================================================================

/**
 * Convert NodeSchemaType to NodeSnapshot for storage.
 */
function nodeToSnapshot(node: NodeSchemaType): NodeSnapshot {
  const snapshot: NodeSnapshot = {
    id: node.id,
    type: node.type,
    position: { ...node.position },
  }

  if (node.size) {
    snapshot.size = { ...node.size }
  }
  if (node.props) {
    snapshot.props = { ...node.props }
  }
  if (node.style) {
    snapshot.style = { ...node.style }
  }
  if (node.parentId) {
    snapshot.parentId = node.parentId
  }
  if (node.data) {
    snapshot.data = [...node.data]
  }

  return snapshot
}

/**
 * Copy nodes to the internal clipboard.
 * Resets the paste counter on successful copy.
 *
 * @param nodes - Array of nodes to copy
 */
export function copyNodes(nodes: NodeSchemaType[]): void {
  if (nodes.length === 0) {
    // No-op: preserve existing clipboard
    return
  }

  clipboardPayload = {
    version: 1,
    nodes: nodes.map(nodeToSnapshot),
  }
  pasteCountSinceCopy = 0
}

/**
 * Read the current clipboard payload.
 *
 * @returns The clipboard payload, or null if empty
 */
export function readClipboard(): ClipboardPayload | null {
  return clipboardPayload
}

/**
 * Check if the clipboard has content.
 */
export function hasClipboardContent(): boolean {
  return clipboardPayload !== null && clipboardPayload.nodes.length > 0
}

// =============================================================================
// Paste Operations
// =============================================================================

/**
 * Offset constants for paste operations.
 */
const PASTE_OFFSET_PX = 20

/**
 * Get the next paste offset and increment the counter.
 * Each paste since the last copy increases the offset.
 *
 * @returns Object with dx, dy offsets and the current paste count n
 */
export function nextPasteOffset(): { dx: number; dy: number; n: number } {
  pasteCountSinceCopy += 1
  const n = pasteCountSinceCopy
  return {
    dx: PASTE_OFFSET_PX * n,
    dy: PASTE_OFFSET_PX * n,
    n,
  }
}

/**
 * Create new nodes from a clipboard payload with offset applied.
 * Generates new unique IDs for all pasted nodes.
 *
 * @param payload - The clipboard payload to paste from
 * @param offset - The offset to apply to all nodes
 * @returns Array of new NodeSchemaType with unique IDs and applied offset
 */
export function makePastedNodes(
  payload: ClipboardPayload,
  offset: { dx: number; dy: number }
): NodeSchemaType[] {
  return payload.nodes.map((snapshot) => {
    const newNode: NodeSchemaType = {
      id: generateNodeId(),
      type: snapshot.type,
      position: {
        x: snapshot.position.x + offset.dx,
        y: snapshot.position.y + offset.dy,
      },
    }

    if (snapshot.size) {
      newNode.size = { ...snapshot.size }
    }
    if (snapshot.props) {
      newNode.props = { ...snapshot.props }
    }
    if (snapshot.style) {
      newNode.style = { ...snapshot.style }
    }
    if (snapshot.parentId) {
      newNode.parentId = snapshot.parentId
    }
    if (snapshot.data) {
      newNode.data = [...snapshot.data]
    }

    return newNode
  })
}

// =============================================================================
// Duplicate Operations
// =============================================================================

/**
 * Create a non-mutating snapshot from current selection for duplication.
 * This does NOT modify the clipboard - it creates a temporary payload
 * from the given nodes for immediate use.
 *
 * @param nodes - The nodes to create a snapshot from (current selection)
 * @returns A ClipboardPayload that can be used with makePastedNodes
 */
export function createDuplicatePayload(nodes: NodeSchemaType[]): ClipboardPayload | null {
  if (nodes.length === 0) {
    return null
  }

  return {
    version: 1,
    nodes: nodes.map(nodeToSnapshot),
  }
}

// =============================================================================
// Reset (for testing/cleanup)
// =============================================================================

/**
 * Reset the clipboard state (primarily for testing).
 */
export function resetClipboard(): void {
  clipboardPayload = null
  pasteCountSinceCopy = 0
}
