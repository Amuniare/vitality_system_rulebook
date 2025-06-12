const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './tests/output/failures',
  // MODIFICATION: Changed fullyParallel to false
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // MODIFICATION: Explicitly set workers to 1
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  
  // Configure project for a single browser
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  // Run local dev server before starting the tests
  webServer: {
    command: 'python -m http.server',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  // Set a very long timeout for the entire test file.
  // This is crucial because AI-driven tests are much slower.
  // 1 hour = 3,600,000 ms
  timeout: 3600000,

  // Set a timeout for each individual test (e.g., each journey)
  // 5 minutes = 300,000 ms
  expect: {
    timeout: 300000,
  },
});