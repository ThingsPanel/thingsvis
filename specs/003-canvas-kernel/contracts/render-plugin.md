# Contract: Render Plugin (Kernel ↔ UI)

This contract defines how renderer plugins register with the kernel and how lifecycle and render updates are communicated.

## Plugin registration (synchronous)
- registerPlugin(pluginMeta: { pluginId: string, version?: string, capabilities?: string[] }): void

## Plugin lifecycle (host calls)
- mount(containerId: string, initialProps: Record<string, any>): { success: boolean }
- update(nodeId: string, propsPatch: Partial<Node>): { success: boolean }
- unmount(nodeId: string): { success: boolean }

## Event messages (EventBus)
- NODE_ADD { node: Node }
- NODE_UPDATE { nodeId: string, patch: Partial<Node> }
- NODE_REMOVE { nodeId: string }
- NODE_SELECT { nodeIds: string[] }
- RENDER_READY { viewId: string }
- PLUGIN_ERROR { pluginId:string, nodeId?:string, error:{message,stack?} }

## Notes
- Implementations MUST not assume synchronous DOM access; UI adapters provide mounting hooks and safe wrappers.
- All messages should follow types declared in `packages/thingsvis-schema`.


