import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { ColorInput } from '@/components/ui/color-input';
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
    <Accordion
      type="multiple"
      defaultValue={['background', 'border', 'shadow', 'others']}
      className="w-full"
    >
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
              {t('propsPanel.baseStyle.image', '背景图 (URL)')}
            </label>
            <Input
              type="text"
              value={baseStyle.background?.image || ''}
              onChange={(e) => updateStyle('background', 'image', e.target.value)}
              placeholder="https://..."
              className="h-8 text-sm"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Border */}
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
              <Input
                type="number"
                value={baseStyle.border?.width ?? ''}
                onChange={(e) =>
                  updateStyle(
                    'border',
                    'width',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.baseStyle.borderRadius', '圆角')}
              </label>
              <Input
                type="number"
                value={baseStyle.border?.radius ?? ''}
                onChange={(e) =>
                  updateStyle(
                    'border',
                    'radius',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                className="h-8 text-sm"
                placeholder="0"
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

      {/* Shadow */}
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
              <Input
                type="number"
                value={baseStyle.shadow?.offsetX ?? ''}
                onChange={(e) =>
                  updateStyle(
                    'shadow',
                    'offsetX',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Y {t('propsPanel.baseStyle.offset', '偏移')}
              </label>
              <Input
                type="number"
                value={baseStyle.shadow?.offsetY ?? ''}
                onChange={(e) =>
                  updateStyle(
                    'shadow',
                    'offsetY',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              {t('propsPanel.baseStyle.blur', '模糊半径')}
            </label>
            <Input
              type="number"
              value={baseStyle.shadow?.blur ?? ''}
              onChange={(e) =>
                updateStyle(
                  'shadow',
                  'blur',
                  e.target.value === '' ? undefined : Number(e.target.value),
                )
              }
              className="h-8 text-sm"
              placeholder="0"
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
        </AccordionContent>
      </AccordionItem>

      {/* Others (Padding & Opacity) */}
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
              <Input
                type="number"
                value={baseStyle.padding ?? ''}
                onChange={(e) =>
                  updateRootStyle(
                    'padding',
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.baseStyle.opacity', '不透明度')}
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={baseStyle.opacity ?? 1}
                onChange={(e) =>
                  updateRootStyle('opacity', e.target.value === '' ? 1 : Number(e.target.value))
                }
                className="h-8 text-sm"
                placeholder="1"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
