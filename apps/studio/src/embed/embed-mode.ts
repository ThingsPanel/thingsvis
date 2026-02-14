
import { messageRouter, MSG_TYPES, isEmbedMode } from './message-router'

// Re-export isEmbedMode as canonical source is now message-router.ts
export { isEmbedMode }

/**
 * Embed Mode Communication Layer
 *
 * Phase 2: 现在委托给 MessageRouter 统一管理。
 * 保留 API 签名以与现有消费者兼容 (Editor.tsx, EditorShell.tsx)。
 *
 * 职责:
 * 1. isEmbedMode() — 检测是否在嵌入模式 (re-export from message-router)
 * 2. on() — 注册 Host 事件处理器 (委托给 messageRouter)
 * 3. requestSave() — 发送保存数据给 Host
 */

type EmbedEventName = 'init' | 'triggerSave' | string
type EmbedEventHandler = (payload: any) => void

// ─── 事件名 → 消息类型 映射 ───
const EVENT_TO_MSG_TYPE: Record<string, string> = {
  'init': MSG_TYPES.INIT,
  'triggerSave': MSG_TYPES.TRIGGER_SAVE,
}

// 跟踪是否已注册 editor-event 解包器
let editorEventHandlerSetup = false

/**
 * 确保 editor-event 通用容器消息被解包为具体事件
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

      // 🆕 数据流桥接: updateData → platformData
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
 * 监听 Host 事件
 * 保持与原 API 兼容: on('init', handler) / on('triggerSave', handler) / on('updateSchema', handler)
 */
export const on = (event: EmbedEventName, handler: EmbedEventHandler): (() => void) => {
  ensureEditorEventHandler()

  // 将简短事件名映射到消息类型
  const msgType = EVENT_TO_MSG_TYPE[event] || event
  return messageRouter.on(msgType, handler)
}

/**
 * 向 Host 发送保存数据
 */
export const requestSave = (payload: any): void => {
  messageRouter.send(MSG_TYPES.HOST_SAVE, payload)
}

// 辅助函数，保持兼容性
export const getInitialData = () => null
export const getEditMode = () => (isEmbedMode() ? 'embedded' : 'standalone')
