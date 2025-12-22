export const PLUGIN_LOAD_START = "plugin.load.start";
export const PLUGIN_LOAD_SUCCESS = "plugin.load.success";
export const PLUGIN_LOAD_FAILURE = "plugin.load.failure";
export const NODE_CREATED = "node.created";

export type PluginLoadStart = { remoteName: string; remoteEntryUrl: string };
export type PluginLoadSuccess = { remoteName: string; moduleInfo: any };
export type PluginLoadFailure = { remoteName: string; error: unknown };
export type NodeCreatedEvent = { nodeId: string; componentType: string };


