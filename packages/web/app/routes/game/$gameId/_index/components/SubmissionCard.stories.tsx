import type { Submission } from "@repo/db/schema";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { SubmissionCard } from "./SubmissionCard";

const meta: Meta<typeof SubmissionCard> = {
	component: SubmissionCard,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/SubmissionCard",
};

export default meta;
type Story = StoryObj<typeof SubmissionCard>;

// 確定カード（前置き）
export const ConfirmedPrefix: Story = {
	args: {
		position: "prefix",
		state: "confirmed",
		text: "激辛カレー",
	},
	name: "確定カード（前）",
};

// 確定カード（後置き）
export const ConfirmedSuffix: Story = {
	args: {
		position: "suffix",
		state: "confirmed",
		text: "カレー激辛",
	},
	name: "確定カード（後）",
};

// 組み合わせ選択（未選択）
export const SelectingNone: Story = {
	args: {
		onSelect: () => {},
		position: null,
		state: "selecting",
		theme: "カレー",
		word: "激辛",
	},
	name: "組み合わせ選択（未選択）",
};

// 組み合わせ選択（前を選択中）
export const SelectingPrefix: Story = {
	args: {
		onSelect: () => {},
		position: "prefix",
		state: "selecting",
		theme: "カレー",
		word: "激辛",
	},
	name: "組み合わせ選択（前を選択中）",
};

// 組み合わせ選択（後を選択中）
export const SelectingSuffix: Story = {
	args: {
		onSelect: () => {},
		position: "suffix",
		state: "selecting",
		theme: "カレー",
		word: "激辛",
	},
	name: "組み合わせ選択（後を選択中）",
};

// 組み合わせ選択（長い単語）
export const SelectingLongWords: Story = {
	args: {
		onSelect: () => {},
		position: null,
		state: "selecting",
		theme: "プログラミング",
		word: "よそはよそうちはうち",
	},
	name: "組み合わせ選択（長い単語）",
};

// インタラクティブ（操作可能）
export const Interactive: Story = {
	name: "インタラクティブ",
	render: () => {
		const [pending, setPending] = useState<Submission["position"] | null>(null);

		return (
			<div className="mx-auto grid max-w-480 gap-y-16 p-16">
				<p className="text-neutral-600 text-sm">
					選択中: {pending ?? "なし"}（同じ選択肢を2度クリックで確定）
				</p>
				<SubmissionCard
					onSelect={(position) => {
						if (pending === position) {
							alert(`確定: ${position}`);
							setPending(null);
						} else {
							setPending(position);
						}
					}}
					position={pending}
					state="selecting"
					theme="カレー"
					word="激辛"
				/>
			</div>
		);
	},
};

// 全状態一覧
export const AllStates: Story = {
	name: "全状態一覧",
	render: () => (
		<div className="mx-auto grid max-w-480 gap-y-32 p-16">
			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">
					組み合わせ選択（未選択）
				</p>
				<SubmissionCard
					onSelect={() => {}}
					position={null}
					state="selecting"
					theme="カレー"
					word="激辛"
				/>
			</div>
			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">
					組み合わせ選択（前を選択中）
				</p>
				<SubmissionCard
					onSelect={() => {}}
					position="prefix"
					state="selecting"
					theme="カレー"
					word="激辛"
				/>
			</div>
			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">
					確定カード（前）
				</p>
				<SubmissionCard position="prefix" state="confirmed" text="激辛カレー" />
			</div>
			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">
					確定カード（後）
				</p>
				<SubmissionCard position="suffix" state="confirmed" text="カレー激辛" />
			</div>
		</div>
	),
};
