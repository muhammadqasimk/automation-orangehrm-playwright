import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // ─── Test discovery ───────────────────────────────────────────────────────
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // ─── Execution ────────────────────────────────────────────────────────────
  fullyParallel: true,
  forbidOnly: !!process.env.CI,   // fail CI if test.only is committed
  retries: process.env.CI ? 2 : 2,
  workers: process.env.CI ? 2 : 2,

  // ─── Reporters ────────────────────────────────────────────────────────────
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true }],
    ['list'],
  ],

  // ─── Global test settings ─────────────────────────────────────────────────
  use: {
    baseURL: process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',

    // Capture on failure only — keeps report clean
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // Timeouts — increased for the slow shared demo site
    actionTimeout: 60_000,
    navigationTimeout: 120_000,
  },

  // Global timeout per test
  timeout: 180_000,
  expect: {
    timeout: 60_000,
  },

  // ─── Browser projects ─────────────────────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewport — covers TC-LOG-019
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/login.spec.ts',
    },
  ],

  // ─── Output ───────────────────────────────────────────────────────────────
  outputDir: 'test-results',
});
