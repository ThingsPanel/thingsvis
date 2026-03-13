/**
 * Storage Adapter Interface
 * 
 * Abstraction layer for switching between local (IndexedDB) and cloud (API) storage.
 * This allows the application to seamlessly work in standalone, cloud, or embed modes.
 */

// =============================================================================
// Types
// =============================================================================

export type StorageBackend = 'local' | 'cloud';

export interface StorageProjectMeta {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  projectId?: string;
  projectName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StorageProject {
  meta: StorageProjectMeta;
  schema: {
    canvas: any;
    nodes: any[];
    dataSources: any[];
    layers?: any[];
    variables?: any[];
  };
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  page?: number;
  search?: string;
  sortBy?: 'name' | 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export interface StorageAdapter {
  // Backend info
  backend: StorageBackend;

  // Project/Dashboard CRUD
  list: (options?: ListOptions) => Promise<ListResult<StorageProjectMeta>>;
  get: (id: string) => Promise<StorageProject | null>;
  save: (project: StorageProject) => Promise<{ id: string }>;
  delete: (id: string) => Promise<boolean>;

  // Additional operations
  duplicate?: (id: string, newName: string) => Promise<{ id: string }>;
  export?: (id: string) => Promise<Blob>;
  import?: (file: File) => Promise<{ id: string }>;
}
