import type { Room } from "@repo/db/models";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { JoinRoomDialog } from "./JoinRoomDialog";

const baseRoom: Omit<Room, "password"> = {
	gameId: "00000000-0000-0000-0000-0000000000a1" as Room["gameId"],
	isPrivate: false,
	players: [
		{
			id: "player_1" as Room["players"][number]["id"],
			image: null,
			isCpu: false,
			playerName: "画像未設定さん",
			userId: null,
		},
		{
			id: "player_2" as Room["players"][number]["id"],
			image: null,
			isCpu: true,
			playerName: "CPU",
			userId: null,
		},
	],
	timeLimit: 60,
	title: "楽しいお絵描き部屋",
};

const meta: Meta<typeof JoinRoomDialog> = {
	component: JoinRoomDialog,
	tags: ["autodocs"],
	title: "Home/JoinRoomDialog",
};

export default meta;
type Story = StoryObj<typeof JoinRoomDialog>;

// 公開部屋
export const LoggedIn: Story = {
	name: "公開部屋・ログイン済み",
	parameters: { authed: true },
	render: () => {
		const [isOpen, setIsOpen] = useState(true);
		return (
			<JoinRoomDialog isOpen={isOpen} room={baseRoom} setIsOpen={setIsOpen} />
		);
	},
};

// 鍵付き部屋
export const PrivateRoomGuest: Story = {
	name: "鍵付き部屋・未ログイン",
	parameters: { authed: false },
	render: () => {
		const [isOpen, setIsOpen] = useState(true);
		return (
			<JoinRoomDialog
				isOpen={isOpen}
				room={{ ...baseRoom, isPrivate: true, title: "身内限定部屋" }}
				setIsOpen={setIsOpen}
			/>
		);
	},
};
