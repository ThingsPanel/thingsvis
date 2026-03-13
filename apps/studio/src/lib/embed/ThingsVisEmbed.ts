/**
 * ThingsVisEmbed SDK
 *
 * Placeholder module for the embed SDK. This will be implemented
 * when the embed feature is built out.
 */

export interface ThingsVisEmbedOptions {
  /** Target container element or selector */
  container: HTMLElement | string;
  /** Project ID to load */
  projectId?: string;
  /** Authentication token */
  token?: string;
  /** Base URL for the API */
  baseUrl?: string;
}

export type EmbedEvent = 'ready' | 'error' | 'save' | 'load' | 'change';

export interface EmbedEventData {
  type: EmbedEvent;
  payload?: unknown;
}

export class ThingsVisEmbed {
  private options: ThingsVisEmbedOptions;

  constructor(options: ThingsVisEmbedOptions) {
    this.options = options;
  }

  /** Initialize the embed instance */
  init(): void {
    // Placeholder \u2014 will be implemented when embed SDK is built
    void this.options;
  }

  /** Destroy the embed instance and clean up resources */
  destroy(): void {
    // Placeholder
  }

  /** Listen for embed events */
  on(_event: EmbedEvent, _handler: (data: EmbedEventData) => void): void {
    // Placeholder
  }

  /** Remove event listener */
  off(_event: EmbedEvent, _handler: (data: EmbedEventData) => void): void {
    // Placeholder
  }
}
