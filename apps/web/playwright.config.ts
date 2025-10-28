import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for CC Wrapper E2E tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:20000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'cd apps/web && bun run dev',
    url: 'http://localhost:20000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
