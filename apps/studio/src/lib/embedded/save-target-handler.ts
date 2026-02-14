import type { SaveTarget } from './service-config';

export interface SavePayload {
    canvasConfig: any;
    nodes: any[];
    dataSources: any[];
}

export interface SaveResult {
    success: boolean;
    data?: any;
    error?: Error;
}

/**
 * SaveTargetHandler
 * Routes save requests to either ThingsVis backend or host platform
 */
export class SaveTargetHandler {
    private saveTarget: SaveTarget;

    constructor(saveTarget: SaveTarget = 'self') {
        this.saveTarget = saveTarget;
    }

    async save(payload: SavePayload): Promise<SaveResult> {
        if (this.saveTarget === 'host') {
            return this.saveToHost(payload);
        } else {
            return this.saveToSelf(payload);
        }
    }

    /**
     * Save to host platform via postMessage
     */
    private async saveToHost(payload: SavePayload): Promise<SaveResult> {
        return new Promise((resolve) => {
            const requestId = Date.now().toString();

            // Register one-time response listener
            const handleResponse = (event: MessageEvent) => {
                if (event.data.type === 'tv:save-response' && event.data.requestId === requestId) {
                    window.removeEventListener('message', handleResponse);

                    const { success, data, error } = event.data.payload;
                    resolve({
                        success,
                        data,
                        error: error ? new Error(error.message || error) : undefined
                    });
                }
            };

            window.addEventListener('message', handleResponse);

            // Send save request to host
            window.parent.postMessage({
                type: 'tv:request-save',
                requestId,
                payload
            }, '*');

            // Timeout handling (30 seconds)
            setTimeout(() => {
                window.removeEventListener('message', handleResponse);
                resolve({
                    success: false,
                    error: new Error('Save request timeout (30s)')
                });
            }, 30000);
        });
    }

    /**
     * Save to ThingsVis backend
     */
    private async saveToSelf(payload: SavePayload): Promise<SaveResult> {
        try {
            // TODO: Implement ThingsVis API call when backend is ready

            // For now, save to localStorage as fallback
            const key = `thingsvis_canvas_${Date.now()}`;
            localStorage.setItem(key, JSON.stringify(payload));

            return { success: true, data: { savedKey: key } };
        } catch (error) {
            console.error('Failed to save to self:', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }

    /**
     * Update save target
     */
    public setSaveTarget(target: SaveTarget) {
        this.saveTarget = target;
    }
}
