import { defineConfig } from '@playwright/test';

const port = process.env.E2E_PORT ?? '4443';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.spec.mjs',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `https://localhost:${port}`,
    ignoreHTTPSErrors: true,
    // The Chrome already installed on the machine (and on GitHub's runners): no browser download.
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: { command: 'node e2e/stack.mjs', url: `https://localhost:${port}/healthz`, ignoreHTTPSErrors: true, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
