/**
 * CreateToolLayer
 * 
 * Handles creation tool gestures (drag/click) on the canvas.
 * Routes gestures to the appropriate tool handler based on activeTool.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  screenToWorld, 
  normalizeRect, 
  isClick, 
  enforceMinSize,
  type Viewport,
  type Point,
  type Rect,
} from './coordUtils';
import { isCreationTool, isAutoPlaceTool, getToolSpec, type NodeCreationSpec } from './types';

// Generate unique IDs
function generateId(prefix = 'node'): string {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as unknown as { randomUUID: () => string }).randomUUID === 'function') {
      return (crypto as unknown as { randomUUID: () => string }).randomUUID();
    }
  } catch {
    // fallback
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type GestureState = {
  /** Whether we're currently dragging */
  isDragging: boolean;
  /** Start point in screen coordinates */
  startScreen: Point | null;
  /** Current point in screen coordinates */
  currentScreen: Point | null;
  /** Preview bounds in world coordinates (normalized) */
  previewBounds: Rect | null;
};

type CreateToolLayerProps = {
  /** Currently active tool */
  activeTool: string;
  /** Function to get current viewport state */
  getViewport: () => Viewport;
  /** Function to create node and select it atomically */
  applyNodeInsertAndSelect: (
    nodes: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      size?: { width: number; height: number };
      props: Record<string, unknown>;
    }>,
    selectIds: string[]
  ) => void;
  /** Pending image URL (Object URL for image tool) */
  pendingImageUrl?: string;
  /** Callback when image tool needs to pick a file */
  onImagePickerRequest?: () => void;
  /** Callback when creation is complete */
  onCreationComplete?: () => void;
  /** Callback to notify user edit occurred (for autosave) */
  onUserEdit?: () => void;
  /** Handler for external drag-drop events (from component library) */
  onExternalDrop?: (e: React.DragEvent) => void;
};

export default function CreateToolLayer({
  activeTool,
  getViewport,
  applyNodeInsertAndSelect,
  pendingImageUrl,
  onImagePickerRequest,
  onCreationComplete,
  onUserEdit,
  onExternalDrop,
}: CreateToolLayerProps) {
  const [gesture, setGesture] = useState<GestureState>({
    isDragging: false,
    startScreen: null,
    currentScreen: null,
    previewBounds: null,
  });
  
  // Track if we just completed a creation - disables pointer events immediately
  const [creationCompleted, setCreationCompleted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track if we've already requested a file picker for this tool activation
  // This prevents re-requesting the picker after errors or cancellation
  const hasRequestedPickerRef = useRef(false);
  // Track the tool that last requested the picker to properly reset the flag
  const lastPickerToolRef = useRef<string | null>(null);
  
  // Get the tool spec
  const toolSpec = getToolSpec(activeTool);
  
  // Reset creationCompleted when tool changes to ensure fresh state
  useEffect(() => {
    setCreationCompleted(false);
  }, [activeTool]);
  
  // Reset picker request flag only when switching to a different tool
  useEffect(() => {
    if (activeTool !== 'image' && lastPickerToolRef.current === 'image') {
      hasRequestedPickerRef.current = false;
      lastPickerToolRef.current = null;
    }
  }, [activeTool]);
  
  // Handle image tool activation - request file picker (only once per activation)
  useEffect(() => {
    if (activeTool === 'image' && !pendingImageUrl && onImagePickerRequest && !hasRequestedPickerRef.current) {
      hasRequestedPickerRef.current = true;
      lastPickerToolRef.current = 'image';
      onImagePickerRequest();
    }
  }, [activeTool, pendingImageUrl, onImagePickerRequest]);
  
  // Track the pendingImageUrl we've already processed to prevent duplicate creation
  const processedImageUrlRef = useRef<string | null>(null);
  
  // Handle auto-place tools (like image): automatically place node at canvas center
  // when pendingImageUrl becomes available
  useEffect(() => {
    if (!toolSpec || !isAutoPlaceTool(activeTool) || !pendingImageUrl) {
      return;
    }
    
    // Prevent duplicate creation for the same image
    if (processedImageUrlRef.current === pendingImageUrl) {
      return;
    }
    processedImageUrlRef.current = pendingImageUrl;
    
    // Get viewport and calculate center in world coordinates
    const viewport = getViewport();
    const centerScreen: Point = {
      x: viewport.width / 2,
      y: viewport.height / 2,
    };
    const centerWorld = screenToWorld(centerScreen, viewport);
    
    // Use default size centered at viewport center
    const { width, height } = toolSpec.defaultSize;
    const bounds: Rect = {
      x: centerWorld.x - width / 2,
      y: centerWorld.y - height / 2,
      width,
      height,
    };
    
    // Create the node with image data
    const nodeId = generateId('node');
    const node = {
      id: nodeId,
      type: toolSpec.componentId,
      position: { x: bounds.x, y: bounds.y },
      ...(toolSpec.resizable ? { size: { width: bounds.width, height: bounds.height } } : {}),
      props: { ...toolSpec.defaultProps, dataUrl: pendingImageUrl },
    };
    
    applyNodeInsertAndSelect([node], [nodeId]);
    onUserEdit?.();
    
    // Mark creation as completed IMMEDIATELY to disable pointer events
    // This allows the user to interact with the newly created node right away
    setCreationCompleted(true);
    
    // Complete creation - this will clear pendingImageUrl and switch tool
    onCreationComplete?.();
  }, [activeTool, toolSpec, pendingImageUrl, getViewport, applyNodeInsertAndSelect, onUserEdit, onCreationComplete]);
  
  // Reset processed image ref when pendingImageUrl is cleared
  useEffect(() => {
    if (!pendingImageUrl) {
      processedImageUrlRef.current = null;
    }
  }, [pendingImageUrl]);
  
  // Create node from gesture (does NOT trigger tool reset - that's handled separately)
  const createNodeFromGesture = useCallback((
    spec: NodeCreationSpec,
    bounds: Rect,
    extraProps: Record<string, unknown> = {}
  ) => {
    const nodeId = generateId('node');
    
    const node = {
      id: nodeId,
      type: spec.componentId,
      position: { x: bounds.x, y: bounds.y },
      ...(spec.resizable ? { size: { width: bounds.width, height: bounds.height } } : {}),
      props: { ...spec.defaultProps, ...extraProps },
    };
    
    applyNodeInsertAndSelect([node], [nodeId]);
    onUserEdit?.();
    // Note: onCreationComplete is called separately after pointer cleanup
  }, [applyNodeInsertAndSelect, onUserEdit]);
  
  // Handle pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Prevent any interaction if creation was just completed
    if (creationCompleted) {
      return;
    }
    if (!toolSpec || !containerRef.current) return;
    
    // For image tool, don't start gesture if no image is pending
    if (activeTool === 'image' && !pendingImageUrl) {
      return;
    }
    
    // Check if the click is on an existing node (node-proxy-target or overlay element)
    // If so, don't create a new node - let the selection layer handle it
    const target = e.target as HTMLElement;
    const isOnNode = target.closest('.node-proxy-target') || 
                     target.closest('[data-overlay-node-id]') ||
                     target.closest('[data-node-id]') ||
                     target.closest('.moveable-control') ||
                     target.closest('.selecto-selection');
    if (isOnNode) {
      // Don't prevent default - let the event bubble to selection layer
      return;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    const screenPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    setGesture({
      isDragging: true,
      startScreen: screenPoint,
      currentScreen: screenPoint,
      previewBounds: null,
    });
    
    // Capture pointer for drag tracking
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [toolSpec, activeTool, pendingImageUrl, creationCompleted]);
  
  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!gesture.isDragging || !gesture.startScreen || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const screenPoint: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    const viewport = getViewport();
    const startWorld = screenToWorld(gesture.startScreen, viewport);
    const currentWorld = screenToWorld(screenPoint, viewport);
    const previewBounds = normalizeRect(startWorld, currentWorld);
    
    setGesture(prev => ({
      ...prev,
      currentScreen: screenPoint,
      previewBounds,
    }));
  }, [gesture.isDragging, gesture.startScreen, getViewport]);
  
  // Handle pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!gesture.isDragging || !gesture.startScreen || !toolSpec) {
      setGesture({
        isDragging: false,
        startScreen: null,
        currentScreen: null,
        previewBounds: null,
      });
      return;
    }
    
    const viewport = getViewport();
    const startWorld = screenToWorld(gesture.startScreen, viewport);
    const endScreen: Point = {
      x: gesture.currentScreen?.x ?? gesture.startScreen.x,
      y: gesture.currentScreen?.y ?? gesture.startScreen.y,
    };
    const endWorld = screenToWorld(endScreen, viewport);
    
    // Check if this is a click or drag
    const clickGesture = isClick(gesture.startScreen, endScreen);
    
    let bounds: Rect;
    if (clickGesture) {
      // Click: use default size centered at click point
      const { width, height } = toolSpec.defaultSize;
      bounds = {
        x: startWorld.x - width / 2,
        y: startWorld.y - height / 2,
        width,
        height,
      };
    } else {
      // Drag: use normalized rect with min size enforcement
      bounds = normalizeRect(startWorld, endWorld);
      bounds = enforceMinSize(bounds, toolSpec.minSize.width, toolSpec.minSize.height);
    }
    
    // Build extra props based on tool
    const extraProps: Record<string, unknown> = {};
    if (activeTool === 'image' && pendingImageUrl) {
      extraProps.dataUrl = pendingImageUrl;
    }
    
    // Release pointer capture FIRST to avoid event conflicts
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer was not captured
    }
    
    // Reset gesture state
    setGesture({
      isDragging: false,
      startScreen: null,
      currentScreen: null,
      previewBounds: null,
    });
    
    // Mark creation as completed - this immediately disables pointer events
    // to prevent conflicts before React re-renders and unmounts this component
    setCreationCompleted(true);
    
    // Create the node
    createNodeFromGesture(toolSpec, bounds, extraProps);
    
    // Trigger tool reset after a short delay to ensure React has time to
    // process the state changes and this component properly releases events
    setTimeout(() => {
      onCreationComplete?.();
    }, 0);
  }, [gesture, toolSpec, activeTool, pendingImageUrl, getViewport, createNodeFromGesture, onCreationComplete]);
  
  // Handle Escape key to cancel gesture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gesture.isDragging) {
        setGesture({
          isDragging: false,
          startScreen: null,
          currentScreen: null,
          previewBounds: null,
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gesture.isDragging]);
  
  // Don't render if not a creation tool
  if (!isCreationTool(activeTool)) {
    return null;
  }
  
  // Don't render for image tool if no image is pending
  if (activeTool === 'image' && !pendingImageUrl) {
    return null;
  }
  
  // Calculate preview rect in screen coordinates
  let previewStyle: React.CSSProperties | null = null;
  if (gesture.isDragging && gesture.previewBounds) {
    const viewport = getViewport();
    const { x, y, width, height } = gesture.previewBounds;
    
    // Convert world bounds back to screen for preview
    const screenX = x * viewport.zoom + viewport.offsetX;
    const screenY = y * viewport.zoom + viewport.offsetY;
    const screenWidth = width * viewport.zoom;
    const screenHeight = height * viewport.zoom;
    
    previewStyle = {
      position: 'absolute',
      left: screenX,
      top: screenY,
      width: screenWidth,
      height: screenHeight,
      border: '2px dashed #6965db',
      backgroundColor: 'rgba(105, 101, 219, 0.1)',
      pointerEvents: 'none',
      borderRadius: activeTool === 'circle' ? '50%' : '4px',
    };
  }
  
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: creationCompleted ? 'default' : 'crosshair',
        zIndex: 30, // Above proxy-layer (zIndex: 20) to receive pointer events
        // Disable pointer events immediately after creation to prevent conflicts
        pointerEvents: creationCompleted ? 'none' : 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      // Allow drag-and-drop from component library to pass through
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        // Forward to parent handler for component library drops
        onExternalDrop?.(e);
      }}
    >
      {/* Preview rectangle during drag */}
      {previewStyle && <div style={previewStyle} />}
    </div>
  );
}
