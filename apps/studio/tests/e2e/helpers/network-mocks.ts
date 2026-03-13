import type { Page } from '@playwright/test';

const STATIC_REMOTE_BASE = '/widgets';

export const smokeRegistryFixture = {
  schemaVersion: 1,
  generatedAt: '2026-03-12T00:00:00.000Z',
  components: {
    'chart/echarts-bar': {
      remoteName: 'thingsvis_widget_chart_echarts_bar',
      remoteEntryUrl: 'http://localhost:3202/remoteEntry.js',
      staticEntryUrl: `${STATIC_REMOTE_BASE}/chart/echarts-bar/dist/remoteEntry.js`,
      debugSource: 'static',
      exposedModule: './Main',
      version: '0.0.1',
      icon: 'BarChart3',
      name: 'Bar Chart',
      i18n: { zh: '柱状图', en: 'Bar Chart' },
    },
    'chart/echarts-line': {
      remoteName: 'thingsvis_widget_chart_echarts_line',
      remoteEntryUrl: 'http://localhost:3201/remoteEntry.js',
      staticEntryUrl: `${STATIC_REMOTE_BASE}/chart/echarts-line/dist/remoteEntry.js`,
      debugSource: 'static',
      exposedModule: './Main',
      version: '0.0.1',
      icon: 'LineChart',
      name: 'Line Chart',
      i18n: { zh: '折线图', en: 'Line Chart' },
    },
    'chart/echarts-gauge': {
      remoteName: 'thingsvis_widget_chart_echarts_gauge',
      remoteEntryUrl: 'http://localhost:3204/remoteEntry.js',
      staticEntryUrl: `${STATIC_REMOTE_BASE}/chart/echarts-gauge/dist/remoteEntry.js`,
      debugSource: 'static',
      exposedModule: './Main',
      version: '0.0.1',
      icon: 'Gauge',
      name: 'Gauge',
      i18n: { zh: '仪表盘', en: 'Gauge' },
    },
    'basic/table': {
      remoteName: 'thingsvis_widget_basic_table',
      remoteEntryUrl: 'http://localhost:3206/remoteEntry.js',
      staticEntryUrl: `${STATIC_REMOTE_BASE}/basic/table/dist/remoteEntry.js`,
      debugSource: 'static',
      exposedModule: './Main',
      version: '0.1.0',
      icon: 'Table2',
      name: 'Table',
      i18n: { zh: '表格', en: 'Table' },
    },
  },
} as const;

export async function mockSmokeRegistry(page: Page): Promise<void> {
  await page.route('**/registry.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(smokeRegistryFixture),
    });
  });
}
