import type { Meta, StoryObj } from "@storybook/react-vite";
import { IoMdMail } from "react-icons/io";
import { Link } from "react-router";
import { Button } from "./button/Button";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "./DropdownMenu";

const meta = {
	component: DropdownMenu,
	tags: ["autodocs"],
	title: "Components/DropdownMenu",
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

function Template({ label }: { label: string }) {
	return (
		<div className="grid">
			<p>{label}</p>
			<DropdownMenu
				trigger={
					<Button as="button" isIconOnly type="button">
						<IoMdMail />
					</Button>
				}
			>
				<DropdownMenuItem asChild>
					<Link to="/">プロフィール</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link to="/">アカウント設定</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<button onClick={() => console.log("ログアウト")} type="button">
						ログアウト
					</button>
				</DropdownMenuItem>
			</DropdownMenu>
		</div>
	);
}

export const Default: Story = {
	render: () => (
		<div className="grid grid-cols-1 gap-y-32 px-8 py-32">
			<div className="flex">
				<Template label="Left:" />
			</div>
			<div className="flex justify-center">
				<Template label="Center:" />
			</div>
			<div className="flex justify-end">
				<Template label="Right:" />
			</div>
		</div>
	),
};
