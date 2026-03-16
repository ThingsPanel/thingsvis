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
  { id: 'chart/echarts-bar', signal: 'canvas', emptyText: '暂无数据' },
  { id: 'chart/echarts-line', signal: 'canvas', emptyText: '等待数据' },
  { id: 'chart/echarts-gauge', signal: 'canvas', emptyText: '暂无数据' },
  { id: 'chart/uplot-line', signal: '.uplot', emptyText: '等待时序数据' },
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
            i18n: { zh: '时序图', en: 'Time Series' },
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
