/**
 * EditorStrategy Interface
 *
 * Phase 1: 定义 Editor 的两种运行模式的公共接口。
 * 
 * - AppModeStrategy:  云端模式，自管数据 (Cloud API)
 * - WidgetModeStrategy: 宿主模式，Host 管数据 (postMessage)
 *
 * EditorShell.tsx 通过 useEditorStrategy() 获取具体策略实例，
 * 从而实现物理隔离 — Widget 文件不能 import Cloud API，反之亦然。
 */

import type { ProjectFile } from '../lib/storage/schemas'

// ─── UI 可见性配置 ───

export interface UIVisibilityConfig {
    /** 是否显示组件库面板 */
    showLibrary: boolean
    /** 是否显示属性面板 */
    showProps: boolean
    /** 是否显示顶部左侧工具栏 (项目名/标题) */
    showTopLeft: boolean
    /** 是否显示顶部工具栏 */
    showToolbar: boolean
    /** 是否显示顶部右侧 (保存/发布按钮) */
    showTopRight: boolean
    /** 是否隐藏项目选择对话框 */
    hideProjectDialog: boolean
}

// ─── 策略接口 ───

export interface EditorStrategy {
    /** 模式标识 */
    readonly mode: 'app' | 'widget'

    /**
     * 初始化: 加载项目数据
     * - AppMode: 从 Cloud API 加载
     * - WidgetMode: 等待 Host postMessage
     *
     * @returns 加载的项目数据，或 null 表示新项目
     */
    bootstrap(projectId: string): Promise<ProjectFile | null>

    /**
     * 保存: 持久化当前状态
     * - AppMode: 通过 Cloud API 保存 (由 useAutoSave 驱动)
     * - WidgetMode: postMessage 发送给 Host
     */
    save(projectState: ProjectFile): Promise<void>

    /**
     * 获取 UI 可见性配置
     * - AppMode: 根据嵌入参数决定
     * - WidgetMode: 根据 URL 参数决定
     */
    getUIVisibility(): UIVisibilityConfig

    /**
     * 注册事件监听 (数据推送、字段更新等)
     * 返回清理函数
     */
    setupListeners?(): () => void

    /**
     * 清理: 卸载时释放资源
     * - WidgetMode: 移除 message listener
     */
    dispose(): void
}
