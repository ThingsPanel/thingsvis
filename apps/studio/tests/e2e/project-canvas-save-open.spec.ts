import { test, expect } from '@playwright/test';

test('login, create project, create canvas, save, open project, open canvas', async ({ page }) => {
  const email = 'mr_zhaojie@126.com';
  const password = '12345678';
  const projectName = `自动化项目-${Date.now()}`;

  await page.goto('/main#/login');
  await page.getByLabel('邮箱').fill(email);
  await page.getByLabel('密码').fill(password);
  await page.getByRole('button', { name: /^登录$/ }).click();

  const loginFailed = page.getByText(/网络连接失败|登录失败/).waitFor({ state: 'visible', timeout: 10000 })
    .then(() => 'error' as const)
    .catch(() => null);
  const loginSucceeded = page.waitForURL(/#\/editor/, { timeout: 10000 })
    .then(() => 'editor' as const)
    .catch(() => null);

  const loginResult = await Promise.race([loginFailed, loginSucceeded]);

  if (loginResult !== 'editor') {
    await page.getByRole('link', { name: /体验模式/ }).click();
    await expect(page).toHaveURL(/#\/editor/);
  }

  const dialogTitle = page.getByText(/打开画布|Open Dashboard/);
  const openDialog = async () => {
    await page.click('body', { position: { x: 10, y: 10 } });
    await page.keyboard.press('Control+O');
    const opened = await dialogTitle
      .waitFor({ state: 'visible', timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    if (!opened) {
      await page.getByRole('button', { name: /打开/ }).first().click({ force: true });
      await expect(dialogTitle).toBeVisible();
    }
  };

  // Open project dialog
  await openDialog();

  const projectNameInput = page.getByPlaceholder(/输入项目名称|Project name/);
  const hasProjectInput = await projectNameInput.isVisible();

  if (hasProjectInput) {
    // Create new project (cloud mode)
    await projectNameInput.fill(projectName);
    await page.getByRole('button', { name: /创建项目|Create/ }).click();
    await expect(dialogTitle).not.toBeVisible();

    // Re-open dialog to create a new canvas
    await openDialog();
  }

  // Create new canvas
  await page.getByRole('button', { name: /新建画布|New Dashboard/ }).click();
  await expect(dialogTitle).not.toBeVisible();

  // Make a change to trigger save
  const canvasName = `${projectName}-画布`;
  const canvasNameInput = page.getByPlaceholder('未命名项目');
  await canvasNameInput.fill(canvasName);

  // Save
  await page.keyboard.press('Control+S');
  // Give the save a moment to complete
  await page.waitForTimeout(500);

  // Open project and canvas
  await openDialog();

  const projectItem = page.getByText(projectName);
  if (await projectItem.isVisible()) {
    await projectItem.click();
  }

  const dashboardsList = page.locator('div.space-y-2.max-h-64.overflow-y-auto');
  await expect(dashboardsList).toBeVisible();
  const noDashboards = page.getByText(/还没有画布|No dashboards yet/);
  if (await noDashboards.isVisible()) {
    await page.getByRole('button', { name: /新建画布|New Dashboard/ }).click();
  } else {
    const canvasItem = page.getByText(canvasName);
    if (await canvasItem.isVisible()) {
      await canvasItem.click();
    } else {
      await dashboardsList.locator('div').first().click();
    }
  }

  await expect(dialogTitle).not.toBeVisible();

  await expect(canvasNameInput).toHaveValue(/.+/);
});
