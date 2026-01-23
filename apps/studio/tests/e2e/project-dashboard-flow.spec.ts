import { test, expect } from '@playwright/test';

test('login, create project, create dashboard, list visible', async ({ page }) => {
  const email = 'mr_zhaojie@126.com';
  const password = '12345678';

  await page.goto('/login');
  await page.getByLabel('邮箱').fill(email);
  await page.getByLabel('密码').fill(password);
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page).toHaveURL(/\/editor/);

  // Open project dialog (Ctrl+O)
  await page.keyboard.press('Control+O');
  await expect(page.getByText('打开画布')).toBeVisible();

  // If no projects exist, create one
  if (await page.getByText('还没有项目').isVisible()) {
    await page.getByPlaceholder('输入项目名称').fill(`自动化项目-${Date.now()}`);
    await page.getByRole('button', { name: '创建项目' }).click();
  }

  // Re-open dialog to ensure lists rendered
  await page.keyboard.press('Control+O');
  await expect(page.getByText('打开画布')).toBeVisible();

  // Create a new dashboard under selected project
  const newDashboardButton = page.getByRole('button', { name: '新建画布' });
  await expect(newDashboardButton).toBeEnabled();
  await newDashboardButton.click();

  // Open dialog again and verify dashboards list is not empty
  await page.keyboard.press('Control+O');
  await expect(page.getByText('打开画布')).toBeVisible();
  await expect(page.getByText('还没有画布')).not.toBeVisible();
});
