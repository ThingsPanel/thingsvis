import { apiClient } from './client';

/**
 * Upload API endpoints
 *
 * Handles file uploads for images and other assets.
 */

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImportRemoteAssetResponse {
  url: string;
  filename: string;
  size: number;
  type: string | null;
  sourceUrl: string;
  importedAt: string;
}

/**
 * Upload a file to the server.
 *
 * @param file - File to upload
 * @param onProgress - Optional progress callback
 * @returns Upload result with file URL
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ data?: UploadResponse; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  // Prioritize primary auth provider's token, fallback to local standalone token
  const token = apiClient.getAccessToken();

  try {
    const xhr = new XMLHttpRequest();

    return new Promise((resolve) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url && data.url.startsWith('/')) {
              data.url = apiClient.resolveAssetUrl(data.url);
            }
            resolve({ data });
          } catch {
            resolve({ error: 'Invalid response' });
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            resolve({ error: error.error || 'Upload failed' });
          } catch {
            resolve({ error: 'Upload failed' });
          }
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ error: 'Network error' });
      });

      xhr.open('POST', apiClient.getRequestUrl('/uploads'));
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  } catch {
    return { error: 'Upload failed' };
  }
}

/**
 * Upload multiple files.
 *
 * @param files - Files to upload
 * @param onProgress - Optional progress callback
 * @returns Array of upload results
 */
export async function uploadFiles(
  files: File[],
  onProgress?: (index: number, progress: UploadProgress) => void,
): Promise<Array<{ data?: UploadResponse; error?: string }>> {
  const results: Array<{ data?: UploadResponse; error?: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) continue;
    const result = await uploadFile(file, (progress) => {
      onProgress?.(i, progress);
    });
    results.push(result);
  }

  return results;
}

/**
 * Convert a data URL to a File object.
 *
 * @param dataUrl - Data URL to convert
 * @param filename - Filename for the file
 * @returns File object
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0]?.match(/:(.*?);/);
  const mime = mimeMatch?.[1] || 'image/png';
  const base64Data = arr[1] || '';
  const bstr = atob(base64Data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Upload an image from a data URL.
 *
 * @param dataUrl - Data URL of the image
 * @param filename - Optional filename
 * @returns Upload result
 */
export async function uploadDataUrl(
  dataUrl: string,
  filename = 'image.png',
): Promise<{ data?: UploadResponse; error?: string }> {
  const file = dataUrlToFile(dataUrl, filename);
  return uploadFile(file);
}

export async function importRemoteAsset(
  url: string,
): Promise<{ data?: ImportRemoteAssetResponse; error?: string }> {
  const response = await apiClient.post<ImportRemoteAssetResponse>('/public/assets/import', {
    url,
  });

  if (response.error) {
    return { error: response.error };
  }

  if (!response.data) {
    return { error: 'Import failed' };
  }

  const data = { ...response.data };
  if (data.url.startsWith('/')) {
    data.url = apiClient.resolveAssetUrl(data.url);
  }

  return { data };
}
