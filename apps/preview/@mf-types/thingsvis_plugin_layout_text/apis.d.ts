
    export type RemoteKeys = 'thingsvis_plugin_layout_text/Main';
    type PackageType<T> = T extends 'thingsvis_plugin_layout_text/Main' ? typeof import('thingsvis_plugin_layout_text/Main') :any;