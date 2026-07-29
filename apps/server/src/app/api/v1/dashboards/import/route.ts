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

  const bindingKeyToDeviceIdMap = new Map(
    localDeviceBindings.map((lb) => [lb.bindingKey, lb.deviceId]),
  );

  // A bound platform data source must end up in the exact shape the runtime
  // resolves — `__platform_<deviceId>__` (see studio's platformDeviceCompat /
  // WidgetModeStrategy / FieldPicker). The `thingspanel_*` prefix is a
  // different namespace entirely (host catalog sources like
  // thingspanel_device_summary) and is never resolved as a per-device source,
  // so emitting it here produces a dashboard that renders nothing.
  const boundDataSourceId = (deviceId: string) => `__platform_${deviceId}__`;

  // Device references live in five places in a real dashboard: dataSources[].id,
  // dataSources[].config.deviceId, node expressions
  // ("{{ ds.__platform___key__.data.f }}"), node dataSourcePath, and event
  // action dataSourceId. A single recursive string substitution covers all of
  // them; special-casing individual keys silently leaves the others pointing at
  // a data source that no longer exists.
  const replaceBindingReferences = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value.replace(/__platform___([^_]+)__/g, (match, bindingKey) => {
        const deviceId = bindingKeyToDeviceIdMap.get(bindingKey);
        return deviceId ? boundDataSourceId(deviceId) : match;
      });
    }

    if (Array.isArray(value)) {
      return value.map(replaceBindingReferences);
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(record)) {
        result[key] = replaceBindingReferences(val);
      }
      return result;
    }

    return value;
  };

  // Bind the platform data sources themselves. An unresolved bindingKey is left
  // untouched rather than being attached to some other binding — silently
  // pointing a widget at the wrong device is worse than leaving it unbound.
  const unresolvedBindings: string[] = [];
  const processedDataSources = snapshot.dataSources.map((ds) => {
    if (!ds || typeof ds !== 'object') return ds;

    const dataSource = ds as Record<string, unknown>;
    if (String(dataSource.type ?? '').toUpperCase() !== 'PLATFORM_FIELD') {
      return replaceBindingReferences(dataSource);
    }

    const config = (dataSource.config as Record<string, unknown>) ?? {};
    const bindingKeyMatch = String(dataSource.id ?? '').match(/^__platform___([^_]+)__$/);
    if (!bindingKeyMatch) return replaceBindingReferences(dataSource);

    const bindingKey = bindingKeyMatch[1];
    const localDeviceId = bindingKeyToDeviceIdMap.get(bindingKey);
    if (!localDeviceId) {
      unresolvedBindings.push(bindingKey);
      return replaceBindingReferences(dataSource);
    }

    return {
      ...(replaceBindingReferences(dataSource) as Record<string, unknown>),
      id: boundDataSourceId(localDeviceId),
      config: { ...config, deviceId: localDeviceId },
    };
  });

  if (unresolvedBindings.length > 0) {
    logger.warn({
      msg: '[MarketImport] Data sources left unbound',
      unresolvedBindings,
      snapshotKey: snapshot.resourceKey,
    });
  }

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
