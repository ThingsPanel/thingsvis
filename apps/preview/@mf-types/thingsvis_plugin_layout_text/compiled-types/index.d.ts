import type { PluginMainModule } from '@thingsvis/schema';
import { Text } from 'leafer-ui';
export declare const componentId = "layout/text";
export declare function create(): Text<{
    text: string;
    fontSize: number;
    fill: string;
}>;
export declare const Main: PluginMainModule;
export default Main;
