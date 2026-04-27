import React from 'react';
import { useTranslation } from 'react-i18next';
import { NumericInput } from '@/components/ui/NumericInput';
import { ColorInput } from '@/components/ui/color-input';
import { ImageSourceInput } from './ImageSourceInput';

type BaseStylePanelProps = {
  baseStyle: any;
  onChange: (baseStyle: any) => void;
};

export function BaseStylePanel({ baseStyle, onChange }: BaseStylePanelProps) {
  const { t } = useTranslation('editor');

  const updateStyle = (key: string, subKey: string, value: any) => {
    const currentGroup = baseStyle[key] || {};
    onChange({
      ...baseStyle,
      [key]: {
        ...currentGroup,
        [subKey]: value,
      },
    });
  };

  const updateRootStyle = (key: string, value: any) => {
    onChange({
      ...baseStyle,
      [key]: value,
    });
  };

  return (
    <div className="w-full space-y-4 pb-4">
      {/* Background */}
      <div className="px-1 border-t border-border pt-4">
        <h3 className="text-[12px] font-normal text-muted-foreground uppercase tracking-wider mb-4">
          {t('propsPanel.baseStyle.background', '背景')}
        </h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              {t('propsPanel.baseStyle.color', '颜色')}
            </label>
            <ColorInput
              value={baseStyle.background?.color || ''}
              onChange={(v) => updateStyle('background', 'color', v)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              {t('propsPanel.baseStyle.image', '背景图')}
            </label>
            <ImageSourceInput
              value={baseStyle.background?.image || ''}
              onChange={(val) => updateStyle('background', 'image', val)}
            />
          </div>
        </div>
      </div>

      {/* Border — compact single-row for width/radius, color below */}
      <div className="px-1 border-t border-border pt-4">
        <h3 className="text-[12px] font-normal text-muted-foreground uppercase tracking-wider mb-4">
          {t('propsPanel.baseStyle.border', '边框')}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.baseStyle.borderWidth', '线宽')}
              </label>
              <NumericInput
                value={baseStyle.border?.width}
                onValueChange={(nextValue) => updateStyle('border', 'width', nextValue)}
                className="h-8 text-sm"
                placeholder="0"
                allowEmpty
                min={0}
                mode="int"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.baseStyle.borderRadius', '圆角')}
              </label>
              <NumericInput
                value={baseStyle.border?.radius}
                onValueChange={(nextValue) => updateStyle('border', 'radius', nextValue)}
                className="h-8 text-sm"
                placeholder="0"
                allowEmpty
                min={0}
                mode="int"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              {t('propsPanel.baseStyle.borderColor', '颜色')}
            </label>
            <ColorInput
              value={baseStyle.border?.color || ''}
              onChange={(v) => updateStyle('border', 'color', v)}
            />
          </div>
        </div>
      </div>

      {/* Shadow */}
      <div className="px-1 border-t border-border pt-4">
        <h3 className="text-[12px] font-normal text-muted-foreground uppercase tracking-wider mb-4">
          {t('propsPanel.baseStyle.shadow', '发光 / 阴影')}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                X {t('propsPanel.baseStyle.offset', '偏移')}
              </label>
              <NumericInput
                value={baseStyle.shadow?.offsetX}
                onValueChange={(nextValue) => updateStyle('shadow', 'offsetX', nextValue)}
                className="h-8 text-sm"
                placeholder="0"
                allowEmpty
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Y {t('propsPanel.baseStyle.offset', '偏移')}
              </label>
              <NumericInput
                value={baseStyle.shadow?.offsetY}
                onValueChange={(nextValue) => updateStyle('shadow', 'offsetY', nextValue)}
                className="h-8 text-sm"
                placeholder="0"
                allowEmpty
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.baseStyle.blur', '模糊半径')}
              </label>
              <NumericInput
                value={baseStyle.shadow?.blur}
                onValueChange={(nextValue) => updateStyle('shadow', 'blur', nextValue)}
                className="h-8 text-sm"
                placeholder="0"
                allowEmpty
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.baseStyle.shadowColor', '阴影颜色')}
              </label>
              <ColorInput
                value={baseStyle.shadow?.color || ''}
                onChange={(v) => updateStyle('shadow', 'color', v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Others (Padding & Opacity) */}
      <div className="px-1 border-t border-border pt-4">
        <h3 className="text-[12px] font-normal text-muted-foreground uppercase tracking-wider mb-4">
          {t('propsPanel.baseStyle.others', '其他外观')}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.baseStyle.padding', '内边距')}
              </label>
              <NumericInput
                value={baseStyle.padding}
                onValueChange={(nextValue) => updateRootStyle('padding', nextValue)}
                className="h-8 text-sm"
                placeholder="0"
                allowEmpty
                min={0}
                mode="int"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.baseStyle.opacity', '不透明度')}
              </label>
              <NumericInput
                value={baseStyle.opacity ?? 1}
                onValueChange={(nextValue) => updateRootStyle('opacity', nextValue ?? 1)}
                className="h-8 text-sm"
                placeholder="1"
                min={0}
                max={1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
