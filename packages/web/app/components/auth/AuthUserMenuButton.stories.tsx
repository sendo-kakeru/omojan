import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { AuthUserMenuButton } from "./AuthUserMenuButton";

const meta = {
	component: AuthUserMenuButton,
	tags: ["autodocs"],
	title: "Components/Auth/AuthUserMenuButton",
} satisfies Meta<typeof AuthUserMenuButton>;

export default meta;
type Story = StoryObj<typeof AuthUserMenuButton>;

const USERS = [
	{
		image: "/favicon.ico",
		name: "John Doe",
	},
	null, // 未ログイン
] as const satisfies ComponentProps<typeof AuthUserMenuButton>["user"][];

export const Default: Story = {
	args: {},
	render: () => (
		<div className="grid h-400 w-full grid-cols-1">
			{USERS.map((user, index) => (
				<div
					className="grid grid-cols-1 place-items-center gap-y-8"
					// biome-ignore lint/suspicious/noArrayIndexKey: キーに適切な値がない
					key={index}
				>
					<p className="w-full">{user ? "ログイン中:" : "未ログイン:"}</p>
					<AuthUserMenuButton user={user} />
				</div>
			))}
		</div>
	),
};
