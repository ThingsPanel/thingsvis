import { expect, test } from '@playwright/test';
import { createSmokeInitPayload } from './fixtures/dashboard-fixtures';
import { gotoEmbed, postHostMessage } from './helpers/editor-bootstrap';
import { mockSmokeRegistry } from './helpers/network-mocks';

const SMOKE_COMPONENTS = [
  { id: 'chart/echarts-bar', signal: 'canvas' },
  { id: 'chart/echarts-line', signal: 'canvas' },
  { id: 'chart/echarts-gauge', signal: 'canvas' },
  { id: 'basic/table', signal: 'table' },
] as const;

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
});
