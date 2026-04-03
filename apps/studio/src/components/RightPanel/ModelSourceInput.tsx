import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DownloadCloud, HardDrive, Link2, Loader2, Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { importRemoteAsset, uploadFile } from '@/lib/api/uploads';

type ModelSourceInputProps = {
  value: string;
  onChange: (value: string) => void;
};

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function isLocalAsset(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('uploads/') ||
    trimmed.includes('/api/v1/uploads/') ||
    trimmed.includes('/thingsvis-api/uploads/')
  );
}

export default function ModelSourceInput({ value, onChange }: ModelSourceInputProps) {
  const { t } = useTranslation('editor');
  const [urlInput, setUrlInput] = useState(value);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastImportedFrom, setLastImportedFrom] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(value);
  }, [value]);

  const trimmedValue = value.trim();
  const canImport = isHttpUrl(trimmedValue) && !isLocalAsset(trimmedValue);
  const sourceBadge = useMemo(() => {
    if (!trimmedValue) {
      return { icon: Link2, label: t('upload.url', 'URL') };
    }
    if (isLocalAsset(trimmedValue)) {
      return { icon: HardDrive, label: t('upload.localAsset', 'Local Asset') };
    }
    return { icon: Link2, label: t('upload.remoteAsset', 'Remote URL') };
  }, [trimmedValue, t]);

  const handleImport = async () => {
    if (!canImport) {
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const result = await importRemoteAsset(trimmedValue);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setLastImportedFrom(result.data.sourceUrl);
        onChange(result.data.url);
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['glb', 'gltf'].includes(ext)) {
      setError(t('upload.onlyModels', 'Only GLB or GLTF model files are supported'));
      event.target.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError(t('upload.modelSizeLimit', 'Model size cannot exceed 100MB'));
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadFile(file);
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setLastImportedFrom(null);
        setUrlInput(result.data.url);
        onChange(result.data.url);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleClear = () => {
    setUrlInput('');
    setLastImportedFrom(null);
    setError(null);
    onChange('');
  };

  const SourceIcon = sourceBadge.icon;

  return (
    <div className="space-y-2">
      <Input
        value={urlInput}
        onChange={(event) => {
          const nextValue = event.target.value;
          setUrlInput(nextValue);
          setError(null);
          onChange(nextValue);
        }}
        placeholder="https://example.com/model.glb"
        className="h-8 text-xs font-mono"
      />

      <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/15 px-2 py-2">
        <div className="min-w-0 flex items-center gap-2">
          <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-foreground">{sourceBadge.label}</p>
            <p className="truncate text-[10px] text-muted-foreground" title={trimmedValue || ''}>
              {trimmedValue || t('upload.remoteAssetHint', 'Keep remote URL or import to local')}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 px-2 text-[11px]"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title={t('upload.uploadLocalModel', 'Upload local model')}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {t('upload.uploading', 'Uploading')}
              </>
            ) : (
              <>
                <Upload className="mr-1 h-3 w-3" />
                {t('upload.uploadLocal', 'Upload')}
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 px-2 text-[11px]"
            disabled={!canImport || isImporting}
            onClick={handleImport}
            title={t('upload.importToLocal', 'Import to local')}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {t('upload.importing', 'Importing')}
              </>
            ) : (
              <>
                <DownloadCloud className="mr-1 h-3 w-3" />
                {t('upload.importToLocal', 'Import to local')}
              </>
            )}
          </Button>

          {trimmedValue ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={handleClear}
              title={t('common.clear', 'Clear')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      {lastImportedFrom ? (
        <p className="text-[10px] text-muted-foreground" title={lastImportedFrom}>
          {t('upload.importedFrom', 'Imported from')}: {lastImportedFrom}
        </p>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
