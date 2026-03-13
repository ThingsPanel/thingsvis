import { expect, test } from '@playwright/test';
import { gotoEditor } from './helpers/editor-bootstrap';
import { editorSelectors } from './helpers/selectors';

test.describe('editor core smoke', () => {
  test('loads the editor canvas and component registry in guest mode', async ({ page }) => {
    await gotoEditor(page);

    await expect(page.locator(editorSelectors.componentsSearch)).toBeVisible();
    await expect(page.locator(editorSelectors.componentCard).first()).toBeVisible();
  });
});
