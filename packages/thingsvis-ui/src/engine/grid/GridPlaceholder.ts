import { Rect, Group } from 'leafer-ui';
import type { GridSettings, GridPosition } from '@thingsvis/schema';
import { gridToPixel, calculateColWidth } from '../../utils/grid-mapper';

/**
 * GridPlaceholder - Renders drag/resize placeholder for grid layout
 * 
 * Shows a semi-transparent rectangle indicating where a component will land
 * during drag or resize operations.
 */
export interface GridPlaceholderOptions {
  /** Grid settings */
  settings: GridSettings;
  /** Container width in pixels */
  containerWidth: number;
  /** Current grid position */
  position: GridPosition;
  /** Whether the placeholder is active */
  active?: boolean;
  /** Placeholder fill color (default: rgba(0, 120, 212, 0.3)) */
  fillColor?: string;
  /** Placeholder stroke color (default: rgba(0, 120, 212, 0.8)) */
  strokeColor?: string;
  /** Stroke width (default: 2) */
  strokeWidth?: number;
  /** Animation duration in ms (default: 200) */
  animationDuration?: number;
}

/**
 * Creates a Leafer Rect for the grid placeholder
 * 
 * @param options - Placeholder configuration
 * @returns Leafer Rect element
 */
export function createGridPlaceholder(options: GridPlaceholderOptions): Rect {
  const {
    settings,
    containerWidth,
    position,
    active = true,
    fillColor = 'rgba(0, 120, 212, 0.3)',
    strokeColor = 'rgba(0, 120, 212, 0.8)',
    strokeWidth = 2,
  } = options;
  
  const pixelRect = gridToPixel(position, settings, containerWidth);
  
  const rect = new Rect({
    x: pixelRect.x,
    y: pixelRect.y,
    width: pixelRect.width,
    height: pixelRect.height,
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth,
    cornerRadius: 4,
    opacity: active ? 1 : 0,
  });
  
  return rect;
}

/**
 * Ghost overlay configuration for affected items
 */
export interface GhostOverlayOptions {
  /** Grid settings */
  settings: GridSettings;
  /** Container width in pixels */
  containerWidth: number;
  /** Positions of affected items */
  positions: Array<{ id: string; position: GridPosition }>;
  /** Ghost fill color (default: rgba(128, 128, 128, 0.2)) */
  fillColor?: string;
  /** Ghost stroke color (default: rgba(128, 128, 128, 0.5)) */
  strokeColor?: string;
}

/**
 * Creates ghost overlays for affected items during drag
 * 
 * @param options - Ghost overlay configuration
 * @returns Leafer Group containing ghost rectangles
 */
export function createGhostOverlays(options: GhostOverlayOptions): Group {
  const {
    settings,
    containerWidth,
    positions,
    fillColor = 'rgba(128, 128, 128, 0.2)',
    strokeColor = 'rgba(128, 128, 128, 0.5)',
  } = options;
  
  const group = new Group();
  
  for (const { position } of positions) {
    const pixelRect = gridToPixel(position, settings, containerWidth);
    
    const rect = new Rect({
      x: pixelRect.x,
      y: pixelRect.y,
      width: pixelRect.width,
      height: pixelRect.height,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: 1,
      cornerRadius: 4,
      dashPattern: [4, 4],
    });
    
    group.add(rect);
  }
  
  return group;
}

/**
 * GridPlaceholder class for object-oriented usage
 */
export class GridPlaceholder {
  private group: Group;
  private rect: Rect;
  private ghostGroup: Group;
  private options: GridPlaceholderOptions | null = null;
  
  constructor(options?: GridPlaceholderOptions) {
    this.group = new Group();
    this.ghostGroup = new Group();
    
    // Create placeholder rect with default styling
    this.rect = new Rect({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      fill: 'rgba(0, 120, 212, 0.3)',
      stroke: 'rgba(0, 120, 212, 0.8)',
      strokeWidth: 2,
      cornerRadius: 4,
      opacity: 0,
    });
    
    this.group.add(this.rect);
    this.group.add(this.ghostGroup);
    
    if (options) {
      this.options = options;
      this.updatePosition(options.position, false);
      if (options.active) {
        this.show();
      }
    }
  }
  
  /**
   * Get the Leafer Group containing placeholder and ghosts
   */
  getGroup(): Group {
    return this.group;
  }
  
  /**
   * Get the Leafer Rect element
   */
  getRect(): Rect {
    return this.rect;
  }
  
  /**
   * Get the ghost overlays group
   */
  getGhostGroup(): Group {
    return this.ghostGroup;
  }
  
  /**
   * Update the placeholder position with animation
   * @param position - Pixel rect { x, y, width, height }
   * @param animate - Whether to animate the transition
   */
  updatePosition(position: { x: number; y: number; width: number; height: number }, animate: boolean = true): void {
    if (animate) {
      // Animate to new position (200-300ms ease-out)
      this.rect.set({
        animation: {
          style: {
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
          },
          duration: 0.2,
          easing: 'ease-out',
        },
      });
    } else {
      this.rect.set({
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      });
    }
  }
  
  /**
   * Update ghost overlays for affected items
   * @param rects - Array of pixel rects for ghost overlays
   */
  updateGhosts(rects: Array<{ x: number; y: number; width: number; height: number }>): void {
    this.ghostGroup.removeAll();
    
    for (const rect of rects) {
      const ghostRect = new Rect({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        fill: 'rgba(128, 128, 128, 0.2)',
        stroke: 'rgba(128, 128, 128, 0.5)',
        strokeWidth: 1,
        cornerRadius: 4,
        dashPattern: [4, 4],
      });
      this.ghostGroup.add(ghostRect);
    }
  }
  
  /**
   * Show the placeholder
   */
  show(): void {
    this.rect.set({ opacity: 1 });
  }
  
  /**
   * Hide the placeholder
   */
  hide(): void {
    this.rect.set({ opacity: 0 });
    this.ghostGroup.removeAll();
  }
  
  /**
   * Dispose of the placeholder
   */
  dispose(): void {
    this.ghostGroup.removeAll();
    this.group.removeAll();
  }
}
