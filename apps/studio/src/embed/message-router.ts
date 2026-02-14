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
     */
    send(type: string, payload?: any): void {
        if (!window.parent || window.parent === window) {
            console.warn('[MessageRouter] Not in iframe, cannot send:', type)
            return
        }

        this.logOutbound(type, payload)
        window.parent.postMessage({ type, payload }, '*')
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
        console.log('Origin:', event.origin)
        console.log('Payload:', data.payload)
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
        console.log('Payload:', payload)
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
