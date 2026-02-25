/**
 * EditorBottomBar — 底部控制栏 (缩放 + 撤销重做 + 帮助)
 * 从 Editor.tsx 提取的纯展示组件 (Phase 6.1)
 */
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Maximize, Monitor, Undo2, Redo2, HelpCircle } from 'lucide-react'

type Language = 'zh' | 'en'

interface EditorBottomBarProps {
    zoom: number
    zoomInput: string
    canUndo: boolean
    canRedo: boolean
    showLibrary: boolean
    showProps: boolean
    showRightPanel: boolean
    canvasWidth: number
    canvasHeight: number
    onZoomChange: (zoom: number) => void
    onZoomInputChange: (value: string) => void
    onZoomInputBlur: () => void
    onZoomInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
    onUndo: () => void
    onRedo: () => void
    onShowShortcuts: () => void
}

export function EditorBottomBar({
    zoom, zoomInput, canUndo, canRedo,
    showLibrary, showProps, showRightPanel,
    canvasWidth, canvasHeight,
    onZoomChange, onZoomInputChange, onZoomInputBlur, onZoomInputKeyDown,
    onUndo, onRedo, onShowShortcuts,
}: EditorBottomBarProps) {
    const { t } = useTranslation('editor')
    return (
        <>
            {/* Bottom Left Controls: Zoom & Undo/Redo */}
            <div className={`absolute bottom-4 z-40 flex items-center gap-3 select-none ${showLibrary ? 'left-[324px]' : 'left-4'}`}>
                {/* Zoom Controls */}
                <div className="glass rounded-md shadow-md border border-border flex items-center p-1.5 bg-[#f0f0f7]/50 dark:bg-[#1a1a24]/50">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
                        onClick={() => onZoomChange(Math.max(10, zoom - 10))}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>

                    <div className="w-[48px] px-0.5">
                        <Input
                            value={zoomInput + "%"}
                            onChange={(e) => {
                                const val = e.target.value.replace(/%/g, '')
                                onZoomInputChange(val)
                            }}
                            onBlur={onZoomInputBlur}
                            onKeyDown={onZoomInputKeyDown}
                            className="h-6 text-sm font-medium text-center border-0 bg-transparent focus-visible:ring-0 focus-visible:bg-background/50 p-0 tabular-nums shadow-none hover:bg-background/40 transition-colors rounded-sm"
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
                        onClick={() => onZoomChange(Math.min(500, zoom + 10))}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
                        title={t('bottomBar.bestFit')}
                        onClick={() => {
                            const leftPanelWidth = showLibrary ? 320 : 0
                            const rightPanelWidth = (showProps && showRightPanel) ? 340 : 0
                            const availableWidth = window.innerWidth - leftPanelWidth - rightPanelWidth - 60
                            const availableHeight = window.innerHeight - 150

                            const canvasW = canvasWidth || 1920
                            const canvasH = canvasHeight || 1080

                            const scaleW = availableWidth / canvasW
                            const scaleH = availableHeight / canvasH

                            const bestFit = Math.min(scaleW, scaleH)
                            onZoomChange(Math.floor(Math.max(10, Math.min(500, bestFit * 90))))
                        }}
                    >
                        <Maximize className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-background/80 focus:ring-0 focus:outline-none"
                        title={t('bottomBar.hundredPercent')}
                        onClick={() => onZoomChange(100)}
                    >
                        <Monitor className="h-4 w-4" />
                    </Button>
                </div>

                {/* Undo/Redo Controls */}
                <div className="glass rounded-md shadow-md border border-border flex items-center p-1.5 gap-1 bg-[#f0f0f7]/50 dark:bg-[#1a1a24]/50">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-background/80 disabled:opacity-30 focus:ring-0 focus:outline-none"
                        disabled={!canUndo}
                        onClick={onUndo}
                        title={t('bottomBar.undo')}
                    >
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-background/80 disabled:opacity-30 focus:ring-0 focus:outline-none"
                        disabled={!canRedo}
                        onClick={onRedo}
                        title={t('bottomBar.redo')}
                    >
                        <Redo2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Bottom Right: Help Button (Floating) */}
            <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full shadow-lg border border-border bg-[#f0f0f7]/90 dark:bg-[#1a1a24]/90 hover:bg-background text-muted-foreground hover:text-foreground transition-all"
                    onClick={onShowShortcuts}
                    title={t('bottomBar.shortcutsHelp')}
                >
                    <HelpCircle className="h-5 w-5" />
                </Button>
            </div>
        </>
    )
}
