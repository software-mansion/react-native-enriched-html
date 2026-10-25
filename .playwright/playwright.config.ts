import { defineConfig, devices } from '@playwright/test';

const port = process.env.PW_PORT ?? '5173';

// By default, the browser runs in the official Playwright Linux container
// (started by scripts/run-tests.sh) so screenshots render identically on every
// machine and in CI. Set PW_LOCAL_BROWSER=1 to use a locally installed browser
// instead, e.g. for headed debugging - screenshot assertions won't match then.
const connectOptions = process.env.PW_LOCAL_BROWSER
  ? undefined
  : {
      wsEndpoint: process.env.PW_WS_ENDPOINT ?? 'ws://127.0.0.1:3000/',
      // Lets the containerised browser reach the Vite server on host localhost.
      exposeNetwork: '<loopback>',
    };

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  snapshotDir: './screenshots',
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixels: 0,
    },
  },
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './playwright-report' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? `http://localhost:${port}`,
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    permissions: ['clipboard-read', 'clipboard-write'],
    connectOptions,
  },

  webServer: {
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    command: `yarn workspace react-native-enriched-web-example dev -- --host localhost --port ${port}`,
    url: `http://localhost:${port}`,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
