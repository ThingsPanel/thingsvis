
/**
 * Embed Mode Communication Layer
 * 
 * 极简版 PostMessage 通信封装
 * 只负责:
 * 1. 监听 Host 消息 (init, triggerSave, event)
 * 2. 发送 Host 消息 (host-save)
 */

type EmbedEventName = 'init' | 'triggerSave' | string
type EmbedEventHandler = (payload: any) => void

interface EmbedEventMessage {
  type: string;
  payload?: any;
  event?: string; // 兼容旧协议 { type: 'thingsvis:editor-event', event: '...' }
}

const listeners = new Map<EmbedEventName, Set<EmbedEventHandler>>()
let listening = false

const ensureListener = () => {
  if (listening) return
  listening = true

  window.addEventListener('message', (event: MessageEvent) => {
    // 简单的协议解析
    const data = event.data as EmbedEventMessage | undefined
    if (!data || typeof data !== 'object') return

    // 1. Init (loadWidgetConfig)
    if (data.type === 'thingsvis:editor-init') {
      emit('init', data.payload)
      return
    }

    // 2. Trigger Save (triggerSave)
    if (data.type === 'thingsvis:editor-trigger-save') {
      emit('triggerSave', data.payload)
      return
    }

    // 3. Generic Event (pushData, updateSchema)
    if (data.type === 'thingsvis:editor-event') {
      // 兼容 payload.event 或者是 data.event
      const eventName = data.event || (data.payload && data.payload.event)
      const eventPayload = data.payload
      if (eventName) {
        emit(eventName, eventPayload)
      }
      return
    }
  })
}

const emit = (event: EmbedEventName, payload: any) => {
  const handlers = listeners.get(event)
  if (!handlers) return
  handlers.forEach((handler) => {
    try {
      handler(payload)
    } catch (e) {
      console.error('[EmbedMode] Handler error:', e)
    }
  })
}

/**
 * 判断当前是否处于嵌入模式
 * 只要在 Iframe 中，或者 URL 显式指定，都视为嵌入模式
 */
export const isEmbedMode = (): boolean => {
  try {
    const url = new URL(window.location.href)
    // 支持 hash 参数和 query 参数
    const fromHash = url.hash.includes('mode=embedded') || url.hash.includes('embedded=1')
    const fromQuery = url.searchParams.get('mode') === 'embedded' || url.searchParams.get('embedded') === '1'

    // 检查是否在 Iframe 中
    const inIframe = window.parent !== window

    return fromHash || fromQuery || inIframe
  } catch {
    return false
  }
}

/**
 * 监听 Host 事件
 */
export const on = (event: EmbedEventName, handler: EmbedEventHandler) => {
  ensureListener()
  const set = listeners.get(event) ?? new Set<EmbedEventHandler>()
  set.add(handler)
  listeners.set(event, set)
  return () => {
    const next = listeners.get(event)
    if (!next) return
    next.delete(handler)
    if (next.size === 0) listeners.delete(event)
  }
}

/**
 * 向 Host 发送保存数据
 */
export const requestSave = (payload: any) => {
  if (window.parent && window.parent !== window) {
    // 使用标准的 message type
    window.parent.postMessage({ type: 'thingsvis:host-save', payload }, '*')
  } else {
    console.warn('[EmbedMode] Not in iframe, cannot request save to host')
  }
}

// 辅助函数，保持兼容性
export const getInitialData = () => null
export const getEditMode = () => (isEmbedMode() ? 'embedded' : 'standalone')
