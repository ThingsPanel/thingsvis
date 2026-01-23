/**
 * Thumbnail Generation Utility
 * 
 * Generates thumbnails from canvas/visualization content for recent projects list.
 * Uses HTML5 Canvas API to capture and scale down the visualization.
 */

import { STORAGE_CONSTANTS } from './constants'

// =============================================================================
// Types
// =============================================================================

export interface ThumbnailOptions {
  /** Target width (default: 128) */
  width?: number
  /** Target height (default: 72) */
  height?: number
  /** JPEG quality 0-1 (default: 0.7) */
  quality?: number
  /** Background color (default: #ffffff) */
  backgroundColor?: string
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
  options: ThumbnailOptions = {}
): Promise<string> {
  const {
    width = STORAGE_CONSTANTS.THUMBNAIL_WIDTH,
    height = STORAGE_CONSTANTS.THUMBNAIL_HEIGHT,
    quality = 0.7,
    backgroundColor = '#ffffff',
  } = options

  try {
    // Create a canvas for the thumbnail
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Try to capture SVG content if present (for visualization elements)
    const svgElement = element.querySelector('svg')
    if (svgElement) {
      const svgData = await renderSvgToDataUrl(svgElement)
      if (svgData) {
        const img = await loadImage(svgData)
        drawScaledImage(ctx, img, width, height)
        return canvas.toDataURL('image/jpeg', quality)
      }
    }

    // Try to capture canvas content if present
    const canvasElement = element.querySelector('canvas')
    if (canvasElement) {
      drawScaledImage(ctx, canvasElement, width, height)
      return canvas.toDataURL('image/jpeg', quality)
    }

    // Fallback: use a placeholder or the element's background
    return canvas.toDataURL('image/jpeg', quality)
  } catch (error) {
    
    return generatePlaceholderThumbnail(options)
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
  options: ThumbnailOptions = {}
): string {
  const {
    width = STORAGE_CONSTANTS.THUMBNAIL_WIDTH,
    height = STORAGE_CONSTANTS.THUMBNAIL_HEIGHT,
    quality = 0.7,
    backgroundColor = '#ffffff',
  } = options

  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw scaled source canvas
    drawScaledImage(ctx, sourceCanvas, width, height)

    return canvas.toDataURL('image/jpeg', quality)
  } catch (error) {
    
    return generatePlaceholderThumbnail(options)
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
  } = options

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    // Return a minimal valid data URL if we can't even create a context
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAyAFADASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABQYDBAcCAQj/xAA='
  }

  // Fill background with light gray
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)

  // Draw a simple document icon in the center
  const iconSize = Math.min(width, height) * 0.4
  const iconX = (width - iconSize) / 2
  const iconY = (height - iconSize) / 2

  ctx.fillStyle = '#9ca3af'
  ctx.strokeStyle = '#9ca3af'
  ctx.lineWidth = 2

  // Document shape
  ctx.beginPath()
  ctx.moveTo(iconX, iconY)
  ctx.lineTo(iconX + iconSize * 0.7, iconY)
  ctx.lineTo(iconX + iconSize, iconY + iconSize * 0.3)
  ctx.lineTo(iconX + iconSize, iconY + iconSize)
  ctx.lineTo(iconX, iconY + iconSize)
  ctx.closePath()
  ctx.fill()

  // Fold corner
  ctx.fillStyle = '#6b7280'
  ctx.beginPath()
  ctx.moveTo(iconX + iconSize * 0.7, iconY)
  ctx.lineTo(iconX + iconSize * 0.7, iconY + iconSize * 0.3)
  ctx.lineTo(iconX + iconSize, iconY + iconSize * 0.3)
  ctx.closePath()
  ctx.fill()

  return canvas.toDataURL('image/jpeg', 0.7)
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Render an SVG element to a data URL.
 */
async function renderSvgToDataUrl(svgElement: SVGElement): Promise<string | null> {
  try {
    const svgString = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    return URL.createObjectURL(blob)
  } catch (error) {
    
    return null
  }
}

/**
 * Load an image from a URL.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(src) // Clean up blob URL
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(src)
      reject(new Error('Failed to load image'))
    }
    img.src = src
  })
}

/**
 * Draw an image or canvas scaled to fit within the target dimensions,
 * maintaining aspect ratio and centering.
 */
function drawScaledImage(
  ctx: CanvasRenderingContext2D,
  source: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): void {
  const sourceWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const sourceHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height

  // Calculate scale to fit while maintaining aspect ratio
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  
  const scaledWidth = sourceWidth * scale
  const scaledHeight = sourceHeight * scale
  
  // Center the image
  const x = (targetWidth - scaledWidth) / 2
  const y = (targetHeight - scaledHeight) / 2

  ctx.drawImage(source, x, y, scaledWidth, scaledHeight)
}

/**
 * Validate that a thumbnail string is within size limits.
 */
export function validateThumbnailSize(thumbnail: string): boolean {
  return thumbnail.length <= STORAGE_CONSTANTS.MAX_THUMBNAIL_SIZE
}

/**
 * Compress a thumbnail if it exceeds size limits.
 * Reduces quality until it fits.
 */
export function compressThumbnail(
  sourceCanvas: HTMLCanvasElement,
  maxSize: number = STORAGE_CONSTANTS.MAX_THUMBNAIL_SIZE
): string {
  let quality = 0.9
  let result = sourceCanvas.toDataURL('image/jpeg', quality)

  while (result.length > maxSize && quality > 0.1) {
    quality -= 0.1
    result = sourceCanvas.toDataURL('image/jpeg', quality)
  }

  return result
}
