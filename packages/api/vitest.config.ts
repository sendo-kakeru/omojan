import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		globals: true,
		isolate: false,
		maxWorkers: 1,
	},
});
