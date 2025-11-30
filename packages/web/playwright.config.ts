import { defineConfig, devices } from "@playwright/test";

const API_URL = "http://localhost:8787";
const WEB_URL = "http://localhost:5173";

export default defineConfig({
	expect: {
		timeout: 15_000,
	},
	failOnFlakyTests: !!process.env.CI,
	forbidOnly: !!process.env.CI,
	fullyParallel: false,
	globalTeardown: "e2e/global-teardown.ts",
	outputDir: "e2e/playwright-report",
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	reporter: process.env.CI ? "github" : "list",
	retries: process.env.CI ? 2 : 0,
	testDir: "./e2e",
	timeout: 180_000,
	use: {
		baseURL: WEB_URL,
		trace: "retain-on-failure",
		video: "retain-on-failure",
	},
	webServer: [
		{
			command: "pnpm run dev:e2e",
			cwd: "../api",
			reuseExistingServer: !process.env.CI,
			timeout: 180_000,
			url: API_URL,
		},
		{
			command: "pnpm run dev",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
			url: WEB_URL,
		},
	],
	workers: process.env.CI ? 1 : undefined,
});
