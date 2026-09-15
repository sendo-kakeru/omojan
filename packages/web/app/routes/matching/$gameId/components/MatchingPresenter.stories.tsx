import type { MatchingParticipant } from "@repo/db/model";
import type { PlayerId } from "@repo/db/schema";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MatchingPresenter } from "./MatchingPresenter";

const noop = () => {};

const meta: Meta<typeof MatchingPresenter> = {
	component: MatchingPresenter,
	decorators: [
		(Story) => (
			<div className="mx-auto max-w-800">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Matching/MatchingPresenter",
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockParticipants: MatchingParticipant[] = [
	{
		id: "player-1" as PlayerId,
		image: "/favicon.svg",
		playerName: "プレイヤー1",
	},
	{
		id: "player-2" as PlayerId,
		image: "/favicon.svg",
		playerName: "プレイヤー2",
	},
	{
		id: "player-3" as PlayerId,
		image: null,
		playerName: "プレイヤー3",
	},
	{
		id: "player-4" as PlayerId,
		image: null,
		playerName: "プレイヤー4",
	},
];

const longNameParticipants: MatchingParticipant[] = [
	{
		id: "player-long-1" as PlayerId,
		image: "/favicon.svg",
		playerName: "非常に長いプレイヤー名の例ですこれはテストです",
	},
	{
		id: "player-long-2" as PlayerId,
		image: null,
		playerName: "Another Very Long Player Name Example For Testing",
	},
];

const defaultRoomMeta = {
	isPrivate: false,
	password: null,
	timeLimit: 60,
	title: "楽しい部屋",
};

const privateRoomMeta = {
	isPrivate: true,
	password: "ABC123",
	timeLimit: 120,
	title: "フレンド限定ルーム",
};

const defaultArgs = {
	isHost: false,
	isStarting: false,
	onExit: noop,
	onStart: noop,
};

export const OneParticipant: Story = {
	args: {
		...defaultArgs,
		isHost: true,
		participants: mockParticipants.slice(0, 1),
		roomMeta: defaultRoomMeta,
	},
	name: "1人参加",
};

export const TwoParticipants: Story = {
	args: {
		...defaultArgs,
		isHost: true,
		participants: mockParticipants.slice(0, 2),
		roomMeta: defaultRoomMeta,
	},
	name: "2人参加",
};

export const ThreeParticipants: Story = {
	args: {
		...defaultArgs,
		isHost: true,
		participants: mockParticipants.slice(0, 3),
		roomMeta: defaultRoomMeta,
	},
	name: "3人参加",
};

export const StartButtonDisabled: Story = {
	args: {
		...defaultArgs,
		isHost: true,
		participants: mockParticipants,
		roomMeta: defaultRoomMeta,
	},
	name: "4人参加（今すぐ開始無効）",
};

export const GuestWithFourParticipants: Story = {
	args: {
		...defaultArgs,
		participants: mockParticipants,
		roomMeta: defaultRoomMeta,
	},
	name: "4人参加（満員）",
};
export const GuestParticipants: Story = {
	args: {
		...defaultArgs,
		participants: mockParticipants.slice(0, 3),
		roomMeta: defaultRoomMeta,
	},
	name: "ゲスト",
};

export const HostStarting: Story = {
	args: {
		...defaultArgs,
		isHost: true,
		isStarting: true,
		participants: mockParticipants.slice(0, 2),
		roomMeta: defaultRoomMeta,
	},
	name: "ホスト - 開始処理中",
};

export const PrivateRoomGuest: Story = {
	args: {
		...defaultArgs,
		participants: mockParticipants.slice(0, 2),
		roomMeta: privateRoomMeta,
	},
	name: "プライベート部屋 - ゲスト",
};

export const PrivateRoomHost: Story = {
	args: {
		...defaultArgs,
		isHost: true,
		participants: mockParticipants.slice(0, 1),
		roomMeta: privateRoomMeta,
	},
	name: "プライベート部屋 - ホスト",
};

export const WithLongNames: Story = {
	args: {
		...defaultArgs,
		isHost: true,
		participants: longNameParticipants,
		roomMeta: {
			...defaultRoomMeta,
			title:
				"これは非常に長い部屋名の例です。どのように表示されるかテストします。",
		},
	},
	name: "長い名前のテスト",
};
