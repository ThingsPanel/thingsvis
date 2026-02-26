/**
 * ImageUploader Component
 * 
 * Example component showing how to use the image upload service.
 * 
 * Usage:
 * ```tsx
 * <ImageUploader onUpload={(url) => console.log('Image URL:', url)} />
 * ```
 */

import React, { useState } from 'react';
import { uploadImage, revokeImageURL } from '@/lib/imageUpload';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  /** Callback when image is successfully uploaded */
  onUpload?: (url: string) => void;
  /** Initial image URL */
  initialUrl?: string;
  /** Allow removing the image */
  allowRemove?: boolean;
  /** Max width for preview */
  maxWidth?: number;
  /** Max height for preview */
  maxHeight?: number;
}

export function ImageUploader({
  onUpload,
  initialUrl,
  allowRemove = true,
  maxWidth = 300,
  maxHeight = 300,
}: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      onUpload?.(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload.failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (imageUrl) {
      // Revoke object URL to free memory
      revokeImageURL(imageUrl);
      setImageUrl(null);
      onUpload?.('');
    }
  };

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative inline-block">
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{ maxWidth, maxHeight }}
            className="rounded-lg border border-gray-200"
          />
          {allowRemove && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">
              {isUploading ? 'upload.uploading' : 'upload.clickToUpload'}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

/**
 * Example usage in a component:
 * 
 * ```tsx
 * import { ImageUploader } from '@/components/ImageUploader';
 * 
 * function MyComponent() {
 *   const [imageUrl, setImageUrl] = useState<string>('');
 * 
 *   return (
 *     <div>
 *       <h3>上传图片</h3>
 *       <ImageUploader 
 *         onUpload={setImageUrl}
 *         allowRemove={true}
 *       />
 *       <p>图片URL: {imageUrl}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * The component will:
 * 1. Use local storage (IndexedDB + Object URL) by default
 * 2. Switch to OSS if configured in settings
 * 3. Return a URL that can be used directly in <img> tags
 * 4. For local storage: blob:http://... URLs
 * 5. For OSS: https://... CDN URLs
 */
