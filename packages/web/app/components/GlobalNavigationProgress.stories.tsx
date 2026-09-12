import type { Meta, StoryObj } from "@storybook/react-vite";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { Button } from "./button/Button";
import { GlobalNavigationProgress } from "./GlobalNavigationProgress";

// 実際のアプリと同じく、ルーター直下に置いて遷移状態を拾わせる
function StoryLayout() {
	return (
		<>
			<GlobalNavigationProgress />
			<div className="grid justify-items-start gap-16 p-24 pt-32">
				<Outlet />
			</div>
		</>
	);
}

function delay({ ms }: { ms: number }): Promise<null> {
	return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

// 解決しない loader へ遷移させ、ローディング表示を出したままにする
const navigatingRouter = createMemoryRouter([
	{
		children: [
			{
				element: <p className="text-sm">遷移を開始しています。</p>,
				index: true,
			},
			{
				element: <p className="text-sm">このページには到達しません。</p>,
				loader: (): Promise<null> => new Promise(() => {}),
				path: "pending",
			},
		],
		element: <StoryLayout />,
		path: "/",
	},
]);
void navigatingRouter.navigate("/pending");

const linkNavigationRouter = createMemoryRouter([
	{
		children: [
			{
				element: (
					<>
						<p className="text-sm">
							リンクを押すと 1.5
							秒かかるページへ遷移し、その間だけ上端にバーが出る。
						</p>
						<Button as="link" to="/next">
							次のページへ
						</Button>
					</>
				),
				index: true,
			},
			{
				element: (
					<>
						<p className="text-sm">遷移が終わり、バーが消えた状態。</p>
						<Button as="link" color="gray" to="/">
							最初のページへ戻る
						</Button>
					</>
				),
				loader: (): Promise<null> => delay({ ms: 1500 }),
				path: "next",
			},
		],
		element: <StoryLayout />,
		path: "/",
	},
]);

const meta = {
	component: GlobalNavigationProgress,
	parameters: {
		// グローバルの BrowserRouter を外し、各ストーリーのメモリルーターを使う
		ownRouter: true,
	},
	tags: ["autodocs"],
	title: "Components/GlobalNavigationProgress",
} satisfies Meta<typeof GlobalNavigationProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Navigating: Story = {
	name: "遷移中",
	render: () => <RouterProvider router={navigatingRouter} />,
};

export const LinkNavigation: Story = {
	name: "リンク遷移で確認",
	render: () => <RouterProvider router={linkNavigationRouter} />,
};
