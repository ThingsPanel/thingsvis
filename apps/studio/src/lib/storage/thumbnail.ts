/**
 * Thumbnail Generation Utility
 *
 * Generates thumbnails from canvas/visualization content for recent projects list.
 * Uses HTML5 Canvas API to capture and scale down the visualization.
 */

import { STORAGE_CONSTANTS } from './constants';
import { toJpeg } from 'html-to-image';

// =============================================================================
// Types
// =============================================================================

export interface ThumbnailOptions {
  /** Target width (default: 128) */
  width?: number;
  /** Target height (default: 72) */
  height?: number;
  /** JPEG quality 0-1 (default: 0.7) */
  quality?: number;
  /** Background color (default: #ffffff) */
  backgroundColor?: string;
}

// =============================================================================
// Thumbnail Generation
// =============================================================================

/**
 * Generate thumbnail from an HTML element (typically the canvas container).
 * Uses html2canvas-like approach to capture the element.
 *
 * @param element - The HTML element to capture
 * @param options - Thumbnail generation options
 * @returns Base64 encoded JPEG thumbnail string
 */
export async function generateThumbnailFromElement(
  element: HTMLElement,
  options: ThumbnailOptions = {},
): Promise<string> {
  const {
    width = STORAGE_CONSTANTS.THUMBNAIL_WIDTH,
    height = STORAGE_CONSTANTS.THUMBNAIL_HEIGHT,
    quality = 0.7,
    backgroundColor = '#ffffff',
  } = options;

  try {
    const rect = element.getBoundingClientRect();
    const sourceWidth = Math.max(element.scrollWidth, Math.ceil(rect.width), 1);
    const sourceHeight = Math.max(element.scrollHeight, Math.ceil(rect.height), 1);
    const captureOptions = {
      backgroundColor,
      width: sourceWidth,
      height: sourceHeight,
      pixelRatio: 1,
      cacheBust: true,
      // Cross-origin/widget font faces can make the generated SVG fail to load.
      // Text still renders with the browser fallback font, which is preferable to
      // falling back to the generic document placeholder.
      skipFonts: true,
      style: {
        overflow: 'hidden',
        transform: 'none',
        transformOrigin: 'top left',
      },
    };

    let rawThumbnail: string;
    try {
      // Keep the complete dashboard whenever the browser can serialize it.
      rawThumbnail = await toJpeg(element, captureOptions);
    } catch {
      // Some dashboards contain native controls that make the generated SVG
      // fail to load. They are not useful in a small cover image, so retry
      // without them before falling back to the generic placeholder.
      rawThumbnail = await toJpeg(element, {
        ...captureOptions,
        filter: (node) => !['SELECT', 'INPUT', 'TEXTAREA', 'BUTTON'].includes(node.nodeName),
      });
    }

    const sourceImage = await loadImage(rawThumbnail);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    drawScaledImage(ctx, sourceImage, width, height);
    return encodeThumbnail(canvas, quality);
  } catch (error) {
    const details =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : `type=${error?.constructor?.name || 'unknown'} event=${error instanceof Event ? error.type : 'n/a'}`;
    console.warn(`[Thumbnail] Failed to capture element, using placeholder: ${details}`);
    return generatePlaceholderThumbnail(options);
  }
}

/**
 * Generate thumbnail from an existing canvas element.
 *
 * @param sourceCanvas - The canvas element to capture
 * @param options - Thumbnail generation options
 * @returns Base64 encoded JPEG thumbnail string
 */
export function generateThumbnailFromCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: ThumbnailOptions = {},
): string {
  const {
    width = STORAGE_CONSTANTS.THUMBNAIL_WIDTH,
    height = STORAGE_CONSTANTS.THUMBNAIL_HEIGHT,
    quality = 0.7,
    backgroundColor = '#ffffff',
  } = options;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw scaled source canvas
    drawScaledImage(ctx, sourceCanvas, width, height);

    return encodeThumbnail(canvas, quality);
  } catch {
    return generatePlaceholderThumbnail(options);
  }
}

/**
 * Generate a placeholder thumbnail (empty canvas with project icon).
 * Used when actual capture fails or for new projects.
 *
 * @param options - Thumbnail generation options
 * @returns Base64 encoded JPEG placeholder thumbnail
 */
export function generatePlaceholderThumbnail(options: ThumbnailOptions = {}): string {
  const {
    width = STORAGE_CONSTANTS.THUMBNAIL_WIDTH,
    height = STORAGE_CONSTANTS.THUMBNAIL_HEIGHT,
    backgroundColor = '#f3f4f6',
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Return a minimal valid data URL if we can't even create a context
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAyAFADASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABQYDBAcCAQj/xAA=';
  }

  // Fill background with light gray
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw a simple document icon in the center
  const iconSize = Math.min(width, height) * 0.4;
  const iconX = (width - iconSize) / 2;
  const iconY = (height - iconSize) / 2;

  ctx.fillStyle = '#9ca3af';
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;

  // Document shape
  ctx.beginPath();
  ctx.moveTo(iconX, iconY);
  ctx.lineTo(iconX + iconSize * 0.7, iconY);
  ctx.lineTo(iconX + iconSize, iconY + iconSize * 0.3);
  ctx.lineTo(iconX + iconSize, iconY + iconSize);
  ctx.lineTo(iconX, iconY + iconSize);
  ctx.closePath();
  ctx.fill();

  // Fold corner
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.moveTo(iconX + iconSize * 0.7, iconY);
  ctx.lineTo(iconX + iconSize * 0.7, iconY + iconSize * 0.3);
  ctx.lineTo(iconX + iconSize, iconY + iconSize * 0.3);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.7);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Load an image from a URL.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(src); // Clean up blob URL
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error('Failed to load image'));
    };
    img.src = src;
  });
}

/**
 * Draw an image or canvas scaled to fit within the target dimensions,
 * maintaining aspect ratio and centering.
 */
function drawScaledImage(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
): void {
  const sourceWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const sourceHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  // Calculate scale to fit while maintaining aspect ratio
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);

  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;

  // Center the image
  const x = (targetWidth - scaledWidth) / 2;
  const y = (targetHeight - scaledHeight) / 2;

  ctx.drawImage(source, x, y, scaledWidth, scaledHeight);
}

/** Encode a thumbnail without allowing the base64 payload to grow unbounded. */
function encodeThumbnail(canvas: HTMLCanvasElement, initialQuality: number): string {
  let quality = Math.min(Math.max(initialQuality, 0.1), 0.95);
  let result = canvas.toDataURL('image/jpeg', quality);

  while (result.length > STORAGE_CONSTANTS.MAX_THUMBNAIL_SIZE && quality > 0.2) {
    quality = Math.max(0.2, quality - 0.1);
    result = canvas.toDataURL('image/jpeg', quality);
  }

  return result;
}

/**
 * Validate that a thumbnail string is within size limits.
 */
export function validateThumbnailSize(thumbnail: string): boolean {
  return thumbnail.length <= STORAGE_CONSTANTS.MAX_THUMBNAIL_SIZE;
}

/**
 * Compress a thumbnail if it exceeds size limits.
 * Reduces quality until it fits.
 */
export function compressThumbnail(
  sourceCanvas: HTMLCanvasElement,
  maxSize: number = STORAGE_CONSTANTS.MAX_THUMBNAIL_SIZE,
): string {
  let quality = 0.9;
  let result = sourceCanvas.toDataURL('image/jpeg', quality);

  while (result.length > maxSize && quality > 0.1) {
    quality -= 0.1;
    result = sourceCanvas.toDataURL('image/jpeg', quality);
  }

  return result;
}

/**
 * Process a user-uploaded file for use as a thumbnail.
 * Resizes and compresses the image.
 *
 * @param file - The uploaded file
 * @returns Compressed base64 thumbnail string
 */
export async function processThumbnailFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);

    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    const width = STORAGE_CONSTANTS.THUMBNAIL_WIDTH;
    const height = STORAGE_CONSTANTS.THUMBNAIL_HEIGHT;

    // Set explicit size
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Fill white background (for transparent PNGs)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw scaled image (fit within bounds)
    drawScaledImage(ctx, img, width, height);

    // return compressed jpeg
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Thumbnail processing failed:', error);
    // Fallback? Retrun original as base64? No, might be too big.
    throw error;
  }
}
