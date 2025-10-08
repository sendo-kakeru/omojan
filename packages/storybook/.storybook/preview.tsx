import type { Preview } from "@storybook/react-vite";
import { BrowserRouter } from "react-router";
import { ToastProvider } from "../../web/app/components/Toast";
import { MeProvider } from "../../web/app/features/me/context/provider";
import "../style.css";
import type { ReactNode } from "react";

const decorator = (Story: () => ReactNode) => {
	return (
		<BrowserRouter>
			<MeProvider>
				<ToastProvider>
					<div className="font-[Inter] text-neutral-800">
						<Story />
					</div>
				</ToastProvider>
			</MeProvider>
		</BrowserRouter>
	);
};

const preview: Preview = {
	decorators: [decorator],
	initialGlobals: {
		backgrounds: { value: "Gray" },
	},

	parameters: {
		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: "todo",
		},
		backgrounds: {
			options: {
				dark: { name: "Dark", value: "#333" },
				gray: { name: "Gray", value: "#eee" },
				light: { name: "Light", value: "#F7F9F2" },
			},
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
