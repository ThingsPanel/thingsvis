
    export type RemoteKeys = 'thingsvis_plugin_basic_switch/Main';
    type PackageType<T> = T extends 'thingsvis_plugin_basic_switch/Main' ? typeof import('thingsvis_plugin_basic_switch/Main') :any;