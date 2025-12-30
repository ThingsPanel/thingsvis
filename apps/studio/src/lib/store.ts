/**
 * Shared kernel store instance for the entire studio application.
 * This ensures data sources, canvas state, and other kernel data are shared across all pages/components.
 */
import { createKernelStore, dataSourceManager } from '@thingsvis/kernel';

// Create a single shared store instance
export const store = createKernelStore();

// Initialize DataSourceManager with the shared store
dataSourceManager.init(store);
