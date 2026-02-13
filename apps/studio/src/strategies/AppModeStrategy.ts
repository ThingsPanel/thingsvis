/**
 * AppModeStrategy — 云端 / 独立运行模式
 *
 * Phase 1.2: 将 Editor.tsx 中 App Mode 的 bootstrap/save 逻辑提取到此处。
 *
 * 职责:
 * 1. bootstrap: 从 Cloud API 或 IndexedDB 加载项目
 * 2. save:      由 useAutoSave hook 驱动，通过 storage adapter 持久化
 * 3. UI:        根据是否嵌入决定可见性
 *
 * ⛔ 不允许 import 任何 embed/postMessage 相关模块
 */

import type { EditorStrategy, UIVisibilityConfig } from './EditorStrategy'
import type { ProjectFile } from '../lib/storage/schemas'
import type { StorageAdapter, StorageProject } from '../lib/storage/adapter'
import { projectStorage } from '../lib/storage/projectStorage'

// ─── 工具函数 ───

/** 将 StorageProject (Cloud API 格式) 转为 ProjectFile (编辑器内格式) */
function toProjectFile(sp: StorageProject): ProjectFile {
    return {
        meta: {
            version: '1.0.0',
            id: sp.meta.id,
            name: sp.meta.name,
            thumbnail: sp.meta.thumbnail,
            projectId: sp.meta.projectId,
            projectName: sp.meta.projectName,
            createdAt: sp.meta.createdAt,
            updatedAt: sp.meta.updatedAt,
        },
        canvas: sp.schema.canvas,
        nodes: sp.schema.nodes,
        dataSources: sp.schema.dataSources,
    }
}

// ─── 策略实现 ───

export class AppModeStrategy implements EditorStrategy {
    readonly mode = 'app' as const

    private cloudAdapter: StorageAdapter | null = null
    private isEmbedded: boolean

    constructor(options: {
        cloudAdapter?: StorageAdapter
        isEmbedded?: boolean
    } = {}) {
        this.cloudAdapter = options.cloudAdapter ?? null
        this.isEmbedded = options.isEmbedded ?? false
    }

    async bootstrap(projectId: string): Promise<ProjectFile | null> {
        console.log('[AppModeStrategy] bootstrap:', projectId, 'cloud:', !!this.cloudAdapter)

        if (this.cloudAdapter) {
            // 云端模式: 从 Cloud API 加载
            try {
                const cloudProject = await this.cloudAdapter.get(projectId)
                if (cloudProject) {
                    console.log('[AppModeStrategy] Loaded from cloud:', cloudProject.meta.name)
                    return toProjectFile(cloudProject)
                }
                console.log('[AppModeStrategy] Project not found in cloud, will create new')
                return null
            } catch (err) {
                console.error('[AppModeStrategy] Cloud load failed:', err)
                return null
            }
        }

        // 本地模式: 从 IndexedDB 加载
        console.log('[AppModeStrategy] Loading from local storage')
        return projectStorage.load(projectId)
    }

    async save(projectState: ProjectFile): Promise<void> {
        // App Mode 的保存由 useAutoSave hook 处理
        // 这个方法作为手动保存的入口
        console.log('[AppModeStrategy] save called for:', projectState.meta.id)

        if (this.cloudAdapter) {
            const storageProject: StorageProject = {
                meta: {
                    id: projectState.meta.id,
                    name: projectState.meta.name,
                    thumbnail: projectState.meta.thumbnail,
                    createdAt: projectState.meta.createdAt,
                    updatedAt: Date.now(),
                },
                schema: {
                    canvas: projectState.canvas,
                    nodes: projectState.nodes,
                    dataSources: projectState.dataSources,
                },
            }
            await this.cloudAdapter.save(storageProject)
        } else {
            await projectStorage.save(projectState)
        }
    }

    getUIVisibility(): UIVisibilityConfig {
        if (this.isEmbedded) {
            // 嵌入式 App Mode — 从 URL 参数读取可见性
            const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
            return {
                showLibrary: params.get('showLibrary') !== '0',
                showProps: params.get('showProps') !== '0',
                showTopLeft: params.get('showTopLeft') !== '0',
                showToolbar: params.get('showToolbar') !== '0',
                showTopRight: params.get('showTopRight') !== '0',
                hideProjectDialog: true, // 嵌入不显示项目选择
            }
        }

        // 独立运行 — 全部显示
        return {
            showLibrary: true,
            showProps: true,
            showTopLeft: true,
            showToolbar: true,
            showTopRight: true,
            hideProjectDialog: false,
        }
    }

    dispose(): void {
        console.log('[AppModeStrategy] dispose')
        // App Mode 无需特殊清理
    }
}
