type EmbedEventName = 'init' | 'triggerSave' | string

type EmbedEventHandler = (payload: any) => void

type EmbedEventMessage =
  | { type: 'thingsvis:editor-event'; event: EmbedEventName; payload?: any }
  | { type: 'thingsvis:editor-init'; payload?: any }
  | { type: 'thingsvis:editor-trigger-save'; payload?: any }

const listeners = new Map<EmbedEventName, Set<EmbedEventHandler>>()
let initialData: any = null
let listening = false

const ensureListener = () => {
  if (listening) return
  listening = true
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as EmbedEventMessage | undefined
    if (!data || typeof data !== 'object') return

    if (data.type === 'thingsvis:editor-event') {
      emit(data.event, data.payload)
      if (data.event === 'init') {
        initialData = data.payload
      }
      return
    }

    if (data.type === 'thingsvis:editor-init') {
      initialData = data.payload
      emit('init', data.payload)
      return
    }

    if (data.type === 'thingsvis:editor-trigger-save') {
      emit('triggerSave', data.payload)
    }
  })
}

const emit = (event: EmbedEventName, payload: any) => {
  const handlers = listeners.get(event)
  if (!handlers) return
  handlers.forEach((handler) => {
    try {
      handler(payload)
    } catch {
      // swallow handler errors to avoid breaking host messaging
    }
  })
}

export const isEmbedMode = (): boolean => {
  try {
    const hash = window.location.hash || ''
    const queryIndex = hash.indexOf('?')
    const params = queryIndex >= 0 ? new URLSearchParams(hash.slice(queryIndex + 1)) : null
    const embedded = params?.get('embedded')
    const mode = params?.get('mode')
    if (embedded === '1' || embedded === 'true' || mode === 'embedded') return true
  } catch {}

  try {
    const url = new URL(window.location.href)
    const embedded = url.searchParams.get('embedded')
    const mode = url.searchParams.get('mode')
    return embedded === '1' || embedded === 'true' || mode === 'embedded'
  } catch {}

  return false
}

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

export const requestSave = (payload: any) => {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'thingsvis:host-save', payload }, '*')
    return
  }

  if ((window as any).hostSave) {
    try {
      ;(window as any).hostSave(payload)
      return
    } catch {}
  }
}

export const getInitialData = () => initialData

export const getEditMode = () => (isEmbedMode() ? 'embedded' : 'standalone')
