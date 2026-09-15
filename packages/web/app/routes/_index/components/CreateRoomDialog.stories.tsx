import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { CreateRoomDialog } from "./CreateRoomDialog";

const meta: Meta<typeof CreateRoomDialog> = {
	component: CreateRoomDialog,
	tags: ["autodocs"],
	title: "Home/CreateRoomDialog",
};

export default meta;
type Story = StoryObj<typeof CreateRoomDialog>;

// ログイン済み
export const LoggedIn: Story = {
	name: "ログイン済み",
	parameters: { authed: true },
	render: () => {
		const [isOpen, setIsOpen] = useState(true);
		return <CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />;
	},
};

// 未ログイン
export const Guest: Story = {
	name: "未ログイン",
	parameters: { authed: false },
	render: () => {
		const [isOpen, setIsOpen] = useState(true);
		return <CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />;
	},
};
