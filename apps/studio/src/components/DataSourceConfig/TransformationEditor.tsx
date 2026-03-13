import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface TransformationEditorProps {
  code: string;
  onChange: (code: string) => void;
  /** Sample data to run the script against for live preview. Default: `{}` */
  previewData?: unknown;
}

const EXTENSIONS = [javascript()];

/** Run script in a Function sandbox with `data` bound, returning result or error. */
function runPreview(code: string, data: unknown): { ok: boolean; value: string } {
  if (!code.trim()) return { ok: true, value: '// (empty)' };
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('data', `"use strict";\n${code}`);
    const result = fn(data);
    return {
      ok: true,
      value:
        result === undefined
          ? 'undefined'
          : typeof result === 'string'
            ? result
            : JSON.stringify(result, null, 2),
    };
  } catch (e) {
    return { ok: false, value: e instanceof Error ? e.message : String(e) };
  }
}

const DEFAULT_PREVIEW_DATA = { items: [{ value: 42 }, { value: 18 }] };

export const TransformationEditor: React.FC<TransformationEditorProps> = ({
  code,
  onChange,
  previewData = DEFAULT_PREVIEW_DATA,
}) => {
  const { t } = useTranslation('editor');
  const [preview, setPreview] = useState<{ ok: boolean; value: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Run preview with 500ms debounce
  const schedulePreview = useCallback(
    (latestCode: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPreview(runPreview(latestCode, previewData));
      }, 500);
    },
    [previewData],
  );

  useEffect(() => {
    schedulePreview(code);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, schedulePreview]);

  const handleChange = useCallback(
    (value: string) => {
      onChange(value);
      schedulePreview(value);
    },
    [onChange, schedulePreview],
  );

  return (
    <div className="space-y-2">
      <Label className="text-sm uppercase font-bold text-[#6965db]">
        {t('datasource.transformation')}
      </Label>

      <div className="grid grid-cols-2 gap-3">
        {/* Editor */}
        <div className="relative group">
          <CodeMirror
            value={code}
            height="280px"
            extensions={EXTENSIONS}
            theme={oneDark}
            onChange={handleChange}
            placeholder="return data.items.map(i => i.value);"
            basicSetup={{
              lineNumbers: true,
              autocompletion: true,
              foldGutter: false,
            }}
            className="text-sm rounded-lg overflow-hidden border border-input focus-within:border-[#6965db] transition-colors"
          />
          <div className="absolute right-2 bottom-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            JS Sandbox
          </div>
        </div>

        {/* Live preview */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            预览输出
          </span>
          <div
            className={[
              'flex-1 rounded-lg border p-3 text-xs font-mono overflow-auto bg-muted/20',
              'min-h-[264px] max-h-[264px]',
              preview === null
                ? 'border-input text-muted-foreground'
                : preview.ok
                  ? 'border-input text-foreground'
                  : 'border-red-500/40 text-red-400',
            ].join(' ')}
          >
            {preview === null ? (
              <span className="opacity-50">等待输入…</span>
            ) : (
              <pre className="whitespace-pre-wrap break-words">{preview.value}</pre>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            测试数据:{' '}
            <code className="text-[11px] bg-muted px-1 rounded">
              {JSON.stringify(previewData).slice(0, 60)}
              {JSON.stringify(previewData).length > 60 ? '…' : ''}
            </code>
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t('datasource.transformationHint')}</p>
    </div>
  );
};
