/**
 * ThingsVis Embed SDK
 * 
 * Provides an easy-to-use API for embedding ThingsVis dashboards in external applications.
 * 
 * Usage:
 * ```javascript
 * import { ThingsVisEmbed } from '@thingsvis/embed-sdk';
 * 
 * const embed = new ThingsVisEmbed({
 *   container: '#dashboard',
 *   baseUrl: 'https://your-thingsvis-instance.com',
 * });
 * 
 * // Load by ID (requires authentication)
 * await embed.loadDashboard('dashboard-id', { token: 'jwt-token' });
 * 
 * // Or load by schema
 * await embed.loadSchema({
 *   canvas: { mode: 'fixed', width: 1920, height: 1080 },
 *   nodes: [...],
 *   dataSources: [...],
 * });
 * 
 * // Update variables
 * embed.setVariables({ temperature: 25, humidity: 60 });
 * 
 * // Listen for events
 * embed.on('loaded', (data) => console.log('Dashboard loaded:', data));
 * embed.on('error', (error) => console.error('Error:', error));
 * ```
 */

export interface ThingsVisEmbedOptions {
  /** Container element or selector */
  container: HTMLElement | string;
  /** Base URL of ThingsVis instance */
  baseUrl?: string;
  /** Initial authentication token */
  token?: string;
  /** Dashboard ID to load initially */
  dashboardId?: string;
  /** Initial schema to load */
  schema?: any;
  /** Custom styles for the iframe */
  style?: Partial<CSSStyleDeclaration>;
}

export type EmbedEvent = 'ready' | 'loaded' | 'error';

export interface EmbedEventData {
  ready: void;
  loaded: { id?: string; name?: string };
  error: string;
}

export class ThingsVisEmbed {
  private iframe: HTMLIFrameElement;
  private baseUrl: string;
  private token: string | null = null;
  private listeners: Map<EmbedEvent, Set<(data: any) => void>> = new Map();
  private ready = false;
  private pendingMessages: any[] = [];

  constructor(options: ThingsVisEmbedOptions) {
    this.baseUrl = options.baseUrl || 'http://localhost:5173';
    this.token = options.token || null;
    
    // Get container element
    const container = typeof options.container === 'string'
      ? document.querySelector(options.container) as HTMLElement
      : options.container;
    
    if (!container) {
      throw new Error('Container element not found');
    }

    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.width = '100%';
    this.iframe.style.height = '100%';
    this.iframe.style.border = 'none';
    
    // Apply custom styles
    if (options.style) {
      Object.assign(this.iframe.style, options.style);
    }

    // Build URL
    let url = `${this.baseUrl}/#/embed`;
    const params = new URLSearchParams();
    
    if (options.dashboardId) {
      params.set('id', options.dashboardId);
    }
    if (this.token) {
      params.set('token', this.token);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    this.iframe.src = url;
    
    // Listen for messages
    window.addEventListener('message', this.handleMessage.bind(this));
    
    // Append to container
    container.appendChild(this.iframe);

    // Load schema if provided
    if (options.schema) {
      this.loadSchema(options.schema);
    }
  }

  private handleMessage(event: MessageEvent) {
    // Verify origin
    if (event.origin !== new URL(this.baseUrl).origin) {
      return;
    }

    const message = event.data;
    
    switch (message.type) {
      case 'READY':
        this.ready = true;
        this.emit('ready', undefined);
        // Send pending messages
        this.pendingMessages.forEach(msg => this.postMessage(msg));
        this.pendingMessages = [];
        break;
      case 'LOADED':
        this.emit('loaded', message.payload);
        break;
      case 'ERROR':
        this.emit('error', message.payload);
        break;
    }
  }

  private postMessage(message: any) {
    if (!this.ready) {
      this.pendingMessages.push(message);
      return;
    }
    
    this.iframe.contentWindow?.postMessage(message, this.baseUrl);
  }

  private emit<E extends EmbedEvent>(event: E, data: EmbedEventData[E]) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  /**
   * Subscribe to an event
   */
  on<E extends EmbedEvent>(event: E, callback: (data: EmbedEventData[E]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Load a dashboard by ID
   */
  async loadDashboard(id: string, options?: { token?: string }): Promise<void> {
    if (options?.token) {
      this.setToken(options.token);
    }
    
    // Reload iframe with new URL
    let url = `${this.baseUrl}/#/embed?id=${id}`;
    if (this.token) {
      url += `&token=${encodeURIComponent(this.token)}`;
    }
    
    this.iframe.src = url;
  }

  /**
   * Load a dashboard from schema data
   */
  loadSchema(schema: any): void {
    this.postMessage({
      type: 'LOAD_DASHBOARD',
      payload: schema,
    });
  }

  /**
   * Update variables in the dashboard
   */
  setVariables(variables: Record<string, any>): void {
    this.postMessage({
      type: 'UPDATE_VARIABLES',
      payload: variables,
    });
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
    this.postMessage({
      type: 'SET_TOKEN',
      payload: token,
    });
  }

  /**
   * Destroy the embed instance
   */
  destroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
    this.iframe.remove();
    this.listeners.clear();
  }
}

export default ThingsVisEmbed;
