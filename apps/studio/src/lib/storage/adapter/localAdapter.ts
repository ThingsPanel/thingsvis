/**
 * Local Storage Adapter
 *
 * Implements StorageAdapter using IndexedDB for local browser storage.
 * This is the default storage mode when user is not authenticated.
 */

import type {
  StorageAdapter,
  StorageProject,
  StorageProjectMeta,
  ListOptions,
  ListResult,
  StorageBackend,
} from './types';
import { loadProject, saveProject, deleteProject } from '../projectStorage';
import { recentProjects } from '../recentProjects';
import type { z } from 'zod';
import type { ProjectFileSchema } from '../schemas';

type ProjectFile = z.infer<typeof ProjectFileSchema>;

function projectFileToStorageProject(file: ProjectFile): StorageProject {
  return {
    meta: {
      id: file.meta.id,
      name: file.meta.name,
      thumbnail: file.meta.thumbnail,
      createdAt: file.meta.createdAt,
      updatedAt: file.meta.updatedAt,
    },
    schema: {
      canvas: file.canvas,
      nodes: file.nodes,
      dataSources: file.dataSources,
    },
  };
}

function storageProjectToProjectFile(project: StorageProject): ProjectFile {
  return {
    meta: {
      version: '1.0.0',
      id: project.meta.id,
      name: project.meta.name,
      thumbnail: project.meta.thumbnail,
      createdAt: project.meta.createdAt,
      updatedAt: project.meta.updatedAt,
    },
    canvas: project.schema.canvas || {
      mode: 'infinite',
      width: 1920,
      height: 1080,
    },
    nodes: project.schema.nodes || [],
    dataSources: project.schema.dataSources || [],
  };
}

export function createLocalStorageAdapter(): StorageAdapter {
  return {
    backend: 'local' as StorageBackend,

    async list(options?: ListOptions): Promise<ListResult<StorageProjectMeta>> {
      try {
        // Get all recent projects from localStorage
        const allProjects = recentProjects.getAll();
        let filtered = [...allProjects];

        // Apply search filter
        if (options?.search) {
          const search = options.search.toLowerCase();
          filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
        }

        // Apply sorting
        const sortBy = options?.sortBy || 'updatedAt';
        const sortOrder = options?.sortOrder || 'desc';

        filtered.sort((a, b) => {
          let comparison = 0;
          if (sortBy === 'name') {
            comparison = a.name.localeCompare(b.name);
          } else if (sortBy === 'updatedAt') {
            comparison = a.updatedAt - b.updatedAt;
          } else if (sortBy === 'createdAt') {
            // For local storage, createdAt is approximated by updatedAt
            comparison = a.updatedAt - b.updatedAt;
          }
          return sortOrder === 'desc' ? -comparison : comparison;
        });

        // Apply pagination
        const offset = options?.offset || 0;
        const limit = options?.limit || 20;
        const total = filtered.length;
        const paginated = filtered.slice(offset, offset + limit);

        return {
          data: paginated.map((p) => ({
            id: p.id,
            name: p.name,
            thumbnail: p.thumbnail,
            createdAt: p.updatedAt, // Local storage doesn't track createdAt separately
            updatedAt: p.updatedAt,
          })),
          total,
          hasMore: offset + limit < total,
        };
      } catch (error) {
        return { data: [], total: 0, hasMore: false };
      }
    },

    async get(id: string): Promise<StorageProject | null> {
      try {
        const projectFile = await loadProject(id);
        if (!projectFile) return null;
        return projectFileToStorageProject(projectFile);
      } catch (error) {
        return null;
      }
    },

    async save(project: StorageProject): Promise<{ id: string }> {
      try {
        // Generate ID if not present
        const id = project.meta.id || crypto.randomUUID();
        const projectWithId = {
          ...project,
          meta: {
            ...project.meta,
            id,
            updatedAt: Date.now(),
          },
        };

        const projectFile = storageProjectToProjectFile(projectWithId);
        await saveProject(projectFile);
        return { id };
      } catch (error) {
        throw error;
      }
    },

    async delete(id: string): Promise<boolean> {
      try {
        await deleteProject(id);
        return true;
      } catch (error) {
        return false;
      }
    },

    async duplicate(id: string, newName: string): Promise<{ id: string }> {
      try {
        const original = await this.get(id);
        if (!original) throw new Error('Project not found');

        const newId = crypto.randomUUID();
        const duplicated: StorageProject = {
          ...original,
          meta: {
            ...original.meta,
            id: newId,
            name: newName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        };

        return this.save(duplicated);
      } catch (error) {
        throw error;
      }
    },

    async export(id: string): Promise<Blob> {
      const project = await this.get(id);
      if (!project) throw new Error('Project not found');

      const projectFile = storageProjectToProjectFile(project);
      const json = JSON.stringify(projectFile, null, 2);
      return new Blob([json], { type: 'application/json' });
    },

    async import(file: File): Promise<{ id: string }> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content) as ProjectFile;

            // Generate new ID for imported project
            const newId = crypto.randomUUID();
            const project = projectFileToStorageProject(parsed);
            project.meta.id = newId;
            project.meta.createdAt = Date.now();
            project.meta.updatedAt = Date.now();

            const result = await this.save(project);
            resolve(result);
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

// Singleton instance
export const localStorageAdapter = createLocalStorageAdapter();
