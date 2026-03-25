/**
 * Image Upload Service
 *
 * Provides unified image upload interface that switches between:
 * - Local storage: IndexedDB with Blob objects (returns object URL)
 * - OSS storage: Cloud storage (returns CDN URL)
 */

import { createStore, get, set, del } from 'idb-keyval';

// Create custom store for images
const imageStore = createStore('thingsvis-images', 'images');

export type ImageStorageType = 'local' | 'oss';

export interface OSSConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  region?: string;
}

export interface ImageUploadSettings {
  storageType: ImageStorageType;
  ossConfig?: OSSConfig;
}

const SETTINGS_KEY = 'thingsvis:imageUploadSettings';

const defaultSettings: ImageUploadSettings = {
  storageType: 'local',
};

/**
 * Get current image upload settings
 */
export function getImageUploadSettings(): ImageUploadSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return defaultSettings;
}

/**
 * Save image upload settings
 */
export function saveImageUploadSettings(settings: ImageUploadSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    throw error;
  }
}

/**
 * Upload image with current settings
 * Returns URL: object URL for local storage, CDN URL for OSS
 */
export async function uploadImage(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('upload.onlyImages');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('upload.sizeLimit');
  }

  const settings = getImageUploadSettings();

  if (settings.storageType === 'local') {
    // Store in IndexedDB and return object URL
    return uploadToLocal(file);
  } else if (settings.storageType === 'oss' && settings.ossConfig) {
    // Upload to OSS (Aliyun OSS or S3-compatible)
    return uploadToOSS(file, settings.ossConfig);
  }

  throw new Error('Invalid storage configuration');
}

/**
 * Upload to local IndexedDB storage
 * Returns an object URL that can be used in img src
 */
async function uploadToLocal(file: File): Promise<string> {
  try {
    // Generate unique ID for the image
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the file blob in IndexedDB
    await set(id, file, imageStore);

    // Create object URL for immediate use
    const objectURL = URL.createObjectURL(file);

    // Store ID in the URL as a data attribute (for later retrieval)
    // We'll use a custom format: blob:...#id
    return `${objectURL}#${id}`;
  } catch (error) {
    throw new Error('本地存储失败');
  }
}

/**
 * Load image from local storage by ID
 * Returns a new object URL
 */
export async function loadLocalImage(id: string): Promise<string | null> {
  try {
    const file = await get<File>(id, imageStore);
    if (!file) return null;
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

/**
 * Delete image from local storage
 */
export async function deleteLocalImage(id: string): Promise<void> {
  try {
    await del(id, imageStore);
  } catch {}
}

/**
 * Revoke object URL to free memory
 * Should be called when image is no longer needed
 */
export function revokeImageURL(url: string): void {
  if (url.startsWith('blob:')) {
    const pureURL = url.split('#')[0] ?? url;
    URL.revokeObjectURL(pureURL);
  }
}

/**
 * Upload to OSS
 */
async function uploadToOSS(file: File, config: OSSConfig): Promise<string> {
  // This is a placeholder - actual implementation would depend on the OSS provider
  // For Aliyun OSS, you would use ali-oss SDK
  // For AWS S3, you would use aws-sdk

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Generate a unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop() || 'png';
    const filename = `thingsvis/${timestamp}-${randomStr}.${ext}`;

    // Note: In production, you would typically upload through a backend proxy
    // to avoid exposing credentials in the frontend
    const response = await fetch(`${config.endpoint}/${config.bucket}/${filename}`, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        // Add OSS-specific headers here
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload to OSS');
    }

    return `${config.endpoint}/${config.bucket}/${filename}`;
  } catch (error) {
    throw error;
  }
}
