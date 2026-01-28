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

    constructor() {
        // Automatically subscribe to platform data messages
        this.subscribeToMessages();
    }

    /**
     * Subscribe to platform data updates via postMessage
     */
    private subscribeToMessages() {
        if (typeof window === 'undefined') return;

        this.messageListener = (event: MessageEvent) => {
            if (event.data?.type === 'thingsvis:platformData') {
                const { fieldId, value, timestamp } = event.data.payload || {};
                if (fieldId !== undefined) {
                    this.set(fieldId, value, timestamp);
                }
            }
        };

        window.addEventListener('message', this.messageListener);
    }

    /**
     * Set a platform field value
     */
    set(fieldId: string, value: any, timestamp?: number) {
        this.data.set(fieldId, {
            value,
            timestamp: timestamp ?? Date.now(),
        });
        this.notifyListeners();
    }

    /**
     * Get a platform field value
     */
    get(fieldId: string): any {
        return this.data.get(fieldId)?.value;
    }

    /**
     * Get all platform field data as an object
     * This is used by PropertyResolver for {{ platform.xxx }} expressions
     */
    getAll(): Record<string, any> {
        const result: Record<string, any> = {};
        this.data.forEach((fieldData, fieldId) => {
            result[fieldId] = fieldData.value;
        });
        return result;
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
