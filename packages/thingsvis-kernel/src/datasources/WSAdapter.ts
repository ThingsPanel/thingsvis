import { DataSource, WSConfigSchema, WSConfig, HeartbeatConfig, DEFAULT_RECONNECT_POLICY, DEFAULT_HEARTBEAT_CONFIG } from '@thingsvis/schema';
import { BaseAdapter } from './BaseAdapter';
import { 
  calculateReconnectDelay, 
  shouldReconnect, 
  getEffectiveReconnectPolicy,
  WSConnectionState,
  WSConnectionStatus,
  createInitialStatus,
  createReconnectingStatus,
  createConnectedStatus,
  createFailedStatus,
} from './ws-utils';

/**
 * WSAdapter: Handles real-time data via WebSockets.
 * 
 * Enhanced with:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat/keep-alive messages
 * - Initial subscription messages on connect
 */
export class WSAdapter extends BaseAdapter {
  private socket?: WebSocket;
  private wsConfig?: WSConfig;
  
  // Reconnection state
  private reconnectAttempt: number = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private isIntentionalClose: boolean = false;
  
  // Heartbeat state
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  
  // Connection status for UI
  private connectionStatus: WSConnectionStatus = createInitialStatus();

  constructor() {
    super('WS');
  }

  /**
   * Get current connection status (for UI display)
   */
  public getConnectionStatus(): WSConnectionStatus {
    return { ...this.connectionStatus };
  }

  public async connect(config: DataSource): Promise<void> {
    this.config = config;
    this.wsConfig = WSConfigSchema.parse(config.config);
    this.isIntentionalClose = false;
    this.reconnectAttempt = 0;

    return this.createConnection();
  }

  /**
   * Create WebSocket connection
   */
  private createConnection(): Promise<void> {
    const wsConfig = this.wsConfig!;
    
    return new Promise((resolve, reject) => {
      try {
        this.updateStatus({ state: 'connecting' });
        this.socket = new WebSocket(wsConfig.url, wsConfig.protocols);

        this.socket.onopen = () => {
          console.log(`[WSAdapter] Connected to ${wsConfig.url}`);
          this.reconnectAttempt = 0;
          this.updateStatus(createConnectedStatus());
          
          // Send initial messages
          this.sendInitMessages();
          
          // Start heartbeat
          this.startHeartbeat();
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const rawData = JSON.parse(event.data);
            this.emitData(rawData);
          } catch (e) {
            // If not JSON, emit as string
            this.emitData(event.data);
          }
        };

        this.socket.onerror = (error) => {
          console.error(`[WSAdapter] Error:`, error);
          this.emitError(error);
          // Don't reject here - let onclose handle reconnection
        };

        this.socket.onclose = (event) => {
          console.log(`[WSAdapter] Closed connection to ${wsConfig.url}`, event.code, event.reason);
          
          // Stop heartbeat
          this.stopHeartbeat();
          
          // Attempt reconnection if not intentional
          if (!this.isIntentionalClose) {
            this.attemptReconnect();
          }
        };
      } catch (e) {
        this.updateStatus(createFailedStatus((e as Error).message));
        reject(e);
      }
    });
  }

  /**
   * Send initial subscription messages
   */
  private sendInitMessages(): void {
    const initMessages = this.wsConfig?.initMessages ?? [];
    for (const message of initMessages) {
      try {
        this.socket?.send(message);
        console.log(`[WSAdapter] Sent init message:`, message);
      } catch (e) {
        console.error(`[WSAdapter] Failed to send init message:`, e);
      }
    }
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    const heartbeat = this.wsConfig?.heartbeat ?? DEFAULT_HEARTBEAT_CONFIG;
    
    if (!heartbeat.enabled) {
      return;
    }

    const intervalMs = heartbeat.interval * 1000;
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(heartbeat.message);
          console.log(`[WSAdapter] Sent heartbeat:`, heartbeat.message);
        } catch (e) {
          console.error(`[WSAdapter] Heartbeat failed:`, e);
        }
      }
    }, intervalMs);
    
    console.log(`[WSAdapter] Heartbeat started (interval: ${heartbeat.interval}s)`);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
      console.log(`[WSAdapter] Heartbeat stopped`);
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnect(): void {
    const policy = getEffectiveReconnectPolicy(this.wsConfig!);
    
    if (!shouldReconnect(this.reconnectAttempt, policy)) {
      console.log(`[WSAdapter] Max reconnection attempts reached`);
      this.updateStatus(createFailedStatus('Max reconnection attempts reached'));
      return;
    }

    const delay = calculateReconnectDelay(this.reconnectAttempt, policy);
    this.reconnectAttempt++;
    
    this.updateStatus(createReconnectingStatus(this.reconnectAttempt, policy.maxAttempts));
    console.log(`[WSAdapter] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${policy.maxAttempts || '∞'})`);

    this.reconnectTimer = setTimeout(() => {
      this.createConnection().catch((e) => {
        console.error(`[WSAdapter] Reconnection failed:`, e);
      });
    }, delay);
  }

  /**
   * Update connection status and notify listeners
   */
  private updateStatus(status: Partial<WSConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...status };
    // Could emit a status event here for UI updates
  }

  public async disconnect(): Promise<void> {
    this.isIntentionalClose = true;
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.stopHeartbeat();
    
    // Close socket
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    
    this.updateStatus(createInitialStatus());
    this.reconnectAttempt = 0;
    this.wsConfig = undefined;
  }
}

