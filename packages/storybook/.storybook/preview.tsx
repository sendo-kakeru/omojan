import { MOCK_ME } from "@repo/mock/model";
import type { Decorator, Preview } from "@storybook/react-vite";
import { BrowserRouter } from "react-router";
import { ToastProvider } from "../../web/app/components/Toast";
import { TooltipProvider } from "../../web/app/components/Tooltip";
import { MeContext } from "../../web/app/context/me/provider";
import "../style.css";

const decorator: Decorator = (Story, context) => {
	const providers = (
		<MeContext
			value={{
				isLoading: false,
				me: context.parameters.authed ? MOCK_ME : null,
				mutate: async () => {},
			}}
		>
			<TooltipProvider>
				<ToastProvider>
					<div className="font-sans text-neutral-800">
						<Story />
					</div>
				</ToastProvider>
			</TooltipProvider>
		</MeContext>
	);

	// useNavigation などデータルーター前提のフックを使うコンポーネントはストーリー側で RouterProvider を用意する。
	// Router の入れ子は例外になるため、BrowserRouter で包まない
	if (context.parameters.ownRouter) {
		return providers;
	}

	return <BrowserRouter>{providers}</BrowserRouter>;
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
