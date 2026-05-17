import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/_tests_",
  fullyParallel: false, // séquentiel pour éviter conflits Supabase
  retries: 1,
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:8080",
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});