/**
 * EditorTopNav — 顶部导航栏 (菜单 + 工具栏 + 操作栏)
 * 从 Editor.tsx 提取的纯展示组件 (Phase 6.3)
 */
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SaveIndicator } from './SaveIndicator'
import {
    Menu, FolderOpen, Save, Database, FileUp, FileDown, Settings,
    HelpCircle, LogOut, Users, Eye, Upload, Languages, Sun, Moon,
    PanelRightOpen, PanelLeftOpen, Minimize, Maximize, type LucideIcon,
} from 'lucide-react'

type Tool = 'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'image' | 'pan'

interface ToolItem {
    id: Tool
    icon: LucideIcon
    label: string
}

interface EditorTopNavProps {
    canvasMode: 'fixed' | 'infinite' | 'grid'
    tools: ToolItem[]
    activeTool: Tool
    isDarkMode: boolean
    isEmbedded: boolean
    showTopLeft: boolean
    showToolbar: boolean
    showTopRight: boolean
    showRightPanel: boolean
    showLibrary: boolean
    showLeftPanel: boolean
    isFullscreen: boolean
    // Save state
    saveStatus: string
    lastSavedAt: number | null
    saveError: string | null
    isSaving: boolean
    // Auth
    isAuthenticated: boolean
    authLoading: boolean
    user: { name?: string; email?: string } | null
    // Project
    projectName: string
    projectId: string
    // Callbacks
    onToolChange: (tool: Tool) => void
    onProjectNameChange: (name: string) => void
    onSave: () => void
    onPreview: () => void
    onPublish: () => void
    onToggleTheme: () => void
    onToggleRightPanel: () => void
    onToggleLeftPanel: () => void
    onToggleFullscreen: () => void
    onOpenProjectDialog: () => void
    onOpenDataSources: () => void
    onLogout: () => void
    onLogin: () => void
}

export function EditorTopNav({
    canvasMode, tools, activeTool, isDarkMode,
    isEmbedded, showTopLeft, showToolbar, showTopRight, showRightPanel, showLibrary, showLeftPanel, isFullscreen,
    saveStatus, lastSavedAt, saveError, isSaving,
    isAuthenticated, authLoading, user,
    projectName, projectId,
    onToolChange, onProjectNameChange,
    onSave, onPreview, onPublish, onToggleTheme, onToggleRightPanel, onToggleLeftPanel, onToggleFullscreen,
    onOpenProjectDialog, onOpenDataSources, onLogout, onLogin,
}: EditorTopNavProps) {
    const { t, i18n } = useTranslation('editor')
    return (
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
            {/* Left Side: Left Panel Toggle, Logo (Menu), Title, Status */}
            <div className={`glass rounded-xl shadow-lg border border-border/60 flex items-center gap-3 px-3 py-2 pointer-events-auto ${!showTopLeft ? 'invisible' : ''}`}>
                {/* Left Panel Toggle Button - 最左边 */}
                {showLibrary && !showLeftPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg focus:ring-0 focus:outline-none hover:bg-accent/80"
                        onClick={onToggleLeftPanel}
                        title={t('topNav.showLibrary')}
                    >
                        <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                )}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="h-8 w-8 rounded-lg bg-[#6965db] hover:bg-[#5851db] flex items-center justify-center transition-colors shadow-sm">
                                <Menu className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 mt-2">
                        <DropdownMenuItem className="gap-2" onClick={onOpenProjectDialog}>
                            <FolderOpen className="h-4 w-4" />
                            {t('menu.openProject')}
                            <span className="ml-auto text-sm text-muted-foreground">Ctrl+O</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={onSave}>
                            <Save className="h-4 w-4" />
                            {t('menu.save')}
                            <span className="ml-auto text-sm text-muted-foreground">Ctrl+S</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={onOpenDataSources}>
                            <Database className="h-4 w-4" />
                            {t('menu.dataSources')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                            <FileUp className="h-4 w-4" />
                            {t('menu.importConfig')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                            <FileDown className="h-4 w-4" />
                            {t('menu.exportConfig')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2">
                            <Settings className="h-4 w-4" />
                            {t('menu.settings')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                            <HelpCircle className="h-4 w-4" />
                            {t('menu.help')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!authLoading && isAuthenticated && user ? (
                            <>
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    <div className="font-medium text-foreground">{user.name || user.email}</div>
                                    <div className="text-xs">{user.email}</div>
                                </div>
                                <DropdownMenuItem
                                    className="gap-2 text-red-600 dark:text-red-400"
                                    onClick={onLogout}
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('menu.logout')}
                                </DropdownMenuItem>
                            </>
                        ) : !authLoading ? (
                            <DropdownMenuItem className="gap-2" onClick={onLogin}>
                                <Users className="h-4 w-4" />
                                {t('menu.login')}
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Input
                    placeholder={t('topNav.untitledProject')}
                    className="min-w-[50px] max-w-[300px] w-auto h-8 bg-transparent border-0 focus-visible:ring-0 px-2 text-foreground font-medium rounded-lg"
                    value={projectName}
                    onChange={(e) => onProjectNameChange(e.target.value)}
                    style={{ width: `${Math.max(100, Math.min(150, (projectName?.length || 6) * 14 + 16))}px` }}
                />

                <SaveIndicator
                    status={saveStatus as any}
                    lastSavedAt={lastSavedAt}
                    error={saveError}
                    className="ml-1 pr-2"
                />
            </div>

            {/* Center Side: Tools */}
            <div className={`glass rounded-xl shadow-lg border border-border/60 flex items-center gap-1 px-2 py-1.5 pointer-events-auto ${!showToolbar ? 'invisible' : ''}`}>
                {tools.filter(tool => {
                    if (canvasMode === 'grid') {
                        return !['rectangle', 'circle', 'line', 'text'].includes(tool.id)
                    }
                    return true
                }).map((tool) => {
                    const Icon = tool.icon
                    const isActive = activeTool === tool.id

                    return (
                        <Button
                            key={tool.id}
                            variant="ghost"
                            size="icon"
                            className={`h-9 w-9 rounded-lg transition-all focus:ring-0 focus:outline-none ${isActive
                                ? "bg-[#6965db]/10 text-[#6965db] shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
                                }`}
                            onClick={() => onToolChange(tool.id)}
                            title={tool.label}
                        >
                            <Icon className={`h-4.5 w-4.5 ${isActive ? "stroke-[2.5px]" : "stroke-2"}`} />
                        </Button>
                    )
                })}
            </div>

            {/* Right Side: Language, Theme, Preview, Publish */}
            <div className={`glass rounded-xl shadow-lg border border-border/60 flex items-center gap-2 px-2 py-2 pointer-events-auto ${!showTopRight ? 'invisible' : ''}`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md focus:ring-0 focus:outline-none">
                            <Languages className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="mt-2">
                        <DropdownMenuItem onClick={() => i18n.changeLanguage('zh')}>
                            <span className={i18n.language === 'zh' ? 'font-semibold' : ''}>中文</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => i18n.changeLanguage('en')}>
                            <span className={i18n.language === 'en' ? 'font-semibold' : ''}>English</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md focus:ring-0 focus:outline-none" onClick={onToggleTheme}>
                    {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 rounded-lg px-4 hover:bg-accent/80 focus:ring-0 focus:outline-none"
                    onClick={onSave}
                    disabled={isSaving}
                >
                    <Save className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('topNav.save')}</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 rounded-lg px-4 hover:bg-accent/80 focus:ring-0 focus:outline-none"
                    onClick={onPreview}
                >
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('topNav.preview')}</span>
                </Button>

                {/* <Button
                    size="sm"
                    className="h-8 gap-1.5 rounded-md bg-[#6965db] hover:bg-[#5851db] text-white px-4 shadow-md shadow-[#6965db]/20 focus:ring-0 focus:outline-none transition-all"
                    onClick={onPublish}
                >
                    <Upload className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">{t('topNav.publish')}</span>
                </Button> */}

                {/* Fullscreen Button (Embed Mode Only) */}
                {isEmbedded && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg focus:ring-0 focus:outline-none hover:bg-accent/80"
                        onClick={onToggleFullscreen}
                        title={isFullscreen ? t('topNav.exitFullscreen') : t('topNav.fullscreen')}
                    >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                )}

                {/* Right Panel Toggle Button - 最右边 */}
                {!showRightPanel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg focus:ring-0 focus:outline-none hover:bg-accent/80"
                        onClick={onToggleRightPanel}
                        title={t('topNav.showProps')}
                    >
                        <PanelRightOpen className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
