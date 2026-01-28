/**
 * Platform Data Store
 * A simple global store for platform field data pushed from host applications.
 * This allows PropertyResolver to access platform data for {{ platform.xxx }} expressions.
 */

export type PlatformFieldValue = {
    value: any;
    timestamp: number;
};

class PlatformDataStoreClass {
    private data: Map<string, PlatformFieldValue> = new Map();
    private listeners: Set<() => void> = new Set();
    private messageListener: ((event: MessageEvent) => void) | null = null;

    // Cached snapshot for useSyncExternalStore compatibility
    private cachedSnapshot: Record<string, any> = {};
    private version: number = 0;

    constructor() {
        // Automatically subscribe to platform data messages
        this.subscribeToMessages();
    }

    /**
     * Subscribe to platform data updates via postMessage
     */
    private subscribeToMessages() {
        if (typeof window === 'undefined') return;

        console.log('🚀 [PlatformDataStore] Subscribing to postMessage...');

        this.messageListener = (event: MessageEvent) => {
            // Debug: log all incoming messages
            if (event.data?.type?.startsWith('thingsvis:')) {
                console.log('📨 [PlatformDataStore] Received message:', event.data);
            }

            if (event.data?.type === 'thingsvis:platformData') {
                const { fieldId, value, timestamp } = event.data.payload || {};
                console.log(`✅ [PlatformDataStore] Platform data: ${fieldId} = ${value}`);
                if (fieldId !== undefined) {
                    this.set(fieldId, value, timestamp);
                }
            }
        };

        window.addEventListener('message', this.messageListener);
        console.log('✅ [PlatformDataStore] Message listener registered');
    }

    /**
     * Set a platform field value
     */
    set(fieldId: string, value: any, timestamp?: number) {
        console.log(`📝 [PlatformDataStore] Setting ${fieldId} = ${value}, listeners: ${this.listeners.size}`);
        this.data.set(fieldId, {
            value,
            timestamp: timestamp ?? Date.now(),
        });
        this.updateSnapshot();
        this.notifyListeners();
    }

    /**
     * Get a platform field value
     */
    get(fieldId: string): any {
        return this.data.get(fieldId)?.value;
    }

    /**
     * Update the cached snapshot when data changes
     */
    private updateSnapshot() {
        const result: Record<string, any> = {};
        this.data.forEach((fieldData, fieldId) => {
            result[fieldId] = fieldData.value;
        });
        this.cachedSnapshot = result;
        this.version++;
    }

    /**
     * Get all platform field data as an object
     * Returns a cached object for useSyncExternalStore compatibility
     */
    getAll(): Record<string, any> {
        return this.cachedSnapshot;
    }

    /**
     * Get the current version number (used for change detection)
     */
    getVersion(): number {
        return this.version;
    }

    /**
     * Subscribe to data changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener());
    }

    /**
     * Clear all data
     */
    clear() {
        this.data.clear();
        this.updateSnapshot();
        this.notifyListeners();
    }

    /**
     * Cleanup message listener
     */
    destroy() {
        if (this.messageListener && typeof window !== 'undefined') {
            window.removeEventListener('message', this.messageListener);
            this.messageListener = null;
        }
        this.data.clear();
        this.listeners.clear();
    }
}

// Singleton instance
export const PlatformDataStore = new PlatformDataStoreClass();
