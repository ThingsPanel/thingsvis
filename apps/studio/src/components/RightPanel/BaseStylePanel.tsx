import React from 'react';
import { useTranslation } from 'react-i18next';
import { NumericInput } from '@/components/ui/NumericInput';
import { ColorInput } from '@/components/ui/color-input';
import { ImageSourceInput } from './ImageSourceInput';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

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
    <Accordion type="multiple" defaultValue={[]} className="w-full">
      {/* Background */}
      <AccordionItem value="background" className="border-b px-1">
        <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider py-3 hover:no-underline">
          {t('propsPanel.baseStyle.background', '背景')}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4 pt-1">
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
        </AccordionContent>
      </AccordionItem>

      {/* Border — compact single-row for width/radius, color below */}
      <AccordionItem value="border" className="border-b px-1">
        <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider py-3 hover:no-underline">
          {t('propsPanel.baseStyle.border', '边框')}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4 pt-1">
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
        </AccordionContent>
      </AccordionItem>

      {/* Shadow — collapsed by default */}
      <AccordionItem value="shadow" className="border-b px-1">
        <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider py-3 hover:no-underline">
          {t('propsPanel.baseStyle.shadow', '发光 / 阴影')}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4 pt-1">
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
        </AccordionContent>
      </AccordionItem>

      {/* Others (Padding & Opacity) — always open */}
      <AccordionItem value="others" className="border-b px-1">
        <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider py-3 hover:no-underline">
          {t('propsPanel.baseStyle.others', '其他外观')}
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4 pt-1">
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
