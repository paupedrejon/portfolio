/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: "./scripts",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
};
