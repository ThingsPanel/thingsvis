/**
 * CanvasSettingsPanel — 画布设置面板 (基础信息 + 画布配置)
 * 从 Editor.tsx 提取的子组件 (Phase 6)
 * 在右侧面板未选中节点时显示
 */
import React from 'react'
import { Input } from '@/components/ui/input'
import { processThumbnailFile } from '../../lib/storage/thumbnail'

type Language = 'zh' | 'en'

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
    language: Language
    canvasConfig: Record<string, any>
    currentProjectName?: string
    isEmbedded: boolean
    onConfigChange: (config: any) => void
    onLayoutModeChange: (mode: 'fixed' | 'infinite' | 'grid', hasNodes: boolean) => boolean // returns shouldProceed
    onClearCanvas: (mode: 'fixed' | 'infinite' | 'grid') => void
    onMarkDirty: () => void
    onZoomReset: () => void
}

export function CanvasSettingsPanel({
    language, canvasConfig, currentProjectName, isEmbedded,
    onConfigChange, onLayoutModeChange, onClearCanvas,
    onMarkDirty, onZoomReset,
}: CanvasSettingsPanelProps) {
    return (
        <>
            {/* Basic Info */}
            <div className="space-y-4 pb-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                    {language === "zh" ? "基础信息" : "Basic Info"}
                </h3>

                <div className="space-y-3">
                    <label className="text-sm font-medium">{language === "zh" ? "项目名称" : "Project Name"}</label>
                    <Input
                        value={canvasConfig.projectName || currentProjectName || (language === "zh" ? "未命名项目" : "Untitled Project")}
                        readOnly
                        disabled
                        className="h-8 text-sm rounded-md bg-muted/50 cursor-not-allowed"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium">{language === "zh" ? "页面名称" : "Page Name"}</label>
                    <Input
                        value={canvasConfig.name}
                        onChange={(e) => onConfigChange({ ...canvasConfig, name: e.target.value })}
                        className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium">{language === "zh" ? "页面ID" : "Page ID"}</label>
                    <Input
                        value={canvasConfig.id}
                        readOnly
                        className="h-8 text-sm rounded-md bg-muted focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium">{language === "zh" ? "缩略图" : "Thumbnail"}</label>
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
                                                alert(language === "zh" ? "缩略图处理失败" : "Failed to process thumbnail");
                                            }
                                        }
                                    }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {language === "zh" ? "点击上传缩略图" : "Click to upload"}
                                </span>
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* Canvas Config */}
            <div className="space-y-4 pb-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                    {language === "zh" ? "画布配置" : "Canvas Config"}
                </h3>

                <div className="space-y-3">
                    <label className="text-sm font-medium">{language === "zh" ? "布局模式" : "Layout Mode"}</label>
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
                        <option value="grid">{language === "zh" ? "栅格布局" : "Grid Layout"}</option>
                        <option value="fixed">{language === "zh" ? "固定尺寸" : "Fixed Size"}</option>
                        <option value="infinite">{language === "zh" ? "无限画布" : "Infinite Canvas"}</option>
                    </select>
                </div>

                {canvasConfig.mode === 'grid' ? (
                    <div className="space-y-3">
                        {/* Canvas size for grid mode */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{language === "zh" ? "宽度" : "Width"}</label>
                                <Input
                                    type="number"
                                    value={canvasConfig.width}
                                    onChange={(e) => onConfigChange({ ...canvasConfig, width: Number(e.target.value) })}
                                    className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{language === "zh" ? "高度" : "Height"}</label>
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
                                <label className="text-sm font-medium">{language === "zh" ? "列数" : "Cols"}</label>
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
                                <label className="text-sm font-medium">{language === "zh" ? "行高" : "Row H"}</label>
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
                                <label className="text-sm font-medium">{language === "zh" ? "间距" : "Gap"}</label>
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
                            {language === "zh" ? "栅格布局模式下，组件自动吸附到网格" : "In grid layout mode, widgets snap to grid"}
                        </p>
                        {/* 屏幕自适应选项 */}
                        <div className="flex items-center justify-between pt-2">
                            <label className="text-sm font-medium">
                                {language === "zh" ? "屏幕自适应" : "Full Width Preview"}
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
                            {language === "zh"
                                ? "勾选后预览页面画布撑满容器宽度，无背景阴影"
                                : "When checked, preview canvas fills container width without shadow"}
                        </p>
                    </div>
                ) : canvasConfig.mode === 'fixed' ? (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{language === "zh" ? "宽度" : "Width"}</label>
                            <Input
                                type="number"
                                value={canvasConfig.width}
                                onChange={(e) => onConfigChange({ ...canvasConfig, width: Number(e.target.value) })}
                                className="h-8 text-sm rounded-md focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{language === "zh" ? "高度" : "Height"}</label>
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
