/**
 * ImageSourceInput 组件
 *
 * 用于属性面板的图片输入控件，支持三种输入方式：
 * 1. 上传图片（登录后上传到服务器，未登录使用本地存储）
 * 2. 输入URL链接
 * 3. 输入Base64数据
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Link2, Code, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { uploadFile, dataUrlToFile } from '@/lib/api/uploads';

type InputMode = 'upload' | 'url' | 'base64';

interface ImageSourceInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ImageSourceInput({ value, onChange }: ImageSourceInputProps) {
  const { t } = useTranslation('editor');
  const [mode, setMode] = useState<InputMode>(() => {
    if (!value) return 'upload';
    if (value.startsWith('data:image')) return 'base64';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:'))
      return 'url';
    return 'upload';
  });

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState(value.startsWith('data:') ? '' : value);
  const [base64Input, setBase64Input] = useState(value.startsWith('data:') ? value : '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当 value 外部变化时同步
  useEffect(() => {
    if (value.startsWith('data:')) {
      setBase64Input(value);
    } else if (value) {
      setUrlInput(value);
    }
  }, [value]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError(t('upload.onlyImages', 'Only image files are supported'));
      return;
    }

    // 验证文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError(t('upload.sizeLimit', 'Image size cannot exceed 10MB'));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 统一使用后台 API 上传（不需要登录）
      const result = await uploadFile(file);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        onChange(result.data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('upload.failed', 'Upload failed'));
    } finally {
      setIsUploading(false);
      // 重置 file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onChange(url);
  };

  const handleBase64Change = (base64: string) => {
    setBase64Input(base64);
    // 验证 base64 格式
    if (base64 && !base64.startsWith('data:image')) {
      // 尝试添加前缀
      if (base64.match(/^[A-Za-z0-9+/=]+$/)) {
        onChange(`data:image/png;base64,${base64}`);
        return;
      }
    }
    onChange(base64);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setBase64Input('');
    setError(null);
  };

  const handleModeChange = (newMode: InputMode) => {
    setMode(newMode);
    setError(null);
  };

  return (
    <div className="space-y-2">
      {/* 模式切换 */}
      <div className="flex gap-1 p-1 bg-muted/20 border border-border rounded-lg w-full">
        <button
          type="button"
          onClick={() => handleModeChange('upload')}
          title={t('upload.button', 'Upload Image')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            mode === 'upload'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          {t('upload.action', 'Upload')}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('url')}
          title={t('upload.inputUrl', 'Enter URL')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            mode === 'url'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          {t('upload.url', 'URL')}
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('base64')}
          title={t('upload.inputBase64', 'Enter Base64')}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
            mode === 'base64'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Base64
        </button>
      </div>

      {/* 上传模式 */}
      {mode === 'upload' && (
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-input rounded-lg cursor-pointer hover:bg-accent/50 hover:border-accent-foreground/50 transition-all bg-muted/5 group">
            <div className="flex flex-col items-center justify-center py-2 text-center">
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mb-1.5 text-muted-foreground animate-spin" />
                  <p className="text-xs text-muted-foreground">
                    {t('upload.uploading', 'Uploading...')}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mb-1.5 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                  <p className="text-xs font-medium text-muted-foreground group-hover:text-accent-foreground transition-colors">
                    {t('upload.clickToUpload', 'Click to upload')}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {t('upload.uploadToServer', 'Upload to server (Max 10MB)')}
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </label>
        </div>
      )}

      {/* URL 模式 */}
      {mode === 'url' && (
        <Input
          value={urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="h-8 text-xs font-mono"
        />
      )}

      {/* Base64 模式 */}
      {mode === 'base64' && (
        <textarea
          value={base64Input}
          onChange={(e) => handleBase64Change(e.target.value)}
          placeholder={t('upload.base64Example', 'data:image/png;base64,... or Base64 string')}
          className="w-full h-20 p-2 text-[10px] font-mono leading-tight rounded-md border border-input bg-background focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset focus:outline-none resize-none"
        />
      )}

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-destructive animate-in fade-in-0 slide-in-from-top-1">{error}</p>
      )}

      {/* 当前值显示（替换预览） */}
      {value && mode === 'upload' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2 rounded-md border border-border/50">
          <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 truncate font-mono opacity-80" title={value}>
            {value.startsWith('data:') ? 'Base64 Image Data' : value.split('/').pop() || value}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-muted hover:text-foreground -mr-1"
            onClick={handleClear}
            title={t('common.clear', 'Clear')}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default ImageSourceInput;
