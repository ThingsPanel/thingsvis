/**
 * Creation Tool Types
 *
 * Type definitions for node creation tools
 */

/**
 * Tool interaction mode
 */
export type ToolInteractionMode =
  | 'drag' // Drag to create with custom size (rectangle, circle)
  | 'click' // Click to create at position (text)
  | 'auto'; // Auto-place after selection (image)

/**
 * Specification for a creation tool
 */
export type NodeCreationSpec = {
  /** Registry component ID (e.g., 'basic/rectangle') */
  componentId: string;
  /** Default size for click-to-create (in world coordinates) */
  defaultSize: { width: number; height: number };
  /** Minimum size to prevent near-zero nodes */
  minSize: { width: number; height: number };
  /** Default props to apply to created nodes */
  defaultProps: Record<string, unknown>;
  /** Whether the component supports resizing */
  resizable: boolean;
  /** Interaction mode for this tool */
  interactionMode: ToolInteractionMode;
};

/**
 * Tool default sizes per the spec:
 * - Rectangle: 120×80 (drag to create)
 * - Circle: 100×100 (drag to create)
 * - Text: auto-size (click to create)
 * - Image: 240×240 max (auto-place after file selection)
 */
export const TOOL_SPECS: Record<string, NodeCreationSpec> = {
  rectangle: {
    componentId: 'basic/rectangle',
    defaultSize: { width: 120, height: 80 },
    minSize: { width: 20, height: 20 },
    defaultProps: { fill: '#dbeafe', stroke: 'transparent', strokeWidth: 0, cornerRadius: 0 },
    resizable: true,
    interactionMode: 'drag',
  },
  circle: {
    componentId: 'basic/circle',
    defaultSize: { width: 100, height: 100 },
    minSize: { width: 20, height: 20 },
    defaultProps: { fill: '#dbeafe', stroke: 'transparent', strokeWidth: 0 },
    resizable: true,
    interactionMode: 'drag',
  },
  text: {
    componentId: 'basic/text',
    defaultSize: { width: 200, height: 40 },
    minSize: { width: 50, height: 20 },
    defaultProps: { text: '请输入文本' },
    resizable: false,
    interactionMode: 'click',
  },
  image: {
    componentId: 'media/image',
    defaultSize: { width: 240, height: 240 },
    minSize: { width: 40, height: 40 },
    defaultProps: {},
    resizable: true,
    interactionMode: 'auto',
  },
  line: {
    componentId: 'basic/line',
    defaultSize: { width: 220, height: 80 },
    minSize: { width: 40, height: 20 },
    defaultProps: {},
    resizable: true,
    interactionMode: 'drag',
  },
};

/**
 * Check if a tool ID is a creation tool
 */
export function isCreationTool(toolId: string): boolean {
  return toolId in TOOL_SPECS;
}

/**
 * Check if a tool uses drag interaction
 */
export function isDragTool(toolId: string): boolean {
  return TOOL_SPECS[toolId]?.interactionMode === 'drag';
}

/**
 * Check if a tool uses click interaction
 */
export function isClickTool(toolId: string): boolean {
  return TOOL_SPECS[toolId]?.interactionMode === 'click';
}

/**
 * Check if a tool uses auto-place interaction
 */
export function isAutoPlaceTool(toolId: string): boolean {
  return TOOL_SPECS[toolId]?.interactionMode === 'auto';
}

/**
 * Get the spec for a creation tool
 */
export function getToolSpec(toolId: string): NodeCreationSpec | undefined {
  return TOOL_SPECS[toolId];
}
