declare module '@module-federation/runtime' {
  export type FederationHost = {
    registerRemotes: (remotes: Array<{ name: string; entry: string }>, options?: { force?: boolean }) => void;
  };

  export function init(options: { name: string; remotes: Array<{ name: string; entry: string }> }): FederationHost;

  export function loadRemote<T = unknown>(id: string): Promise<T | null>;
}


