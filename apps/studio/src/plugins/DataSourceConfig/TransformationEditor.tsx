import React from 'react';
import { Label } from '@/components/ui/label';

interface TransformationEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: 'zh' | 'en';
}

export const TransformationEditor: React.FC<TransformationEditorProps> = ({ code, onChange, language }) => {
  const label = (zh: string, en: string) => language === 'zh' ? zh : en;

  return (
    <div className="space-y-2">
      <Label className="text-sm uppercase font-bold text-[#6965db]">
        {label('数据转换 (JS)', 'Transformation (JS)')}
      </Label>
      <div className="relative group">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          placeholder="return data.items.map(i => i.val);"
          className="w-full h-[300px] p-3 text-sm font-mono rounded-lg border border-input bg-muted/20 focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db] focus:outline-none resize-none"
        />
        <div className="absolute right-2 bottom-2 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          JavaScript Sandbox
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {label('可用变量: data (原始数据)', 'Available: data (raw input)')}
      </p>
    </div>
  );
};

