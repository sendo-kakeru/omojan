import type { Decorator } from "@storybook/react-vite";

/**
 * ゲーム画面用のデコレータ
 * 実際のページレイアウト（root.tsx）を再現する
 */
export const gameScreenDecorator: Decorator = (Story) => (
	<div className="@container bg-tatami font-sans text-neutral-800">
		<div className="mx-auto grid min-h-svh max-w-800 px-16">
			<div>
				<Story />
			</div>
		</div>
	</div>
);

/**
 * ゲーム画面用のparameters
 */
export const gameScreenParameters = {
	backgrounds: { default: "none" },
	layout: "fullscreen",
} as const;
