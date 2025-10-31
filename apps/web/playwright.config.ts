import { defineConfig, devices } from '@playwright/test';

// Constants for configuration
const CI_RETRIES = 2;
const CI_WORKERS = 1;
const BASE_PORT = 20000;

/**
 * Playwright configuration for CC Wrapper E2E tests
 */
export const config = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? CI_RETRIES : 0,
  workers: process.env.CI ? CI_WORKERS : undefined,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${BASE_PORT}`,
    trace: 'on-first-retry',
    // Prevent browser from stealing focus during tests
    launchOptions: {
      args: ['--disable-focus-ring', '--disable-background-timer-throttling']
    }
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
