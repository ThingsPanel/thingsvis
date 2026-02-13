/**
 * Message Router — Unified postMessage Communication Center
 *
 * Phase 0: 仅做日志 / 观测。不改现有通信逻辑。
 * Phase 2: 将替代所有直接 addEventListener('message'),
 *          成为唯一的消息收发中心。
 *
 * 统一消息格式:
 *   { type: 'tv:<action>', payload?: any, requestId?: string }
 *
 * 用法 (Phase 0):
 *   import { messageLogger } from './message-router'
 *   messageLogger.logInbound(event)   // 在现有 listener 入口调用
 *   messageLogger.logOutbound(type, payload)  // 在 postMessage 前调用
 */

// ─── 日志级别 ───
type LogLevel = 'verbose' | 'normal' | 'silent'

let logLevel: LogLevel = 'normal'

export function setLogLevel(level: LogLevel) {
    logLevel = level
}

// ─── 消息类型注册表 (Phase 2 用) ───
export type MessageDirection = 'IN' | 'OUT'

interface MessageLogEntry {
    timestamp: number
    direction: MessageDirection
    type: string
    payload?: unknown
    origin?: string
}

const messageLog: MessageLogEntry[] = []
const MAX_LOG_SIZE = 200

// ─── Phase 0: 纯日志功能 ───

/**
 * 记录入站消息 (从 Host 到 Guest)
 * 在现有 addEventListener('message', ...) 回调入口处调用
 */
function logInbound(event: MessageEvent): void {
    if (logLevel === 'silent') return

    const data = event.data
    if (!data || typeof data !== 'object') return

    // 仅记录 ThingsVis 相关消息 (避免噪音)
    const type = data.type as string
    if (!type || (!type.startsWith('thingsvis:') && !type.startsWith('tv:') &&
        !['LOAD_DASHBOARD', 'UPDATE_VARIABLES', 'SET_TOKEN', 'READY', 'LOADED', 'ERROR'].includes(type))) {
        return
    }

    const entry: MessageLogEntry = {
        timestamp: Date.now(),
        direction: 'IN',
        type,
        payload: logLevel === 'verbose' ? data.payload : summarize(data.payload),
        origin: event.origin,
    }

    pushLog(entry)

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

/**
 * 记录出站消息 (从 Guest 到 Host)
 * 在 window.parent.postMessage 调用前调用
 */
function logOutbound(type: string, payload?: unknown): void {
    if (logLevel === 'silent') return

    const entry: MessageLogEntry = {
        timestamp: Date.now(),
        direction: 'OUT',
        type,
        payload: logLevel === 'verbose' ? payload : summarize(payload),
    }

    pushLog(entry)

    console.groupCollapsed(
        `%c📤 MSG OUT %c${type}`,
        'color: #2196F3; font-weight: bold',
        'color: #64B5F6; font-weight: normal',
    )
    console.log('Payload:', payload)
    console.log('Time:', new Date(entry.timestamp).toLocaleTimeString())
    console.groupEnd()
}

/**
 * 获取最近的消息日志 (用于调试)
 */
function getLog(): ReadonlyArray<MessageLogEntry> {
    return messageLog
}

/**
 * 清空日志
 */
function clearLog(): void {
    messageLog.length = 0
}

// ─── 内部工具函数 ───

function pushLog(entry: MessageLogEntry): void {
    messageLog.push(entry)
    if (messageLog.length > MAX_LOG_SIZE) {
        messageLog.shift()
    }
}

/** 生成 payload 的简要摘要 (避免打印巨大对象) */
function summarize(payload: unknown): unknown {
    if (payload === null || payload === undefined) return payload
    if (typeof payload !== 'object') return payload

    const obj = payload as Record<string, unknown>
    const keys = Object.keys(obj)

    if (keys.length <= 5) return payload

    // 超过 5 个 key 只显示 key 列表
    return `{${keys.slice(0, 5).join(', ')}... (${keys.length} keys)}`
}

// ─── 导出 ───

export const messageLogger = {
    logInbound,
    logOutbound,
    getLog,
    clearLog,
    setLogLevel,
}

// 暴露到 window 以便在 DevTools Console 中调试
if (typeof window !== 'undefined') {
    ; (window as any).__tvMessageLog = messageLogger
}
