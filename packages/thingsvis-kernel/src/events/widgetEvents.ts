export const WIDGET_LOAD_START = 'widget.load.start';
export const WIDGET_LOAD_SUCCESS = 'widget.load.success';
export const WIDGET_LOAD_FAILURE = 'widget.load.failure';
export const NODE_CREATED = 'node.created';

export type PluginLoadStart = { remoteName: string; remoteEntryUrl: string };
export type PluginLoadSuccess = { remoteName: string; moduleInfo: unknown };
export type PluginLoadFailure = { remoteName: string; error: unknown };
export type NodeCreatedEvent = { nodeId: string; componentType: string };
