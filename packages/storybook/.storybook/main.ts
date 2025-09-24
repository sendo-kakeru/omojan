import { dirname, join, resolve } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
	return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
	addons: [
		getAbsolutePath("@chromatic-com/storybook"),
		getAbsolutePath("@storybook/addon-docs"),
		getAbsolutePath("@storybook/addon-a11y"),
		getAbsolutePath("@storybook/addon-vitest"),
	],
	framework: {
		name: getAbsolutePath("@storybook/react-vite"),
		options: {},
	},
	stories: ["../../web/app/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	viteFinal: (config) => {
		if (!config.resolve) {
			config.resolve = {};
		}
		config.resolve.alias = {
			...config.resolve.alias,
			"~": resolve(__dirname, "../../web/app"),
		};
		return config;
	},
};
export default config;
