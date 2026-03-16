/**
 * CanvasSettingsPanel — 画布设置面板 (基础信息 + 画布配置)
 * 从 Editor.tsx 提取的子组件 (Phase 6)
 * 在右侧面板未选中节点时显示
 */
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/NumericInput';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { processThumbnailFile } from '../../lib/storage/thumbnail';
import { ColorInput } from '@/components/ui/color-input';
import { ImageSourceInput } from './ImageSourceInput';
import { CANVAS_THEMES, validateCanvasTheme } from '@thingsvis/schema';
import { cn } from '@/lib/utils';

export interface CanvasConfig {
  id: string;
  name: string;
  projectName?: string;
  thumbnail: string;
  mode: 'fixed' | 'infinite' | 'grid';
  width: number;
  height: number;
  theme: string;
  gridCols?: number;
  gridRowHeight?: number;
  gridGap?: number;
  background?: {
    color?: string;
    image?: string;
    size?: string;
    repeat?: string;
    attachment?: string;
  };
  scaleMode?: 'fit-min' | 'fit-width' | 'fit-height' | 'stretch' | 'original';
  [key: string]: any;
}

interface CanvasSettingsPanelProps {
  canvasConfig: Record<string, any>;
  currentProjectName?: string;
  isEmbedded: boolean;
  onConfigChange: (config: any) => void;
  onLayoutModeChange: (mode: 'fixed' | 'infinite' | 'grid', hasNodes: boolean) => boolean; // returns shouldProceed
  onClearCanvas: (mode: 'fixed' | 'infinite' | 'grid') => void;
  onMarkDirty: () => void;
  onZoomReset: () => void;
}

export function CanvasSettingsPanel({
  canvasConfig,
  currentProjectName,
  onConfigChange,
  onLayoutModeChange,
  onMarkDirty,
  onZoomReset,
}: CanvasSettingsPanelProps) {
  const { t } = useTranslation('editor');

  // Guard: legacy projects store background as a string — normalize to object
  const bg: Record<string, string> =
    typeof canvasConfig.background === 'object' && canvasConfig.background !== null
      ? (canvasConfig.background as Record<string, string>)
      : {};

  return (
    <Accordion type="multiple" defaultValue={['canvas', 'background']} className="w-full">
      {/* Basic Info */}
      <AccordionItem value="basic" className="border-b px-2">
        <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-3">
          {t('canvas.basicInfo')}
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">{t('canvas.projectName')}</label>
            <Input
              value={canvasConfig.projectName || currentProjectName || t('canvas.untitledProject')}
              readOnly
              disabled
              className="h-8 text-sm rounded-md bg-muted/50 cursor-not-allowed"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">{t('canvas.pageName')}</label>
            <Input
              value={canvasConfig.name}
              onChange={(e) => onConfigChange({ ...canvasConfig, name: e.target.value })}
              className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">{t('canvas.pageId')}</label>
            <Input
              value={canvasConfig.id}
              readOnly
              className="h-8 text-sm rounded-md bg-muted focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">{t('canvas.thumbnail')}</label>
            <div className="flex items-center gap-2">
              {canvasConfig.thumbnail ? (
                <div className="relative group w-full">
                  <img
                    src={canvasConfig.thumbnail}
                    alt="Thumbnail"
                    className="w-full h-20 object-cover rounded-md border border-border"
                  />
                  <button
                    onClick={() => onConfigChange({ ...canvasConfig, thumbnail: '' })}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex-1 h-20 border-2 border-dashed border-border rounded-md flex items-center justify-center cursor-pointer hover:border-[#6965db] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const thumbnail = await processThumbnailFile(file);
                          onConfigChange({ ...canvasConfig, thumbnail });
                          onMarkDirty();
                        } catch (error) {
                          console.error('Failed to process thumbnail', error);
                          alert(t('canvas.thumbnailFailed'));
                        }
                      }
                    }}
                  />
                  <span className="text-xs text-muted-foreground">{t('canvas.clickToUpload')}</span>
                </label>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Canvas Config */}
      <AccordionItem value="canvas" className="border-b px-2">
        <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-3">
          {t('canvas.settings')}
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">{t('canvas.theme')}</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(CANVAS_THEMES).map((tOpt) => {
                const isSelected = validateCanvasTheme(canvasConfig.theme) === tOpt.id;
                return (
                  <button
                    key={tOpt.id}
                    type="button"
                    onClick={() => onConfigChange({ ...canvasConfig, theme: tOpt.id })}
                    className={cn(
                      'group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center',
                      isSelected
                        ? 'border-[#6965db] bg-white shadow-sm'
                        : 'border-muted/30 bg-muted/20 hover:border-muted-foreground/30 hover:bg-muted/40',
                    )}
                  >
                    <div className="flex w-full h-5 rounded-full overflow-hidden border border-black/5 p-[1px] bg-white/50">
                      {tOpt.swatch.map((color, i) => (
                        <div
                          key={i}
                          className="flex-1 h-full first:rounded-l-full last:rounded-r-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold transition-colors truncate w-full',
                        isSelected ? 'text-[#6965db]' : 'text-muted-foreground',
                      )}
                    >
                      {t(tOpt.i18nKey as any) || tOpt.fallbackLabel}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#6965db] ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">{t('canvas.mode')}</label>
            <select
              value={canvasConfig.mode}
              onChange={(e) => {
                const newMode = e.target.value as 'fixed' | 'infinite' | 'grid';
                if (newMode !== canvasConfig.mode) {
                  const hasNodes = onLayoutModeChange(newMode, true);
                  if (!hasNodes) return; // shouldProceed = false

                  // The parent will handle clearing canvas if needed
                  onConfigChange({ ...canvasConfig, mode: newMode });
                  onZoomReset();
                }
              }}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring "
            >
              <option value="grid">{t('canvas.modeGrid')}</option>
              <option value="fixed">{t('canvas.modeFixed')}</option>
              <option value="infinite">{t('canvas.modeInfinite')}</option>
            </select>
          </div>

          {canvasConfig.mode === 'grid' ? (
            <div className="space-y-3">
              {/* Canvas size for grid mode */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('canvas.width')}</label>
                  <NumericInput
                    value={canvasConfig.width}
                    onValueChange={(nextValue) =>
                      onConfigChange({ ...canvasConfig, width: nextValue ?? canvasConfig.width })
                    }
                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    min={800}
                    max={4000}
                    mode="int"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('canvas.height')}</label>
                  <NumericInput
                    value={canvasConfig.height}
                    onValueChange={(nextValue) =>
                      onConfigChange({ ...canvasConfig, height: nextValue ?? canvasConfig.height })
                    }
                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    min={600}
                    max={3000}
                    mode="int"
                  />
                </div>
              </div>
              {/* Grid settings */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('canvas.gridCols')}</label>
                  <NumericInput
                    value={canvasConfig.gridCols ?? 24}
                    min={1}
                    max={48}
                    onValueChange={(nextValue) =>
                      onConfigChange({
                        ...canvasConfig,
                        gridCols: nextValue ?? canvasConfig.gridCols ?? 24,
                      })
                    }
                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    mode="int"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('canvas.gridRowHeight')}</label>
                  <NumericInput
                    value={canvasConfig.gridRowHeight ?? 50}
                    min={5}
                    max={200}
                    onValueChange={(nextValue) =>
                      onConfigChange({
                        ...canvasConfig,
                        gridRowHeight: nextValue ?? canvasConfig.gridRowHeight ?? 50,
                      })
                    }
                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    mode="int"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('canvas.gridGap')}</label>
                  <NumericInput
                    value={canvasConfig.gridGap ?? 10}
                    min={0}
                    max={50}
                    onValueChange={(nextValue) =>
                      onConfigChange({
                        ...canvasConfig,
                        gridGap: nextValue ?? canvasConfig.gridGap ?? 10,
                      })
                    }
                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    mode="int"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('canvas.gridSnapTip')}</p>
            </div>
          ) : canvasConfig.mode === 'fixed' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('canvas.width')}</label>
                  <NumericInput
                    value={canvasConfig.width}
                    onValueChange={(nextValue) =>
                      onConfigChange({ ...canvasConfig, width: nextValue ?? canvasConfig.width })
                    }
                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    min={800}
                    max={4000}
                    mode="int"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('canvas.height')}</label>
                  <NumericInput
                    value={canvasConfig.height}
                    onValueChange={(nextValue) =>
                      onConfigChange({ ...canvasConfig, height: nextValue ?? canvasConfig.height })
                    }
                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    min={600}
                    max={3000}
                    mode="int"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Scale mode setting — only relevant for fixed canvas modes, not grid (which is auto-responsive) */}
          {canvasConfig.mode !== 'infinite' && canvasConfig.mode !== 'grid' && (
            <div className="space-y-3 mt-3">
              <label className="text-sm font-medium">{t('canvas.scaleMode')}</label>
              <select
                value={canvasConfig.scaleMode || 'fit-min'}
                onChange={(e) => onConfigChange({ ...canvasConfig, scaleMode: e.target.value })}
                className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring "
              >
                <option value="fit-min">{t('canvas.scaleModeFitMin')}</option>
                <option value="fit-width">{t('canvas.scaleModeFitWidth')}</option>
                <option value="fit-height">{t('canvas.scaleModeFitHeight')}</option>
                <option value="stretch">{t('canvas.scaleModeStretch')}</option>
                <option value="original">{t('canvas.scaleModeOriginal')}</option>
              </select>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {/* Global Background Settings */}
      <AccordionItem value="background" className="border-b-0 px-2">
        <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-3">
          {t('canvas.globalBackground')}
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pb-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">{t('canvas.backgroundColor')}</label>
            <ColorInput
              value={bg.color || ''}
              onChange={(v) => onConfigChange({ ...canvasConfig, background: { ...bg, color: v } })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">{t('canvas.backgroundImage')}</label>
            <ImageSourceInput
              value={bg.image || ''}
              onChange={(val) =>
                onConfigChange({
                  ...canvasConfig,
                  background: { ...bg, image: val },
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('canvas.bgSize')}</label>
              <select
                value={bg.size || 'cover'}
                onChange={(e) =>
                  onConfigChange({
                    ...canvasConfig,
                    background: { ...bg, size: e.target.value },
                  })
                }
                className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring "
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="100% 100%">Stretch 100%</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('canvas.bgRepeat')}</label>
              <select
                value={bg.repeat || 'no-repeat'}
                onChange={(e) =>
                  onConfigChange({
                    ...canvasConfig,
                    background: { ...bg, repeat: e.target.value },
                  })
                }
                className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring "
              >
                <option value="no-repeat">No Repeat</option>
                <option value="repeat">Repeat</option>
                <option value="repeat-x">Repeat X</option>
                <option value="repeat-y">Repeat Y</option>
              </select>
            </div>
          </div>

          {canvasConfig.mode === 'grid' && (
            <div className="space-y-3 mt-3">
              <label className="text-sm font-medium">{t('canvas.bgAttachment')}</label>
              <select
                value={bg.attachment || 'scroll'}
                onChange={(e) =>
                  onConfigChange({
                    ...canvasConfig,
                    background: { ...bg, attachment: e.target.value },
                  })
                }
                className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring "
              >
                <option value="scroll">Scroll</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
