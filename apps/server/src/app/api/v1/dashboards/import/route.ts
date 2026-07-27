/**
 * Dashboard Market Template Import API
 *
 * POST /api/v1/dashboards/import
 *
 * Imports a market template snapshot and binds it to local devices,
 * creating a new dashboard with the provided device bindings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import {
  ImportDashboardBodySchema,
  DEFAULT_MARKET_IMPORT_CANVAS_CONFIG,
} from '@/lib/market-template/validators';
import {
  validateDeviceBindings,
  validateFieldBindings,
} from '@/lib/market-template/binding-extractor';
import { validateImportedSnapshot } from '@/lib/market-template/security';

// POST /api/v1/dashboards/import - Import a market template
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid JSON body',
        code: 'INVALID_BODY',
      },
      { status: 400 },
    );
  }

  // Validate request body
  const bodyValidation = ImportDashboardBodySchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: bodyValidation.error.flatten(),
      },
      { status: 400 },
    );
  }

  const {
    snapshot,
    localDeviceBindings,
    name: overrideName,
    projectId: overrideProjectId,
  } = bodyValidation.data;

  // Validate the imported snapshot's content for safety
  const snapshotValidation = validateImportedSnapshot(snapshot);
  if (!snapshotValidation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Imported snapshot contains unsafe content',
        code: 'SNAPSHOT_VALIDATION_FAILED',
        details: {
          errors: snapshotValidation.errors,
          warnings: snapshotValidation.warnings,
        },
      },
      { status: 400 },
    );
  }

  // Validate device bindings
  const deviceBindingValidation = validateDeviceBindings(snapshot.deviceBindings);
  if (!deviceBindingValidation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid device bindings in snapshot',
        code: 'DEVICE_BINDING_INVALID',
        details: { errors: deviceBindingValidation.errors },
      },
      { status: 400 },
    );
  }

  // Validate field bindings
  const fieldBindingValidation = validateFieldBindings(
    snapshot.fieldBindings,
    snapshot.deviceBindings,
  );
  if (!fieldBindingValidation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid field bindings in snapshot',
        code: 'FIELD_BINDING_INVALID',
        details: { errors: fieldBindingValidation.errors },
      },
      { status: 400 },
    );
  }

  // Check that all device bindings have corresponding local bindings
  const snapshotBindingKeys = new Set(snapshot.deviceBindings.map((db) => db.bindingKey));
  const localBindingKeys = new Map(localDeviceBindings.map((lb) => [lb.bindingKey, lb.deviceId]));

  const missingBindings: string[] = [];
  for (const bindingKey of snapshotBindingKeys) {
    if (!localBindingKeys.has(bindingKey)) {
      // Check if this binding is marked as required
      const db = snapshot.deviceBindings.find((d) => d.bindingKey === bindingKey);
      if (db?.required) {
        missingBindings.push(bindingKey);
      }
    }
  }

  if (missingBindings.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required device bindings',
        code: 'DEVICE_BINDING_MISSING',
        details: { missingBindings },
      },
      { status: 400 },
    );
  }

  // Determine project ID
  let projectId = overrideProjectId;
  if (!projectId) {
    // Find or create default project for tenant
    let project = await prisma.project.findFirst({
      where: {
        tenantId: user.tenantId,
        name: 'Market Templates',
      },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: 'Market Templates',
          tenantId: user.tenantId,
          createdById: user.id,
        },
      });
      logger.info({
        msg: '[MarketImport] Created default project for market templates',
        projectId: project.id,
        tenantId: user.tenantId,
      });
    }
    projectId = project.id;
  } else {
    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: user.tenantId },
    });
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found or access denied',
          code: 'PROJECT_NOT_FOUND',
        },
        { status: 404 },
      );
    }
  }

  // Replace template data source IDs with actual device IDs
  const processedDataSources = snapshot.dataSources.map((ds) => {
    if (!ds || typeof ds !== 'object') return ds;

    const dataSource = ds as Record<string, unknown>;
    const dsType = String(dataSource.type ?? '').toUpperCase();

    // For PLATFORM_FIELD data sources, replace template device ID with actual device ID
    if (dsType === 'PLATFORM_FIELD') {
      const config = dataSource.config as Record<string, unknown> | undefined;
      const currentDeviceId = config?.deviceId;

      // Check if this is a template reference
      if (currentDeviceId === '__template__' || String(currentDeviceId).includes('__template__')) {
        // Find the binding key for this data source (from deviceBindings)
        // The bindingKey maps to a specific device in localDeviceBindings
        const dsId = String(dataSource.id ?? '');

        // Try to extract bindingKey from dataSource ID pattern
        const bindingKeyMatch = dsId.match(/^__platform___([^_]+)__$/);
        if (bindingKeyMatch) {
          const bindingKey = bindingKeyMatch[1];
          const localDeviceId = localBindingKeys.get(bindingKey);
          if (localDeviceId) {
            return {
              ...dataSource,
              id: `thingspanel_${localDeviceId}`,
              config: {
                ...config,
                deviceId: localDeviceId,
              },
            };
          }
        }

        // Also check dataSources for template device references and replace them
        // based on the first matching local binding
        if (!localBindingKeys.has(bindingKeyMatch?.[1] || '')) {
          // Try to find any matching binding
          for (const [bk, deviceId] of localBindingKeys) {
            // Check if this data source should be bound to this device
            const db = snapshot.deviceBindings.find((d) => d.bindingKey === bk);
            if (db) {
              return {
                ...dataSource,
                id: `thingspanel_${deviceId}`,
                config: {
                  ...config,
                  deviceId: deviceId,
                },
              };
            }
          }
        }
      }
    }

    return dataSource;
  });

  // Replace binding references in nodes and variables
  const bindingKeyToDeviceIdMap = new Map(
    localDeviceBindings.map((lb) => [lb.bindingKey, lb.deviceId]),
  );

  const replaceBindingReferences = (value: unknown): unknown => {
    if (typeof value === 'string') {
      // Replace __platform___bindingKey__ patterns with thingspanel_deviceId
      return value.replace(/__platform___([^_]+)__/g, (match, bindingKey) => {
        const deviceId = bindingKeyToDeviceIdMap.get(bindingKey);
        return deviceId ? `thingspanel_${deviceId}` : match;
      });
    }

    if (Array.isArray(value)) {
      return value.map(replaceBindingReferences);
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const result: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(record)) {
        // Check if this field contains device references
        if (key === 'dataSourceId' && typeof val === 'string') {
          // Replace template data source ID with actual device data source ID
          const bindingKeyMatch = val.match(/^__platform___([^_]+)__$/);
          if (bindingKeyMatch) {
            const bindingKey = bindingKeyMatch[1];
            const deviceId = bindingKeyToDeviceIdMap.get(bindingKey);
            if (deviceId) {
              result[key] = `thingspanel_${deviceId}`;
              continue;
            }
          }
        }
        result[key] = replaceBindingReferences(val);
      }

      return result;
    }

    return value;
  };

  const processedNodes = snapshot.nodes.map(replaceBindingReferences);
  const processedVariables = snapshot.variables.map(replaceBindingReferences);

  // Determine final canvas config
  const canvasConfig = snapshot.canvasConfig || DEFAULT_MARKET_IMPORT_CANVAS_CONFIG;

  // Determine dashboard name
  const dashboardName = overrideName || snapshot.name;

  // Create the new dashboard
  let dashboard;
  try {
    dashboard = await prisma.dashboard.create({
      data: {
        id: crypto.randomUUID(), // Generate new ID
        name: dashboardName,
        canvasConfig: JSON.stringify(canvasConfig),
        nodes: JSON.stringify(processedNodes),
        dataSources: JSON.stringify(processedDataSources),
        variables: JSON.stringify(processedVariables),
        projectId,
        createdById: user.id,
        version: 1,
      },
    });
  } catch (error) {
    logger.error({
      msg: '[MarketImport] Failed to create dashboard',
      error: error instanceof Error ? error.message : 'Unknown error',
      snapshotKey: snapshot.resourceKey,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create dashboard',
        code: 'DASHBOARD_CREATION_FAILED',
      },
      { status: 500 },
    );
  }

  logger.info({
    msg: '[MarketImport] Dashboard imported successfully',
    dashboardId: dashboard.id,
    originalResourceKey: snapshot.resourceKey,
    boundDevices: localDeviceBindings.map((lb) => lb.bindingKey),
  });

  return NextResponse.json({
    success: true,
    dashboardId: dashboard.id,
    name: dashboard.name,
    warnings: snapshotValidation.warnings.length > 0 ? snapshotValidation.warnings : undefined,
  });
}
