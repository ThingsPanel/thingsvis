import { expect, test } from '@playwright/test';
import { createBoundTableInitPayload } from './fixtures/dashboard-fixtures';
import { TABLE_ROWS_INITIAL, TABLE_ROWS_UPDATED } from './fixtures/widget-data-fixtures';
import { gotoEmbed, postEditorEvent, postHostMessage } from './helpers/editor-bootstrap';
import { mockSmokeRegistry } from './helpers/network-mocks';

test.describe('widget refresh', () => {
  test('table widget re-renders after host updateData messages', async ({ page }) => {
    await mockSmokeRegistry(page);
    await gotoEmbed(page);
    await postHostMessage(page, 'tv:init', createBoundTableInitPayload());

    await expect(page.locator('table')).toBeVisible();

    await postEditorEvent(page, 'updateData', { rows: TABLE_ROWS_INITIAL });
    await expect(page.getByText(TABLE_ROWS_INITIAL[0].name)).toBeVisible();

    await postEditorEvent(page, 'updateData', { rows: TABLE_ROWS_UPDATED });
    await expect(page.getByText(TABLE_ROWS_UPDATED[0].name)).toBeVisible();
    await expect(page.getByText(TABLE_ROWS_INITIAL[0].name)).toHaveCount(0);
  });
});
