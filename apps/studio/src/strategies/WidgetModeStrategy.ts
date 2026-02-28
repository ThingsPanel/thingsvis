/**
 * WidgetModeStrategy — 物模型组件 (Host 管数据) 模式
 *
 * Phase 1.3: 将 Editor.tsx 中 Widget Mode 的 embed 通信逻辑提取到此处。
 *
 * 职责:
 * 1. bootstrap: 等待 Host 的 `tv:init` 消息
 * 2. save:      通过 postMessage 发送 `tv:save` 给 Host
 * 3. listeners: 处理 updateData / updateSchema 实时推送
 *
 * ⛔ 不允许 import 任何 Cloud API / storage adapter 模块
 */

import type { EditorStrategy, UIVisibilityConfig } from './EditorStrategy'
import type { ProjectFile } from '../lib/storage/schemas'
import { onEmbedEvent, messageRouter, MSG_TYPES, processEmbedInitPayload, type EmbedInitPayload } from '../embed/message-router'
import { platformFieldStore } from '../lib/stores/platformFieldStore'
import { dataSourceManager } from '@thingsvis/kernel'
import { store } from '../lib/store'

// ─── 策略实现 ───

export class WidgetModeStrategy implements EditorStrategy {
    readonly mode = 'widget' as const

    private unsubscribers: Array<() => void> = []
    private initResolve: ((data: ProjectFile | null) => void) | null = null

    /**
     * bootstrap: 等待 Host 发送初始化数据
     *
     * 注意: 这里返回一个 Promise，当收到 init 消息时 resolve。
     * 如果 Host 不发送 init (timeout)，则 resolve(null) 创建空项目。
     */
    async bootstrap(projectId: string): Promise<ProjectFile | null> {
        return new Promise<ProjectFile | null>((resolve) => {
            this.initResolve = resolve

            // 监听 init 事件
            const unsub = onEmbedEvent('init', (payload: EmbedInitPayload) => {
                // 日志由 messageRouter 自动记录

                const processed = processEmbedInitPayload(payload)
                if (!processed) {
                    console.warn('[WidgetModeStrategy] Invalid init payload')
                    resolve(null)
                    return
                }

                // 注入 __platform__ 数据源
                dataSourceManager.registerDataSource({
                    id: '__platform__',
                    name: 'System Platform',
                    type: 'PLATFORM_FIELD',
                    config: { source: 'ThingsPanel', fieldMappings: {} }
                })

                // 处理平台字段
                const initPayload = payload as any
                if (initPayload.data?.platformFields && Array.isArray(initPayload.data.platformFields)) {
                    platformFieldStore.setFields(initPayload.data.platformFields)
                }

                // 构造 ProjectFile
                const projectFile: ProjectFile = {
                    meta: {
                        version: '1.0.0',
                        id: processed.projectId,
                        name: processed.projectName,
                        thumbnail: processed.thumbnail,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    },
                    canvas: {
                        mode: processed.canvas.mode as any,
                        width: processed.canvas.width,
                        height: processed.canvas.height,
                        background: processed.canvas.background,
                        gridCols: processed.canvas.gridCols,
                        gridRowHeight: processed.canvas.gridRowHeight,
                        gridGap: processed.canvas.gridGap,
                        fullWidthPreview: processed.canvas.fullWidthPreview,
                    },
                    nodes: processed.nodes,
                    dataSources: processed.dataSources,
                }

                resolve(projectFile)
            })

            this.unsubscribers.push(unsub)

            // 30秒超时
            setTimeout(() => {
                if (this.initResolve) {
                    console.warn('[WidgetModeStrategy] Init timeout, creating empty project')
                    this.initResolve = null
                    resolve(null)
                }
            }, 30000)
        })
    }

    /**
     * save: 通过 postMessage 发送保存数据给 Host
     */
    async save(projectState: ProjectFile): Promise<void> {
        const exportData = {
            canvas: projectState.canvas,
            nodes: projectState.nodes,
            dataSources: projectState.dataSources,
            thumbnail: projectState.meta.thumbnail,
            meta: {
                ...projectState.meta, // 确保保存完整的 meta 结构 (id, name, thumbnail 等)
            },
        }

        messageRouter.send(MSG_TYPES.HOST_SAVE, exportData)
    }

    /**
     * 注册实时数据推送监听
     */
    setupListeners(): () => void {
        const cleanups: Array<() => void> = []

        // 监听 updateSchema (平台字段更新)
        const schemaUnsub = onEmbedEvent('updateSchema', (payload: any) => {
            const fields = payload?.payload || payload
            if (Array.isArray(fields)) {
                platformFieldStore.setFields(fields)
            }
        })
        cleanups.push(schemaUnsub)

        // 监听 updateData (实时数据推送)
        const dataUnsub = onEmbedEvent('updateData', (payload: any) => {
            const data = payload?.payload || payload?.data || payload || {}
            if (data && typeof data === 'object') {
                // 桥接到 PlatformFieldAdapter
                Object.entries(data).forEach(([fieldId, value]) => {
                    window.postMessage({
                        type: 'tv:platform-data',
                        payload: { fieldId, value, timestamp: Date.now() }
                    }, '*')
                })
            }

            // 遍历所有节点，检查物模型绑定并更新属性
            const kernelState = store.getState()
            Object.values(kernelState.nodesById).forEach(nodeState => {
                const schema = nodeState.schemaRef as any
                const bindings = schema.thingModelBindings || []

                if (bindings.length > 0) {
                    const newProps = { ...schema.props }
                    let changed = false

                    bindings.forEach((binding: any) => {
                        const targetProp = binding.targetProp
                        const fieldId = binding.metricsId || binding.key

                        if (targetProp && fieldId && data[fieldId] !== undefined) {
                            newProps[targetProp] = data[fieldId]
                            changed = true
                        }
                    })

                    if (changed) {
                        kernelState.updateNode(schema.id, { props: newProps })
                    }
                }
            })
        })
        cleanups.push(dataUnsub)

        // 监听 Host 主动请求保存 (由 EditorShell 处理实际保存, 这里只做日志)
        const requestSaveUnsub = messageRouter.on(MSG_TYPES.REQUEST_SAVE, () => {
            console.log('[WidgetModeStrategy] Host requested save (handled by EditorShell)')
        })
        cleanups.push(requestSaveUnsub)

        return () => {
            cleanups.forEach(fn => fn())
        }
    }

    getUIVisibility(): UIVisibilityConfig {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
        return {
            showLibrary: params.get('showLibrary') !== '0',
            showProps: params.get('showProps') !== '0',
            showTopLeft: params.get('showTopLeft') !== '0',
            showToolbar: params.get('showToolbar') !== '0',
            showTopRight: params.get('showTopRight') !== '0',
            hideProjectDialog: true, // Widget 模式不显示项目选择
        }
    }

    dispose(): void {
        this.unsubscribers.forEach(fn => fn())
        this.unsubscribers = []
        this.initResolve = null
    }
}
