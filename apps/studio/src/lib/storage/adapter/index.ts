/**
 * Storage Adapter Module
 * 
 * Exports storage adapters for local and cloud storage.
 */

export * from './types';
export { localStorageAdapter, createLocalStorageAdapter } from './localAdapter';
export { createCloudStorageAdapter } from './cloudAdapter';
