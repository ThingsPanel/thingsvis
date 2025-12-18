import type { PluginMainModule } from '@thingsvis/schema';
import { Image } from 'leafer-ui';
export declare const componentId = "media/image";
export declare function create(): Image<{
    url: string;
    width: number;
    height: number;
}>;
export declare const Main: PluginMainModule;
export default Main;
