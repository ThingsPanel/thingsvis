declare module 'ezuikit-js' {
  export class EZUIKitPlayer {
    constructor(options: Record<string, unknown>);
    destroy?: () => void;
    stop?: () => Promise<unknown>;
    play?: () => Promise<unknown>;
    changePlayUrl?: (options: Record<string, unknown>) => Promise<unknown>;
    changeTheme?: (template: string) => void;
    resize?: (width: number | string, height: number | string) => void;
  }

  const EZUIKit: {
    EZUIKitPlayer: typeof EZUIKitPlayer;
  };

  export default EZUIKit;
}
