/**
 * Dashboard Market Template Export API
 *
 * POST /api/v1/dashboards/:id/export
 *
 * Exports a dashboard as a market template, replacing real device references
 * with bindingKey placeholders.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-helpers';
import { logger } from '@/lib/logger';
import {
  ExportDashboardQuerySchema,
  DashboardTemplateSnapshotSchema,
  MARKET_TEMPLATE_SCHEMA_VERSION,
  DEFAULT_MARKET_IMPORT_CANVAS_CONFIG,
} from '@/lib/market-template/validators';
import {
  extractDeviceBindings,
  validateDeviceBindings,
  validateFieldBindings,
} from '@/lib/market-template/binding-extractor';
import {
  sanitizeDashboardForExport,
  replaceDeviceReferencesWithTemplates,
  checkExportSize,
} from '@/lib/market-template/security';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/v1/dashboards/:id/export - Export dashboard as market template
export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  // Parse and validate query parameters
  const queryResult = ExportDashboardQuerySchema.safeParse({
    exportMode: searchParams.get('exportMode') || 'market-template',
    deviceBindingHints: searchParams.has('deviceBindingHints')
      ? JSON.parse(searchParams.get('deviceBindingHints') || '[]')
      : undefined,
  });

  if (!queryResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: queryResult.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { exportMode, deviceBindingHints = [] } = queryResult.data;

  // Only support market-template export mode
  if (exportMode !== 'market-template') {
    return NextResponse.json(
      {
        success: false,
        error: `Export mode '${exportMode}' is not supported. Use 'market-template'.`,
        code: 'UNSUPPORTED_EXPORT_MODE',
      },
      { status: 400 },
    );
  }

  // Fetch dashboard
  const dashboard = await prisma.dashboard.findFirst({
    where: { id, project: { tenantId: user.tenantId } },
    include: {
      project: { select: { id: true, name: true } },
    },
  });

  if (!dashboard) {
    return NextResponse.json(
      {
        success: false,
        error: 'Dashboard not found',
        code: 'DASHBOARD_NOT_FOUND',
      },
      { status: 404 },
    );
  }

  // Parse dashboard content
  const canvasConfig = JSON.parse(dashboard.canvasConfig || '{}');
  const nodes = JSON.parse(dashboard.nodes || '[]');
  const dataSources = JSON.parse(dashboard.dataSources || '[]');
  const variables = JSON.parse(dashboard.variables || '[]');

  // Check size limits
  const sizeCheck = checkExportSize({ canvasConfig, nodes, dataSources, variables });
  if (!sizeCheck.withinLimits) {
    logger.warn({
      msg: '[MarketExport] Dashboard exceeds size limits',
      dashboardId: id,
      oversized: sizeCheck.oversized,
      totalSize: sizeCheck.totalSize,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Dashboard exceeds size limits',
        code: 'EXPORT_SIZE_EXCEEDED',
        details: { oversized: sizeCheck.oversized, totalSize: sizeCheck.totalSize },
      },
      { status: 400 },
    );
  }

  // Sanitize dashboard content (strip real IDs, tokens, etc.)
  const sanitized = sanitizeDashboardForExport({
    canvasConfig,
    nodes,
    dataSources,
    variables,
  });

  if (sanitized.detectedIssues.length > 0) {
    logger.warn({
      msg: '[MarketExport] Security issues detected during sanitization',
      dashboardId: id,
      issues: sanitized.detectedIssues,
    });
  }

  // Replace real device references with template placeholders
  const deviceRefReplacement = replaceDeviceReferencesWithTemplates(sanitized.dataSources);
  sanitized.dataSources = deviceRefReplacement.dataSources;

  // Extract device bindings from the sanitized dashboard
  const extractionResult = extractDeviceBindings(
    {
      nodes: sanitized.nodes as unknown[],
      dataSources: sanitized.dataSources as unknown[],
      variables: sanitized.variables as unknown[],
    },
    deviceBindingHints,
    [], // No availableDeviceTemplates validation in basic export
  );

  // Validate device bindings
  const deviceBindingValidation = validateDeviceBindings(extractionResult.deviceBindings);
  if (!deviceBindingValidation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid device bindings',
        code: 'DEVICE_BINDING_INVALID',
        details: { errors: deviceBindingValidation.errors },
      },
      { status: 400 },
    );
  }

  // Validate field bindings
  const fieldBindingValidation = validateFieldBindings(
    extractionResult.fieldBindings,
    extractionResult.deviceBindings,
  );
  if (!fieldBindingValidation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid field bindings',
        code: 'FIELD_BINDING_INVALID',
        details: { errors: fieldBindingValidation.errors },
      },
      { status: 400 },
    );
  }

  // Check for unbound data sources (real devices without hints)
  if (extractionResult.unboundDataSources.length > 0) {
    logger.warn({
      msg: '[MarketExport] Unbound data sources detected',
      dashboardId: id,
      unboundDataSources: extractionResult.unboundDataSources,
    });

    // Generate a warning but don't fail - the user can handle this
    const unboundWarning = `The following data sources have no device binding: ${extractionResult.unboundDataSources.join(', ')}. They will be exported without device binding.`;
    extractionResult.warnings.push(unboundWarning);
  }

  // Build the resource key from dashboard name
  const resourceKey = dashboard.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^([a-z])/, (_, c) => c); // Ensure starts with letter

  // Build the snapshot
  const snapshot = {
    resourceKey: resourceKey || 'untitled-dashboard',
    version: '1.0.0',
    name: dashboard.name,
    schemaVersion: MARKET_TEMPLATE_SCHEMA_VERSION,
    canvasConfig: sanitized.canvasConfig,
    nodes: sanitized.nodes,
    dataSources: sanitized.dataSources,
    variables: sanitized.variables,
    deviceBindings: extractionResult.deviceBindings,
    fieldBindings: extractionResult.fieldBindings,
  };

  // Validate the final snapshot against schema
  const snapshotValidation = DashboardTemplateSnapshotSchema.safeParse(snapshot);
  if (!snapshotValidation.success) {
    logger.error({
      msg: '[MarketExport] Snapshot validation failed',
      dashboardId: id,
      errors: snapshotValidation.error.flatten(),
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create valid snapshot',
        code: 'SNAPSHOT_VALIDATION_FAILED',
        details: snapshotValidation.error.flatten(),
      },
      { status: 500 },
    );
  }

  // Collect all warnings
  const warnings = [
    ...extractionResult.warnings,
    ...(deviceRefReplacement.warnings.length > 0 ? deviceRefReplacement.warnings : []),
    ...(sanitized.detectedIssues.length > 0
      ? [`Security sanitization detected ${sanitized.detectedIssues.length} issues`]
      : []),
  ];

  logger.info({
    msg: '[MarketExport] Dashboard exported successfully',
    dashboardId: id,
    resourceKey: snapshot.resourceKey,
    deviceBindingsCount: snapshot.deviceBindings.length,
    fieldBindingsCount: snapshot.fieldBindings.length,
  });

  return NextResponse.json({
    success: true,
    snapshot: snapshotValidation.data,
    warnings: warnings.length > 0 ? warnings : undefined,
  });
}
