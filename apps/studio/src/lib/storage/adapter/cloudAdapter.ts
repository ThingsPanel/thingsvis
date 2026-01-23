/**
 * Cloud Storage Adapter
 * 
 * Implements StorageAdapter using the backend API for cloud storage.
 * This is used when user is authenticated.
 */

import type { StorageAdapter, StorageProject, StorageProjectMeta, ListOptions, ListResult, StorageBackend } from './types';
import * as dashboardsApi from '../../api/dashboards';

function isCuid(id?: string): boolean {
  if (!id) return false;
  return /^c[a-z0-9]{24,}$/i.test(id);
}

function apiDashboardToStorageProject(dashboard: dashboardsApi.Dashboard): StorageProject {
  return {
    meta: {
      id: dashboard.id,
      name: dashboard.name,
      createdAt: new Date(dashboard.createdAt).getTime(),
      updatedAt: new Date(dashboard.updatedAt).getTime(),
    },
    schema: {
      canvas: dashboard.canvasConfig || { mode: 'infinite', width: 1920, height: 1080, background: '#1e1e2e' },
      nodes: (dashboard.nodes as any[]) || [],
      dataSources: (dashboard.dataSources as any[]) || [],
    },
  };
}

export function createCloudStorageAdapter(projectId?: string): StorageAdapter {
  return {
    backend: 'cloud' as StorageBackend,

    async list(options?: ListOptions): Promise<ListResult<StorageProjectMeta>> {
      try {
        console.log('[CloudAdapter] Listing dashboards:', {
          projectId,
          options,
        });
        
        const response = await dashboardsApi.listDashboards({
          limit: options?.limit,
          page: options?.page || 1,
          projectId,
        });

        console.log('[CloudAdapter] List response:', {
          hasError: !!response.error,
          hasData: !!response.data,
          error: response.error,
        });

        if (response.error || !response.data) {
          return { data: [], total: 0, hasMore: false };
        }

        const { data, meta } = response.data;
        const hasMore = meta.page < meta.totalPages;
        
        console.log('[CloudAdapter] Parsed dashboards:', {
          count: data.length,
          total: meta.total,
          hasMore,
        });
        
        return {
          data: data.map(d => ({
            id: d.id,
            name: d.name,
            createdAt: new Date(d.createdAt).getTime(),
            updatedAt: new Date(d.updatedAt).getTime(),
          })),
          total: meta.total,
          hasMore,
        };
      } catch (error) {
        console.error('Cloud storage list error:', error);
        return { data: [], total: 0, hasMore: false };
      }
    },

    async get(id: string): Promise<StorageProject | null> {
      try {
        const response = await dashboardsApi.getDashboard(id);
        
        if (response.error || !response.data) {
          return null;
        }

        return apiDashboardToStorageProject(response.data);
      } catch (error) {
        console.error('Cloud storage get error:', error);
        return null;
      }
    },

    async save(project: StorageProject): Promise<{ id: string }> {
      try {
        const canUpdate = project.meta.id && isCuid(project.meta.id);

        if (canUpdate) {
          const response = await dashboardsApi.updateDashboard(project.meta.id, {
            name: project.meta.name,
            canvasConfig: project.schema.canvas,
            nodes: project.schema.nodes,
            dataSources: project.schema.dataSources,
          });

          if (!response.error) {
            return { id: project.meta.id };
          }

          // If the dashboard doesn't exist, fall through to create.
          if (response.error !== 'Dashboard not found') {
            throw new Error(response.error);
          }
        }

        // Create dashboard - projectId is optional, backend will auto-create if not provided
        const createResponse = await dashboardsApi.createDashboard({
          name: project.meta.name,
          projectId, // Optional - will auto-create project if not provided
          canvasConfig: project.schema.canvas,
        });

        if (createResponse.error || !createResponse.data) {
          throw new Error(createResponse.error || 'Failed to create dashboard');
        }

        const createdId = createResponse.data.id;

        // Update full schema after creation (nodes/dataSources)
        const updateResponse = await dashboardsApi.updateDashboard(createdId, {
          nodes: project.schema.nodes,
          dataSources: project.schema.dataSources,
        });

        if (updateResponse.error) {
          throw new Error(updateResponse.error);
        }

        return { id: createdId };
      } catch (error) {
        console.error('Cloud storage save error:', error);
        throw error;
      }
    },

    async delete(id: string): Promise<boolean> {
      try {
        const response = await dashboardsApi.deleteDashboard(id);
        return !response.error;
      } catch (error) {
        console.error('Cloud storage delete error:', error);
        return false;
      }
    },

    async duplicate(id: string, newName: string): Promise<{ id: string }> {
      try {
        // Get original dashboard
        const original = await this.get(id);
        if (!original) throw new Error('Dashboard not found');

        // Create new dashboard with same schema but new name
        // projectId is optional - will auto-create if not provided
        const response = await dashboardsApi.createDashboard({
          name: newName,
          projectId, // Optional
          canvasConfig: original.schema.canvas,
        });

        if (response.error || !response.data) {
          throw new Error(response.error || 'Failed to duplicate dashboard');
        }

        // Update with full schema
        await dashboardsApi.updateDashboard(response.data.id, {
          nodes: original.schema.nodes,
          dataSources: original.schema.dataSources,
        });

        return { id: response.data.id };
      } catch (error) {
        console.error('Cloud storage duplicate error:', error);
        throw error;
      }
    },

    async export(id: string): Promise<Blob> {
      const project = await this.get(id);
      if (!project) throw new Error('Dashboard not found');

      // Export in ProjectFile format for compatibility
      const exportData = {
        meta: {
          version: '1.0.0',
          id: project.meta.id,
          name: project.meta.name,
          createdAt: project.meta.createdAt,
          updatedAt: project.meta.updatedAt,
        },
        canvas: project.schema.canvas,
        nodes: project.schema.nodes,
        dataSources: project.schema.dataSources,
      };

      const json = JSON.stringify(exportData, null, 2);
      return new Blob([json], { type: 'application/json' });
    },

    async import(file: File): Promise<{ id: string }> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content);

            // projectId is optional - will auto-create if not provided
            const response = await dashboardsApi.createDashboard({
              name: parsed.meta?.name || 'Imported Dashboard',
              projectId, // Optional
              canvasConfig: parsed.canvas,
            });

            if (response.error || !response.data) {
              throw new Error(response.error || 'Failed to import dashboard');
            }

            // Update with full data
            await dashboardsApi.updateDashboard(response.data.id, {
              nodes: parsed.nodes || [],
              dataSources: parsed.dataSources || [],
            });

            resolve({ id: response.data.id });
          } catch (error) {
            reject(new Error('Invalid project file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    },
  };
}
