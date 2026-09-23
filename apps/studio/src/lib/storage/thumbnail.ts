/**
 * Thumbnail Generation Utility
 *
 * Generates thumbnails from canvas/visualization content for recent projects list.
 * Uses HTML5 Canvas API to capture and scale down the visualization.
 */

import { STORAGE_CONSTANTS } from './constants';
import html2canvas from 'html2canvas';
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

/**
 * Resolve the background used by the rendered artboard instead of the editor
 * workspace. Theme backgrounds are often painted by a dedicated aria-hidden
 * layer while the canvas root itself remains transparent.
 */
export function resolveThumbnailBackgroundColor(
  element: HTMLElement,
  fallback = '#ffffff',
): string {
  try {
    const backgroundLayer = element.querySelector<HTMLElement>('[aria-hidden="true"]');
    const candidates = backgroundLayer ? [backgroundLayer, element] : [element];

    for (const candidate of candidates) {
      const style = window.getComputedStyle(candidate);
      if (isOpaqueColor(style.backgroundColor)) {
        return style.backgroundColor;
      }

      const themeBackground = style.getPropertyValue('--w-bg').trim();
      if (themeBackground && isOpaqueColor(themeBackground)) {
        return themeBackground;
      }

      const canvasBackground = style.getPropertyValue('--w-canvas-bg').trim();
      if (canvasBackground) {
        return `hsl(${canvasBackground})`;
      }
    }
  } catch {
    // Use the safe fallback when the DOM is unavailable during teardown.
  }

  return fallback;
}

function isOpaqueColor(value: string): boolean {
  const normalized = value.replace(/\s+/g, '').toLowerCase();
  if (!normalized || normalized === 'transparent' || normalized === 'rgba(0,0,0,0)') {
    return false;
  }

  const alphaMatch = normalized.match(/^rgba\([^,]+,[^,]+,[^,]+,([^)]*)\)$/);
  return !alphaMatch || Number.parseFloat(alphaMatch[1]) > 0;
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
  const restoreCaptureStyles = prepareThumbnailCaptureStyles(element);

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
        overflow: 'visible',
        transform: 'none',
        transformOrigin: 'top left',
      },
    };

    let rawThumbnail: string | undefined;
    try {
      // Keep the complete dashboard whenever the browser can serialize it.
      rawThumbnail = await toJpeg(element, captureOptions);
    } catch {
      // Some dashboards contain native controls or cross-origin resources that make
      // the generated SVG fail to load. DOM rendering is more tolerant of complex
      // widget trees, so use it as the fallback after excluding unsupported nodes.
      const fallbackCanvas = await captureWithDomRenderer(element, {
        backgroundColor,
        width: sourceWidth,
        height: sourceHeight,
        windowWidth: sourceWidth,
        windowHeight: sourceHeight,
        scale: 1,
        useCORS: false,
        allowTaint: false,
        imageTimeout: 1500,
        logging: false,
        ignoreElements: (node) => shouldSkipThumbnailNode(node as HTMLElement),
      });

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      drawScaledImage(ctx, fallbackCanvas, width, height);
      return encodeThumbnail(canvas, quality);
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
  } finally {
    restoreCaptureStyles();
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

const NATIVE_CONTROL_TAGS = new Set([
  'SELECT',
  'INPUT',
  'TEXTAREA',
  'BUTTON',
  'VIDEO',
  'VIDEO-RTC',
  'STYLE',
]);

/**
 * Exclude content that html-to-image cannot reliably inline into its SVG snapshot.
 *
 * The editor can contain third-party images loaded from object-storage domains. A
 * single image without CORS support can make the complete thumbnail fail. The retry
 * keeps same-origin assets and removes only the unsupported node, so the rest of the
 * dashboard remains visible in the cover image.
 */
function shouldSkipThumbnailNode(node: HTMLElement): boolean {
  if (NATIVE_CONTROL_TAGS.has(node.nodeName)) {
    return true;
  }

  const resourceUrl =
    node.getAttribute('src') || node.getAttribute('href') || node.getAttribute('xlink:href');

  if (resourceUrl && isCrossOriginResource(resourceUrl)) {
    return true;
  }

  try {
    const style = window.getComputedStyle(node);
    return [style.backgroundImage, style.maskImage, style.webkitMaskImage].some((value) =>
      hasCrossOriginUrl(value),
    );
  } catch {
    return false;
  }
}

function hasCrossOriginUrl(value: string): boolean {
  const urls = value.match(/url\(\s*["']?([^"')]+)["']?\s*\)/gi) || [];
  return urls.some((url) => {
    const match = url.match(/url\(\s*["']?([^"')]+)["']?\s*\)/i);
    return Boolean(match?.[1] && isCrossOriginResource(match[1]));
  });
}

function isCrossOriginResource(value: string): boolean {
  if (/^(data|blob):/i.test(value)) {
    return false;
  }

  try {
    const url = new URL(value, window.location.href);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.origin !== window.location.origin
    );
  } catch {
    return false;
  }
}

const CSS_COLOR_FUNCTION_RE =
  /color\(\s*srgb\s+([+-]?(?:\d*\.?)\d+)\s+([+-]?(?:\d*\.?)\d+)\s+([+-]?(?:\d*\.?)\d+)(?:\s*\/\s*([^)]*))?\s*\)/gi;

/**
 * Chromium serializes some ordinary CSS colors as CSS Color 4 `color(srgb ...)`
 * values. The thumbnail renderers used here do not understand that syntax, so
 * normalize it only for the duration of capture and restore the editor styles.
 */
function prepareThumbnailCaptureStyles(element: HTMLElement): () => void {
  const restores: Array<() => void> = [];
  const candidates = [element, ...Array.from(element.querySelectorAll<HTMLElement>('*'))];

  for (const candidate of candidates) {
    let computed: CSSStyleDeclaration;
    try {
      computed = window.getComputedStyle(candidate);
    } catch {
      continue;
    }

    for (let index = 0; index < computed.length; index += 1) {
      const property = computed[index];
      const value = computed.getPropertyValue(property);
      if (!value || !/color\(/i.test(value)) continue;

      const normalizedValue = normalizeCssColorFunctions(value);
      if (normalizedValue === value || /color\(/i.test(normalizedValue)) continue;

      const previousValue = candidate.style.getPropertyValue(property);
      const previousPriority = candidate.style.getPropertyPriority(property);
      candidate.style.setProperty(property, normalizedValue, 'important');
      restores.push(() => {
        if (previousValue) {
          candidate.style.setProperty(property, previousValue, previousPriority);
        } else {
          candidate.style.removeProperty(property);
        }
      });
    }
  }

  return () => {
    restores.reverse().forEach((restore) => restore());
  };
}

function normalizeCssColorFunctions(value: string): string {
  return value.replace(
    CSS_COLOR_FUNCTION_RE,
    (_match, red: string, green: string, blue: string, alpha?: string) => {
      const channels = [red, green, blue].map((channel) =>
        Math.round(Math.min(Math.max(Number.parseFloat(channel), 0), 1) * 255),
      );
      const normalizedAlpha = alpha?.trim().endsWith('%')
        ? Number.parseFloat(alpha) / 100
        : Number.parseFloat(alpha ?? '1');

      return `rgba(${channels.join(', ')}, ${Math.min(Math.max(normalizedAlpha, 0), 1)})`;
    },
  );
}

/** Render the artboard without the editor viewport's zoom transform. */
async function captureWithDomRenderer(
  element: HTMLElement,
  options: Parameters<typeof html2canvas>[1],
): Promise<HTMLCanvasElement> {
  const restores: Array<() => void> = [];
  let ancestor: HTMLElement | null = element.parentElement;

  while (ancestor && ancestor !== document.body) {
    const computedTransform = window.getComputedStyle(ancestor).transform;
    if (computedTransform !== 'none') {
      const transformedAncestor = ancestor;
      const previousTransform = transformedAncestor.style.transform;
      transformedAncestor.style.transform = 'none';
      restores.push(() => {
        transformedAncestor.style.transform = previousTransform;
      });
    }
    ancestor = ancestor.parentElement;
  }

  try {
    return await html2canvas(element, options);
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
}

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
