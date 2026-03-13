/**
 * Image Picker Utility
 * 
 * Utilities for selecting and converting images for the image tool
 */

/** Maximum file size in bytes (2MB) */
const MAX_FILE_SIZE = 2 * 1024 * 1024;

/** Maximum dimension for resizing (width or height) */
const MAX_DIMENSION = 1200;

/** Maximum dataUrl length (about 500KB base64) */
const MAX_DATAURL_LENGTH = 700000;

export type ImagePickerResult = {
  /** Data URL for the image (base64) */
  dataUrl: string;
  mimeType: string;
  name: string;
  width: number;
  height: number;
};

export class ImageFileTooLargeError extends Error {
  constructor(fileSize: number) {
    super(`Image file is too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB. Maximum allowed size is 2MB.`);
    this.name = 'ImageFileTooLargeError';
  }
}

/**
 * Open file picker and select an image file
 * 
 * @returns Promise resolving to the selected file, or null if canceled
 */
export function openImagePicker(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      resolve(file);
    };
    
    input.oncancel = () => {
      resolve(null);
    };
    
    // Handle case where user closes the picker without selecting
    // Focus event fires after picker closes
    const handleFocus = () => {
      // Small delay to allow onchange to fire first
      setTimeout(() => {
        if (!input.files?.length) {
          resolve(null);
        }
        window.removeEventListener('focus', handleFocus);
      }, 300);
    };
    window.addEventListener('focus', handleFocus);
    
    input.click();
  });
}

/**
 * Resize image if it exceeds max dimensions
 * Returns a compressed data URL
 */
async function resizeAndCompressImage(
  file: File,
  maxDimension: number = MAX_DIMENSION
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      let { naturalWidth: width, naturalHeight: height } = img;
      
      // Check if resizing is needed
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // For PNG files, preserve transparency by not filling background
      // For other formats, we can use JPEG for better compression
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
      const hasTransparency = isPng || isGif;
      
      // Clear canvas (transparent background for PNG)
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to data URL with compression
      // Use PNG for images that may have transparency, JPEG for others
      const outputType = hasTransparency ? 'image/png' : 'image/jpeg';
      
      // Try progressively lower quality until dataUrl is small enough
      // Note: PNG doesn't support quality parameter, but we can try resizing
      let quality = 0.8;
      let dataUrl = canvas.toDataURL(outputType, quality);
      
      // For JPEG, try lower quality
      if (!hasTransparency) {
        while (dataUrl.length > MAX_DATAURL_LENGTH && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL(outputType, quality);
        }
      }
      
      // If still too large, resize further
      if (dataUrl.length > MAX_DATAURL_LENGTH) {
        const scale = 0.7;
        const newWidth = Math.round(width * scale);
        const newHeight = Math.round(height * scale);
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.clearRect(0, 0, newWidth, newHeight);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        dataUrl = canvas.toDataURL(outputType, hasTransparency ? undefined : 0.7);
        
        // For PNG that's still too large, try even smaller
        if (hasTransparency && dataUrl.length > MAX_DATAURL_LENGTH) {
          const scale2 = 0.5;
          const newWidth2 = Math.round(newWidth * scale2);
          const newHeight2 = Math.round(newHeight * scale2);
          canvas.width = newWidth2;
          canvas.height = newHeight2;
          ctx.clearRect(0, 0, newWidth2, newHeight2);
          ctx.drawImage(img, 0, 0, newWidth2, newHeight2);
          dataUrl = canvas.toDataURL(outputType);
          resolve({ dataUrl, width: newWidth2, height: newHeight2 });
          return;
        }
        
        resolve({ dataUrl, width: newWidth, height: newHeight });
        return;
      }
      
      resolve({ dataUrl, width, height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
}

/**
 * Get image dimensions from a URL
 */
export function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Pick an image, resize if needed, and return compressed data URL
 * 
 * @returns Promise resolving to the image result, or null if canceled
 * @throws ImageFileTooLargeError if file exceeds 2MB
 * @throws Error if file is not an image
 */
export async function pickImage(): Promise<ImagePickerResult | null> {
  const file = await openImagePicker();
  if (!file) {
    return null;
  }
  
  // Validate it's an image
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image');
  }
  
  // Validate file size (max 2MB)
  if (file.size > MAX_FILE_SIZE) {
    throw new ImageFileTooLargeError(file.size);
  }
  
  // Resize and compress the image
  const { dataUrl, width, height } = await resizeAndCompressImage(file);
  
  return {
    dataUrl,
    mimeType: file.type,
    name: file.name,
    width,
    height,
  };
}

/**
 * Calculate default size for image preserving aspect ratio within a bounding box
 * 
 * @param imageWidth - Original image width
 * @param imageHeight - Original image height
 * @param maxWidth - Maximum width (default 240)
 * @param maxHeight - Maximum height (default 240)
 * @returns Size that fits within bounds while preserving aspect ratio
 */
export function calculateImageSize(
  imageWidth: number,
  imageHeight: number,
  maxWidth = 240,
  maxHeight = 240
): { width: number; height: number } {
  if (imageWidth <= maxWidth && imageHeight <= maxHeight) {
    return { width: imageWidth, height: imageHeight };
  }
  
  const widthRatio = maxWidth / imageWidth;
  const heightRatio = maxHeight / imageHeight;
  const ratio = Math.min(widthRatio, heightRatio);
  
  return {
    width: Math.round(imageWidth * ratio),
    height: Math.round(imageHeight * ratio),
  };
}
