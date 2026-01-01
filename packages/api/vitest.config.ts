import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globalSetup: "src/__tests__/vitest.setup.ts",
		globals: true,
		isolate: false,
		maxWorkers: 1,
	},
});
