import type { ProjectFile } from './schemas';
import type { SavePayload } from './saveStrategy';
import { resolveEditorServiceConfig } from '../embedded/service-config';
import { sanitizeDataSourcesForHostSave } from '../embedded/hostDataSourcePolicy';
import { augmentPlatformDataSourcesForNodes } from '../platformDatasourceBindings';
import { stripStaticPropsForBoundProject } from './sanitizeBoundProps';

export function extractDataBindings(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) return [];

  return nodes.flatMap((node) => {
    const bindings = node.data || [];
    return bindings.map((binding: any) => ({
      nodeId: node.id,
      targetProp: binding.targetProp,
      expression: binding.expression,
      transform: binding.transform,
      historyConfig: binding.historyConfig,
    }));
  });
}

export function prepareProjectForHostSave(project: ProjectFile): ProjectFile {
  return stripStaticPropsForBoundProject(project);
}

export function buildHostSavePayload(project: ProjectFile): {
  projectForSave: ProjectFile;
  payload: SavePayload;
} {
  const projectForSave = prepareProjectForHostSave(project);
  const augmentedDataSources = augmentPlatformDataSourcesForNodes(
    projectForSave.dataSources as Parameters<typeof augmentPlatformDataSourcesForNodes>[0],
    projectForSave.nodes as Array<Record<string, unknown>>,
  );
  const dataSources = sanitizeDataSourcesForHostSave(
    projectForSave.nodes,
    augmentedDataSources,
    resolveEditorServiceConfig().context,
  );

  return {
    projectForSave,
    payload: {
      meta: {
        id: projectForSave.meta.id,
        name: projectForSave.meta.name,
        version: projectForSave.meta.version,
        thumbnail: projectForSave.meta.thumbnail,
      },
      thumbnail: projectForSave.meta.thumbnail,
      canvas: projectForSave.canvas,
      nodes: projectForSave.nodes,
      dataSources,
      variables: projectForSave.variables,
      dataBindings: extractDataBindings(projectForSave.nodes),
    },
  };
}
