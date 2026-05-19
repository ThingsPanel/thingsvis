import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { openLocalIconPicker } from '@/lib/local-icons/pickerStore';
import { buildLocalIconAssetUrl } from '@/lib/local-icons/resolveUrl';
import { loadLocalIconsManifest } from '@/lib/local-icons/loadManifest';
import type { LocalIconPickResult } from '@/lib/local-icons/types';

type Props = {
  value: string;
  onPick: (result: LocalIconPickResult) => void;
};

export function LocalIconField({ value, onPick }: Props) {
  const { t } = useTranslation('editor');
  const [previewUrl, setPreviewUrl] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    if (!value) {
      setPreviewUrl('');
      return;
    }

    loadLocalIconsManifest()
      .then((manifest) => {
        if (cancelled) return;
        const icon = manifest.icons.find((item) => item.id === value);
        setPreviewUrl(icon ? buildLocalIconAssetUrl(icon, manifest.basePath) : '');
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [value]);

  const label = useMemo(() => {
    if (!value) return t('localIconPicker.notSelected', '未选择图标');
    const parts = value.split('/');
    return parts[parts.length - 1] || value;
  }, [t, value]);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        title={t('localIconPicker.open', '打开本地图库')}
        onClick={() =>
          openLocalIconPicker({
            value,
            onConfirm: onPick,
          })
        }
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" className="h-4 w-4 object-contain" />
        ) : (
          <FolderOpen className="h-4 w-4" />
        )}
      </Button>
      <Input value={label} readOnly className="h-8 flex-1 text-sm" />
    </div>
  );
}
