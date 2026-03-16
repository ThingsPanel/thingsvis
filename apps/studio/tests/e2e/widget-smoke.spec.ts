import { expect, test, type Page } from '@playwright/test';
import { createSmokeInitPayload } from './fixtures/dashboard-fixtures';
import { gotoEditor, gotoEmbed, postHostMessage } from './helpers/editor-bootstrap';
import { mockSmokeRegistry, smokeRegistryFixture } from './helpers/network-mocks';
import { componentCardSelector, editorSelectors } from './helpers/selectors';

const SMOKE_COMPONENTS = [
  { id: 'chart/echarts-bar', signal: 'canvas' },
  { id: 'chart/echarts-line', signal: 'canvas' },
  { id: 'chart/echarts-gauge', signal: 'canvas' },
  { id: 'basic/table', signal: 'table' },
] as const;

const STANDALONE_COMPONENTS = [
  { id: 'chart/echarts-bar', signal: 'canvas', emptyText: '\u6682\u65e0\u6570\u636e' },
  { id: 'chart/echarts-line', signal: 'canvas', emptyText: '\u7b49\u5f85\u6570\u636e' },
  { id: 'chart/echarts-gauge', signal: 'canvas', emptyText: '\u6682\u65e0\u6570\u636e' },
  { id: 'chart/uplot-line', signal: '.uplot', emptyText: '\u7b49\u5f85\u65f6\u5e8f\u6570\u636e' },
  { id: 'media/iframe', signal: 'text=thingspanel.cn', emptyText: '\u8bf7\u914d\u7f6e\u7f51\u9875\u5730\u5740' },
] as const;

async function mockStandaloneRegistry(page: Page): Promise<void> {
  await page.route('**/registry.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...smokeRegistryFixture,
        components: {
          ...smokeRegistryFixture.components,
          'chart/uplot-line': {
            remoteName: 'thingsvis_widget_chart_uplot_line',
            remoteEntryUrl: 'http://localhost:3209/remoteEntry.js',
            staticEntryUrl: '/widgets/chart/uplot-line/dist/remoteEntry.js',
            debugSource: 'static',
            exposedModule: './Main',
            version: '1.0.1',
            icon: 'LineChart',
            name: 'Time Series',
            i18n: { zh: '\u65f6\u5e8f\u56fe', en: 'Time Series' },
          },
          'media/iframe': {
            remoteName: 'thingsvis_widget_media_iframe',
            remoteEntryUrl: 'http://localhost:3208/remoteEntry.js',
            staticEntryUrl: '/widgets/media/iframe/dist/remoteEntry.js',
            debugSource: 'static',
            exposedModule: './Main',
            version: '1.0.1',
            icon: 'AppWindow',
            name: 'Iframe',
            i18n: { zh: '\u7f51\u9875', en: 'Iframe' },
          },
        },
      }),
    });
  });
}

test.describe('widget smoke', () => {
  for (const component of SMOKE_COMPONENTS) {
    test(`${component.id} renders in embed mode`, async ({ page }) => {
      await mockSmokeRegistry(page);
      await gotoEmbed(page);
      await postHostMessage(page, 'tv:init', createSmokeInitPayload(component.id));

      const signal = page.locator(component.signal).first();
      await expect(signal).toBeVisible();
    });
  }

  for (const component of STANDALONE_COMPONENTS) {
    test(`${component.id} renders with standalone demo data`, async ({ page }) => {
      await mockStandaloneRegistry(page);
      await gotoEditor(page);

      await page.locator(editorSelectors.componentsSearch).fill(component.id);
      await page
        .locator(componentCardSelector(component.id))
        .dragTo(page.locator(editorSelectors.canvas), {
          targetPosition: { x: 240, y: 180 },
        });

      await expect(page.locator(component.signal).first()).toBeVisible();
      await expect(page.locator(`text=${component.emptyText}`)).toHaveCount(0);
    });
  }
});