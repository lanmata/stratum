import { expect, test } from '@playwright/test';

async function login(page, password = 'secret') {
  await page.goto('/auth/login');
  await page.locator('#login-identifier').fill('e2e_user');
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  if (password !== 'wrong') await page.waitForURL(/\/dashboard/);
}

test('a wrong password keeps the person on the login page', async ({ page }) => {
  await login(page, 'wrong');
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('signing in lands on the dashboard, with the navigation', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Uso y accesos', exact: true })).toBeVisible();
});

test('the usage page draws the tiles and every chart from the reports', async ({ page }) => {
  await login(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Uso y accesos', exact: true }).click();
  await expect(page).toHaveURL(/\/usage/);
  await expect(page.locator('.usage-tile')).toHaveCount(4);
  await expect(page.locator('.usage-tile').first()).toContainText('363');
  // The lower charts load when their card scrolls into view (@defer on viewport).
  for (const heading of ['Accesos por hora del día', 'Día de la semana y franja', 'Accesos por mes']) {
    await page.getByRole('heading', { name: heading }).scrollIntoViewIfNeeded();
  }
  for (const chart of ['app-usage-area-chart', 'app-usage-donut-chart', 'app-usage-bar-list', 'app-usage-hour-columns', 'app-usage-heatmap', 'app-usage-column-chart']) {
    await expect(page.locator(`${chart} svg, ${chart} ul`).first()).toBeVisible();
  }
  await expect(page.locator('.usage-table tbody tr')).toHaveCount(2);
});

test('hovering the weekly chart shows the week under the pointer', async ({ page }) => {
  await login(page);
  await page.goto('/usage');
  const hit = page.locator('.usage-area-hit');
  await expect(hit).toBeVisible();
  await hit.hover(); // scrolls the chart into view and moves the pointer to its centre
  await expect(page.locator('.usage-tooltip')).toContainText('Semana del');
});

test('changing the period reloads the reports', async ({ page }) => {
  await login(page);
  await page.goto('/usage');
  const reload = page.waitForRequest((r) => r.url().includes('/reports/summary') && r.url().includes('from='));
  await page.locator('#usage-preset').selectOption('30');
  await reload;
  await expect(page.locator('.usage-board')).toBeVisible();
});
