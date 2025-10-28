import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globalSetup: "./src/test/vitest.setup.ts",
		globals: true,
		isolate: false,
		maxWorkers: 1,
		pool: "forks",
	},
});
