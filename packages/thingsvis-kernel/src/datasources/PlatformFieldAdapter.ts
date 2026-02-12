import { BaseAdapter } from './BaseAdapter';
import type { DataSource, PlatformFieldConfig } from '@thingsvis/schema';

/**
 * Platform Field Adapter
 * Adapts platform-provided fields (e.g., ThingsPanel device attributes/telemetry)
 * to ThingsVis data source format
 */
export class PlatformFieldAdapter extends BaseAdapter {
    private fieldMappings: Record<string, string> = {};
    private platformDataCache: Map<string, any> = new Map();
    private messageListener: ((event: MessageEvent) => void) | null = null;

    constructor() {
        super('PLATFORM_FIELD');
    }

    async connect(config: DataSource): Promise<void> {
        if (config.type !== 'PLATFORM_FIELD') {
            throw new Error('PlatformFieldAdapter requires PLATFORM_FIELD type');
        }

        this.config = config;
        const platformConfig = config.config as PlatformFieldConfig;
        this.fieldMappings = platformConfig.fieldMappings;

        // Subscribe to platform data push
        this.subscribeToHostData();

        // Request initial data from host
        this.requestInitialData();
    }

    /**
     * Subscribe to platform data updates via postMessage
     */
    private subscribeToHostData() {
        this.messageListener = (event: MessageEvent) => {
            // Security: In production, verify event.origin
            if (event.data.type === 'thingsvis:platformData') {
                const { fieldId, value, timestamp } = event.data.payload;

                // Debug log
                console.log('[PlatformAdapter] 📥 Received:', fieldId, value);

                // Cache the field data
                this.platformDataCache.set(fieldId, {
                    value,
                    timestamp: timestamp || Date.now(),
                });

                // Trigger data update
                this.updateData();
            }
        };

        window.addEventListener('message', this.messageListener);
    }

    // ... (requestInitialData omitted)

    /**
     * Update component data based on field mappings
     */
    private updateData() {
        // Map platform field data to component properties
        const mappedData: Record<string, any> = {};

        console.log('[PlatformAdapter] 🔄 Mappings:', JSON.stringify(this.fieldMappings));

        for (const [componentProp, fieldId] of Object.entries(this.fieldMappings)) {
            const fieldData = this.platformDataCache.get(fieldId);
            if (fieldData) {
                mappedData[componentProp] = fieldData.value;
            }
        }

        console.log('[PlatformAdapter] 📤 Emitting:', mappedData);

        // Emit data update event using BaseAdapter method
        this.emitData(mappedData);
    }

    /**
     * Manually set field data (for testing or runtime updates)
     */
    public setFieldData(fieldId: string, value: any) {
        this.platformDataCache.set(fieldId, {
            value,
            timestamp: Date.now(),
        });
        this.updateData();
    }

    /**
     * Get current cached data
     */
    public getCachedData(): Record<string, any> {
        const data: Record<string, any> = {};
        for (const [prop, fieldId] of Object.entries(this.fieldMappings)) {
            const fieldData = this.platformDataCache.get(fieldId);
            if (fieldData) {
                data[prop] = fieldData.value;
            }
        }
        return data;
    }

    async disconnect(): Promise<void> {
        // Remove message listener
        if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
            this.messageListener = null;
        }

        // Clear cache
        this.platformDataCache.clear();
    }
}
