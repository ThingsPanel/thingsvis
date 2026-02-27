/**
 * CanvasSettingsPanel — 画布设置面板 (基础信息 + 画布配置)
 * 从 Editor.tsx 提取的子组件 (Phase 6)
 * 在右侧面板未选中节点时显示
 */
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { processThumbnailFile } from '../../lib/storage/thumbnail'
import { CANVAS_THEMES, validateCanvasTheme } from '@thingsvis/schema'
export interface CanvasConfig {
    id: string
    name: string
    projectName?: string
    thumbnail: string
    mode: 'fixed' | 'infinite' | 'grid'
    width: number
    height: number
    theme: string
    gridCols?: number
    gridRowHeight?: number
    gridGap?: number
    fullWidthPreview?: boolean
    [key: string]: any
}

interface CanvasSettingsPanelProps {
    canvasConfig: Record<string, any>
    currentProjectName?: string
    isEmbedded: boolean
    onConfigChange: (config: any) => void
    onLayoutModeChange: (mode: 'fixed' | 'infinite' | 'grid', hasNodes: boolean) => boolean // returns shouldProceed
    onClearCanvas: (mode: 'fixed' | 'infinite' | 'grid') => void
    onMarkDirty: () => void
    onZoomReset: () => void
}

export function CanvasSettingsPanel({ canvasConfig, currentProjectName, isEmbedded,
    onConfigChange, onLayoutModeChange, onClearCanvas,
    onMarkDirty, onZoomReset,
}: CanvasSettingsPanelProps) {
    const { t } = useTranslation('editor')

    return (
        <>
            {/* Basic Info */}
            <div className="space-y-4 pb-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                    {t('canvas.basicInfo')}
                </h3>

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
                                    onClick={() => onConfigChange({ ...canvasConfig, thumbnail: "" })}
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
                                <span className="text-xs text-muted-foreground">
                                    {t('canvas.clickToUpload')}
                                </span>
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* Canvas Config */}
            <div className="space-y-4 pb-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                    {t('canvas.settings')}
                </h3>

                <div className="space-y-3">
                    <label className="text-sm font-medium">{t('canvas.theme') || 'Theme'}</label>
                    <select
                        value={validateCanvasTheme(canvasConfig.theme)}
                        onChange={(e) => onConfigChange({ ...canvasConfig, theme: e.target.value as any })}
                        className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db] focus:outline-none"
                    >
                        {Object.values(CANVAS_THEMES).map(tOpt => (
                            <option key={tOpt.id} value={tOpt.id}>
                                {t(tOpt.i18nKey as any) || tOpt.fallbackLabel}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium">{t('canvas.mode')}</label>
                    <select
                        value={canvasConfig.mode}
                        onChange={(e) => {
                            const newMode = e.target.value as "fixed" | "infinite" | "grid";
                            if (newMode !== canvasConfig.mode) {
                                const hasNodes = onLayoutModeChange(newMode, true);
                                if (!hasNodes) return; // shouldProceed = false

                                // The parent will handle clearing canvas if needed
                                onConfigChange({ ...canvasConfig, mode: newMode });
                                onZoomReset();
                            }
                        }}
                        className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db] focus:outline-none"
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
                                <Input
                                    type="number"
                                    value={canvasConfig.width}
                                    onChange={(e) => onConfigChange({ ...canvasConfig, width: Number(e.target.value) })}
                                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('canvas.height')}</label>
                                <Input
                                    type="number"
                                    value={canvasConfig.height}
                                    onChange={(e) => onConfigChange({ ...canvasConfig, height: Number(e.target.value) })}
                                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                                />
                            </div>
                        </div>
                        {/* Grid settings */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('canvas.gridCols')}</label>
                                <Input
                                    type="number"
                                    value={canvasConfig.gridCols ?? 24}
                                    min={1}
                                    max={48}
                                    onChange={(e) => onConfigChange({ ...canvasConfig, gridCols: Number(e.target.value) })}
                                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('canvas.gridRowHeight')}</label>
                                <Input
                                    type="number"
                                    value={canvasConfig.gridRowHeight ?? 10}
                                    min={5}
                                    max={200}
                                    onChange={(e) => onConfigChange({ ...canvasConfig, gridRowHeight: Number(e.target.value) })}
                                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('canvas.gridGap')}</label>
                                <Input
                                    type="number"
                                    value={canvasConfig.gridGap ?? 5}
                                    min={0}
                                    max={50}
                                    onChange={(e) => onConfigChange({ ...canvasConfig, gridGap: Number(e.target.value) })}
                                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('canvas.gridSnapTip')}
                        </p>
                        {/* 屏幕自适应选项 */}
                        <div className="flex items-center justify-between pt-2">
                            <label className="text-sm font-medium">
                                {t('canvas.fullWidthPreview')}
                            </label>
                            <input
                                type="checkbox"
                                checked={canvasConfig.fullWidthPreview ?? false}
                                onChange={(e) => onConfigChange({
                                    ...canvasConfig,
                                    fullWidthPreview: e.target.checked
                                })}
                                className="h-4 w-4 rounded border-gray-300 accent-[#6965db]"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('canvas.fullWidthTip')}
                        </p>
                    </div>
                ) : canvasConfig.mode === 'fixed' ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('canvas.width')}</label>
                            <Input
                                type="number"
                                value={canvasConfig.width}
                                onChange={(e) => onConfigChange({ ...canvasConfig, width: Number(e.target.value) })}
                                className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('canvas.height')}</label>
                            <Input
                                type="number"
                                value={canvasConfig.height}
                                onChange={(e) => onConfigChange({ ...canvasConfig, height: Number(e.target.value) })}
                                className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    )
}
