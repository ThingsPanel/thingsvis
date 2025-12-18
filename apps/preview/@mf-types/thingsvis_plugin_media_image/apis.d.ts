
    export type RemoteKeys = 'thingsvis_plugin_media_image/Main';
    type PackageType<T> = T extends 'thingsvis_plugin_media_image/Main' ? typeof import('thingsvis_plugin_media_image/Main') :any;