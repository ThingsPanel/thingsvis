/**
 * Message Router — Unified postMessage Communication Center
 *
 * Phase 2: 类型安全的消息路由中心，统一管理所有 postMessage 通信。
 *
 * 职责:
 * 1. 注册/注销消息处理器 (on / off)
 * 2. 发送消息给 Host (send)
 * 3. 自动日志记录
 * 4. 消息类型枚举 (MSG_TYPES)
 *
 * 用法:
 *   import { messageRouter, MSG_TYPES } from './message-router'
 *   const unsub = messageRouter.on(MSG_TYPES.INIT, (payload) => { ... })
 *   messageRouter.send(MSG_TYPES.HOST_SAVE, exportData)
 */

// ─── 消息类型常量 ───
// Phase 3.1: 统一为 tv: 前缀

export const MSG_TYPES = {
    // Host → Guest (Editor)
    INIT: 'tv:init',
    TRIGGER_SAVE: 'tv:trigger-save',
    REQUEST_SAVE: 'tv:request-save',
    EDITOR_EVENT: 'tv:event',

    // Guest → Host
    HOST_SAVE: 'tv:save',
    READY: 'tv:ready',
    REQUEST_INIT: 'tv:request-init',

    // Viewer (Host → Guest)
    LOAD_DASHBOARD: 'LOAD_DASHBOARD',
    UPDATE_VARIABLES: 'UPDATE_VARIABLES',
    SET_TOKEN: 'SET_TOKEN',
    VIEWER_READY: 'READY',

    // Viewer (Guest → Host)
    LOADED: 'LOADED',
    ERROR: 'ERROR',

    // Internal
    PLATFORM_DATA: 'tv:platform-data',
} as const

export type MessageType = typeof MSG_TYPES[keyof typeof MSG_TYPES]

// ─── Embed 模式检测 ───
// 从 embed-mode.ts 提升为 canonical 版本
/** 检查当前页面是否运行在嵌入模式中 (URL 参数 / iframe) */
export const isEmbedMode = (): boolean => {
    try {
        const url = new URL(window.location.href)
        const fromHash = url.hash.includes('mode=embedded') || url.hash.includes('embedded=1')
        const fromQuery = url.searchParams.get('mode') === 'embedded' || url.searchParams.get('embedded') === '1'
        const inIframe = window.parent !== window
        return fromHash || fromQuery || inIframe
    } catch {
        return false
    }
}

// ─── 日志级别 ───

type LogLevel = 'verbose' | 'normal' | 'silent'

interface MessageLogEntry {
    timestamp: number
    direction: 'IN' | 'OUT'
    type: string
    payload?: unknown
    origin?: string
}

// ─── MessageRouter Class ───

export type MessageHandler = (payload: any) => void

class MessageRouter {
    private handlers = new Map<string, Set<MessageHandler>>()
    private listening = false
    private logLevel: LogLevel = 'normal'
    private messageLog: MessageLogEntry[] = []
    private readonly MAX_LOG_SIZE = 200

    /**
     * 注册消息处理器
     * @returns 取消注册的函数
     */
    on(type: string, handler: MessageHandler): () => void {
        this.ensureListener()

        const set = this.handlers.get(type) ?? new Set<MessageHandler>()
        set.add(handler)
        this.handlers.set(type, set)

        return () => {
            const current = this.handlers.get(type)
            if (!current) return
            current.delete(handler)
            if (current.size === 0) this.handlers.delete(type)
        }
    }

    /**
     * 发送消息给 Host (parent window)
     * @param extra — 附加到消息顶层的字段 (如 projectId, requestId)
     */
    send(type: string, payload?: any, extra?: Record<string, any>): void {
        if (!window.parent || window.parent === window) {
            console.warn('[MessageRouter] Not in iframe, cannot send:', type)
            return
        }

        this.logOutbound(type, payload)
        window.parent.postMessage({ type, payload, ...extra }, '*')
    }

    /**
     * 触发本地处理器 (用于内部消息桥接)
     */
    emit(type: string, payload: any): void {
        const handlers = this.handlers.get(type)
        if (!handlers) return
        handlers.forEach(handler => {
            try {
                handler(payload)
            } catch (e) {
                console.error('[MessageRouter] Handler error for', type, ':', e)
            }
        })
    }

    /**
     * 设置日志级别
     */
    setLogLevel(level: LogLevel): void {
        this.logLevel = level
    }

    /**
     * 获取最近的消息日志
     */
    getLog(): ReadonlyArray<MessageLogEntry> {
        return this.messageLog
    }

    /**
     * 清空日志
     */
    clearLog(): void {
        this.messageLog.length = 0
    }

    /**
     * 销毁路由器
     */
    dispose(): void {
        this.handlers.clear()
        this.messageLog.length = 0
    }

    // ─── 内部方法 ───

    private ensureListener(): void {
        if (this.listening) return
        this.listening = true

        window.addEventListener('message', (event: MessageEvent) => {
            const data = event.data
            if (!data || typeof data !== 'object') return

            const type = data.type as string
            if (!type) return

            // 日志
            this.logInbound(event)

            // 分发给注册的处理器
            this.emit(type, data.payload)
        })
    }

    /** 记录入站消息 */
    logInbound(event: MessageEvent): void {
        if (this.logLevel === 'silent') return

        const data = event.data
        if (!data || typeof data !== 'object') return

        const type = data.type as string
        if (!type) return

        // 仅记录 ThingsVis 相关消息
        if (!type.startsWith('tv:') &&
            !['LOAD_DASHBOARD', 'UPDATE_VARIABLES', 'SET_TOKEN', 'READY', 'LOADED', 'ERROR'].includes(type)) {
            return
        }

        const entry: MessageLogEntry = {
            timestamp: Date.now(),
            direction: 'IN',
            type,
            payload: this.logLevel === 'verbose' ? data.payload : this.summarize(data.payload),
            origin: event.origin,
        }

        this.pushLog(entry)

        console.groupCollapsed(
            `%c📥 MSG IN %c${type}`,
            'color: #4CAF50; font-weight: bold',
            'color: #81C784; font-weight: normal',
        )
        console.log('Time:', new Date(entry.timestamp).toLocaleTimeString())
        console.groupEnd()
    }

    /** 记录出站消息 */
    private logOutbound(type: string, payload?: unknown): void {
        if (this.logLevel === 'silent') return

        const entry: MessageLogEntry = {
            timestamp: Date.now(),
            direction: 'OUT',
            type,
            payload: this.logLevel === 'verbose' ? payload : this.summarize(payload),
        }

        this.pushLog(entry)

        console.groupCollapsed(
            `%c📤 MSG OUT %c${type}`,
            'color: #2196F3; font-weight: bold',
            'color: #64B5F6; font-weight: normal',
        )
        console.log('Time:', new Date(entry.timestamp).toLocaleTimeString())
        console.groupEnd()
    }

    private pushLog(entry: MessageLogEntry): void {
        this.messageLog.push(entry)
        if (this.messageLog.length > this.MAX_LOG_SIZE) {
            this.messageLog.shift()
        }
    }

    private summarize(payload: unknown): unknown {
        if (payload === null || payload === undefined) return payload
        if (typeof payload !== 'object') return payload

        const obj = payload as Record<string, unknown>
        const keys = Object.keys(obj)
        if (keys.length <= 5) return payload
        return `{${keys.slice(0, 5).join(', ')}... (${keys.length} keys)}`
    }
}

// ─── 全局单例 ───

export const messageRouter = new MessageRouter()

// ─── embed-mode.ts 合并 (Phase 5.1) ───
// 以下功能从 embed-mode.ts 合并到此文件，成为唯一的通信层

type EmbedEventName = 'init' | 'triggerSave' | string
type EmbedEventHandler = (payload: any) => void

/** 简短事件名 → 消息类型 映射 */
const EVENT_TO_MSG_TYPE: Record<string, string> = {
    'init': MSG_TYPES.INIT,
    'triggerSave': MSG_TYPES.TRIGGER_SAVE,
}

// 跟踪是否已注册 editor-event 解包器
let editorEventHandlerSetup = false

/**
 * 确保 tv:event 通用容器消息被解包为具体事件
 * 同时桥接 updateData → platformData
 */
const ensureEditorEventHandler = () => {
    if (editorEventHandlerSetup) return
    editorEventHandlerSetup = true

    messageRouter.on(MSG_TYPES.EDITOR_EVENT, (payload: any) => {
        const eventName = payload?.event || (payload?.payload && payload.payload.event)
        const eventPayload = payload
        if (eventName) {
            // 桥接: 将 editor-event 解包后重新 emit 为具体事件名
            messageRouter.emit(eventName, eventPayload)

            // 数据流桥接: updateData → platformData
            if (eventName === 'updateData') {
                const dataMap = eventPayload?.payload || eventPayload?.data || eventPayload
                if (dataMap && typeof dataMap === 'object') {
                    Object.entries(dataMap).forEach(([fieldId, value]) => {
                        window.postMessage({
                            type: MSG_TYPES.PLATFORM_DATA,
                            payload: { fieldId, value, timestamp: Date.now() }
                        }, '*')
                    })
                }
            }
        }
    })
}

/**
 * 监听 Host 事件 (替代原 embed-mode.on)
 * 支持简短事件名: on('init', handler) / on('triggerSave', handler)
 * 也支持完整消息类型: on('tv:init', handler)
 */
export const onEmbedEvent = (event: EmbedEventName, handler: EmbedEventHandler): (() => void) => {
    ensureEditorEventHandler()
    const msgType = EVENT_TO_MSG_TYPE[event] || event
    return messageRouter.on(msgType, handler)
}

/** 向 Host 发送保存数据 */
export const requestSave = (payload: any): void => {
    messageRouter.send(MSG_TYPES.HOST_SAVE, payload)
}

/** 获取初始数据 (兼容 API，总是返回 null) */
export const getInitialData = () => null

/** 获取编辑模式 */
export const getEditMode = () => (isEmbedMode() ? 'embedded' : 'standalone')

// ─── embed-init.ts 合并 (Phase 5.2) ───
// 嵌入模式初始化逻辑，从 embed-init.ts 合并

import { updateEmbeddedConfig, initSaveStrategy, type SaveTarget } from '../lib/storage/saveStrategy'
import { apiClient } from '../lib/api/client'
import { platformFieldStore } from '../lib/stores/platformFieldStore'
import { resolveEditorServiceConfig } from '../lib/embedded/service-config'

// 存储嵌入模式的 token（由宿主通过 URL 传递）
let embedToken: string | null = null

/** 配置 API Client 使用嵌入模式的 token */
export function configureEmbedApiClient(token: string, baseUrl?: string): void {
    embedToken = token
    apiClient.configure({
        getToken: () => embedToken,
    })
}

/** 获取当前嵌入模式的 token */
export function getEmbedToken(): string | null {
    return embedToken
}

export interface EmbedInitPayload {
    data?: {
        meta?: {
            id?: string
            name?: string
            version?: string
            thumbnail?: string
        }
        canvas?: {
            mode?: string
            width?: number
            height?: number
            background?: string
            gridCols?: number
            gridRowHeight?: number
            gridGap?: number
            fullWidthPreview?: boolean
            theme?: string
            gridSettings?: {
                cols?: number
                rowHeight?: number
                gap?: number
                compactVertical?: boolean
                responsive?: boolean
            }
        }
        nodes?: any[]
        dataSources?: any[]
    }
    config?: {
        saveTarget?: SaveTarget
        mode?: string
        apiConfig?: {
            baseURL?: string
        }
    }
}

export interface ProcessedEmbedData {
    projectId: string
    projectName: string
    canvas: {
        mode: string
        width: number
        height: number
        background: string
        gridCols: number
        gridRowHeight: number
        gridGap: number
        fullWidthPreview: boolean
    }
    nodes: any[]
    dataSources: any[]
    saveTarget: SaveTarget
    thumbnail?: string
}

/** 处理宿主传来的初始化数据 */
export function processEmbedInitPayload(payload: EmbedInitPayload): ProcessedEmbedData | null {
    if (!payload?.data) {
        console.warn('[EmbedInit] 无效的 payload，缺少 data')
        return null
    }

    const data = payload.data
    const config = payload.config || {}

    const projectId = data.meta?.id || `embed-${Date.now()}`
    const projectName = data.meta?.name || 'Embedded Project'
    const thumbnail = data.meta?.thumbnail
    const saveTarget: SaveTarget = config.saveTarget || 'self'

    updateEmbeddedConfig({ projectId, projectName, saveTarget })

    const canvas = {
        mode: data.canvas?.mode || 'grid',
        width: data.canvas?.width || 1920,
        height: data.canvas?.height || 1080,
        background: data.canvas?.background || '#1a1a1a',
        gridCols: data.canvas?.gridCols ?? 24,
        gridRowHeight: data.canvas?.gridRowHeight ?? 50,
        gridGap: data.canvas?.gridGap ?? 5,
        fullWidthPreview: data.canvas?.fullWidthPreview ?? false,
    }

    const nodes = (data.nodes || []).map((node: any, index: number) => ({
        id: node.id || `node-${Date.now()}-${index}`,
        type: node.type,
        position: node.position || { x: 100, y: 100 },
        size: node.size || { width: 200, height: 80 },
        props: node.props || {},
        data: node.data || [],
        thingModelBindings: node.thingModelBindings || [],
        grid: node.grid,
    }))

    return {
        projectId,
        projectName,
        canvas,
        nodes,
        dataSources: data.dataSources || [],
        saveTarget,
        thumbnail,
    }
}

/** 从 URL 参数解析嵌入配置并初始化 SaveStrategy */
export function initEmbedModeFromUrl(isAuthenticated: boolean): void {
    const hash = window.location.hash || ''
    const queryIndex = hash.indexOf('?')

    if (queryIndex >= 0) {
        const params = new URLSearchParams(hash.slice(queryIndex + 1))
        const saveTarget = params.get('saveTarget')
        const mode = params.get('mode')
        const token = params.get('token')

        if (mode === 'embedded') {
            if (token) {
                configureEmbedApiClient(token)
            } else {
                console.warn('[EmbedInit] ⚠️ 未找到 token，将使用默认认证')
            }

            initSaveStrategy({
                isAuthenticated: isAuthenticated || !!token,
                embeddedProjectId: undefined,
            })

            if (saveTarget === 'host' || saveTarget === 'self') {
                updateEmbeddedConfig({ saveTarget })
            }

            // 从 URL 加载平台字段（向后兼容）
            const serviceConfig = resolveEditorServiceConfig()
            if (serviceConfig.platformFields && serviceConfig.platformFields.length > 0) {
                platformFieldStore.setFields(serviceConfig.platformFields)
            }

            // 监听宿主端动态发送的字段更新
            onEmbedEvent('updateSchema', (eventPayload: any) => {
                const fields = eventPayload?.payload || eventPayload
                if (Array.isArray(fields) && fields.length > 0) {
                    platformFieldStore.setFields(fields)
                }
            })
        }
    }
}

// 向后兼容 Phase 0 的 messageLogger API
export const messageLogger = {
    logInbound: (event: MessageEvent) => messageRouter.logInbound(event),
    logOutbound: (type: string, payload?: unknown) => messageRouter.send(type, payload),
    getLog: () => messageRouter.getLog(),
    clearLog: () => messageRouter.clearLog(),
    setLogLevel: (level: LogLevel) => messageRouter.setLogLevel(level),
}

// 暴露到 window 以便在 DevTools Console 中调试
if (typeof window !== 'undefined') {
    ; (window as any).__tvMessageRouter = messageRouter
        ; (window as any).__tvMessageLog = messageLogger
}

