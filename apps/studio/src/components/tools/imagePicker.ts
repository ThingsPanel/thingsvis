/**
 * Image Picker Utility
 * 
 * Utilities for selecting and converting images for the image tool
 */

export type ImagePickerResult = {
  dataUrl: string;
  mimeType: string;
  name: string;
  width: number;
  height: number;
};

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
 * Convert a file to a data URL
 * 
 * @param file - The image file to convert
 * @returns Promise resolving to the data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from a data URL
 * 
 * @param dataUrl - The image data URL
 * @returns Promise resolving to width and height
 */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * Pick an image and convert it to a full result with data URL and dimensions
 * 
 * @returns Promise resolving to the image result, or null if canceled/error
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
  
  const dataUrl = await fileToDataUrl(file);
  const dimensions = await getImageDimensions(dataUrl);
  
  return {
    dataUrl,
    mimeType: file.type,
    name: file.name,
    ...dimensions,
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
