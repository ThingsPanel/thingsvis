import type { ProjectFile } from '../storage/schemas'

export type WebChartConfig = {
  schemaVersion: '1.0.0'
  meta: {
    projectId: string
    name: string
    createdAt: number
    updatedAt: number
    externalId?: string
  }
  canvas: ProjectFile['canvas']
  nodes: ProjectFile['nodes']
  dataSources: ProjectFile['dataSources']
}

type HostSaveHandler = (payload: WebChartConfig) => void | Promise<void>

type HostWindow = Window & {
  hostSave?: HostSaveHandler
}

const getHashParams = (): URLSearchParams | null => {
  try {
    const hash = window.location.hash || ''
    const queryIndex = hash.indexOf('?')
    if (queryIndex === -1) return null
    return new URLSearchParams(hash.slice(queryIndex + 1))
  } catch {
    return null
  }
}

const getParam = (key: string): string | null => {
  const hashParams = getHashParams()
  if (hashParams?.has(key)) return hashParams.get(key)
  try {
    const url = new URL(window.location.href)
    return url.searchParams.get(key)
  } catch {
    return null
  }
}

export const isEmbeddedMode = (): boolean => {
  const embedded = getParam('embedded')
  const mode = getParam('mode')
  return embedded === '1' || embedded === 'true' || mode === 'embedded'
}

export const resolveExternalId = (): string | undefined => {
  return (
    getParam('externalId') ||
    getParam('hostId') ||
    getParam('integrationId') ||
    undefined
  )
}

export const toWebChartConfig = (
  project: ProjectFile,
  externalId?: string
): WebChartConfig => ({
  schemaVersion: '1.0.0',
  meta: {
    projectId: project.meta.id,
    name: project.meta.name,
    createdAt: project.meta.createdAt,
    updatedAt: project.meta.updatedAt,
    ...(externalId ? { externalId } : {}),
  },
  canvas: project.canvas,
  nodes: project.nodes,
  dataSources: project.dataSources,
})

export const saveToHost = async (payload: WebChartConfig): Promise<void> => {
  const host = window as HostWindow
  if (host.hostSave) {
    await host.hostSave(payload)
    return
  }

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'tv:save', payload }, '*')
    return
  }

  throw new Error('No host save handler found')
}

/**
 * Request save to host platform (new protocol)
 * Returns a promise that resolves when host responds
 */
export const requestSaveToHost = async (payload: {
  canvasConfig: any
  nodes: any[]
  dataSources: any[]
}): Promise<{ success: boolean; data?: any; error?: any }> => {
  return new Promise((resolve) => {
    const requestId = Date.now().toString()

    // Register one-time response listener
    const handleResponse = (event: MessageEvent) => {
      if (event.data.type === 'tv:save-response' && event.data.requestId === requestId) {
        window.removeEventListener('message', handleResponse)
        resolve(event.data.payload)
      }
    }

    window.addEventListener('message', handleResponse)

    // Send save request
    window.parent.postMessage({
      type: 'tv:request-save',
      requestId,
      payload
    }, '*')

    // Timeout after 30 seconds
    setTimeout(() => {
      window.removeEventListener('message', handleResponse)
      resolve({ success: false, error: { message: 'Save request timeout' } })
    }, 30000)
  })
}

