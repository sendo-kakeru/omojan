import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SelectSubmissionCard } from "./SelectSubmissionCard";

const meta: Meta<typeof SelectSubmissionCard> = {
	component: SelectSubmissionCard,
	decorators: [
		(Story) => (
			<div className="w-full">
				<Story />
			</div>
		),
	],
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	title: "Game/SelectSubmissionCard",
};

export default meta;
type Story = StoryObj<typeof SelectSubmissionCard>;

// 他プレイヤーの番 - 待機状態
export const Idle: Story = {
	args: {
		label: "前",
		state: "idle",
	},
	name: "待機中（他プレイヤーの番）",
};

// 自分の番 - 手札未選択
export const ReadyDisabled: Story = {
	args: {
		disabled: true,
		label: "前",
		onSelect: () => {},
		state: "ready",
	},
	name: "準備完了（手札未選択）",
};

// 自分の番 - 手札選択済み
export const ReadyEnabled: Story = {
	args: {
		label: "前",
		onSelect: () => {},
		state: "ready",
	},
	name: "準備完了（手札選択済み）",
};

// 選択中（決定ボタン表示中）
export const Selected: Story = {
	args: {
		label: "前",
		onConfirm: async () => {},
		state: "selected",
		word: "激辛",
	},
	name: "選択中（決定ボタン表示）",
};

// 配置完了
export const Placed: Story = {
	args: {
		label: "前",
		state: "placed",
		word: "激辛",
	},
	name: "配置完了",
};

// インタラクティブデモ
export const Interactive: Story = {
	name: "インタラクティブデモ",
	render: function InteractiveDemo() {
		const [selectedWord, setSelectedWord] = useState<string | undefined>(
			undefined,
		);
		const [isSelected, setIsSelected] = useState(false);
		const [confirmedWord, setConfirmedWord] = useState<string | undefined>(
			undefined,
		);

		const handleSelect = () => {
			setIsSelected(true);
		};

		const handleConfirm = async () => {
			setConfirmedWord(selectedWord);
			setIsSelected(false);
			setSelectedWord(undefined);
		};

		const handleReset = () => {
			setSelectedWord(undefined);
			setIsSelected(false);
			setConfirmedWord(undefined);
		};

		const handleSelectHand = (word: string) => {
			if (confirmedWord) return;
			setSelectedWord(word);
			setIsSelected(false);
		};

		const getProps = () => {
			if (confirmedWord) {
				return { state: "placed" as const, word: confirmedWord };
			}
			if (isSelected && selectedWord) {
				return {
					onConfirm: handleConfirm,
					state: "selected" as const,
					word: selectedWord,
				};
			}
			return {
				disabled: !selectedWord,
				onSelect: handleSelect,
				state: "ready" as const,
			};
		};

		return (
			<div className="flex w-320 flex-col gap-y-16">
				<SelectSubmissionCard label="前" {...getProps()} />
				<div className="flex flex-wrap gap-8">
					{["激辛", "究極", "おふくろ"].map((word) => (
						<button
							className={`rounded border px-8 py-4 text-sm ${
								selectedWord === word
									? "border-green-400 bg-green-50"
									: confirmedWord === word
										? "border-green-500 bg-green-100 opacity-50"
										: "border-gray-200 bg-gray-100"
							}`}
							disabled={confirmedWord === word}
							key={word}
							onClick={() => handleSelectHand(word)}
							type="button"
						>
							{word}
						</button>
					))}
				</div>
				<button
					className="rounded bg-gray-200 px-8 py-4 text-sm"
					onClick={handleReset}
					type="button"
				>
					リセット
				</button>
			</div>
		);
	},
};

// 全状態一覧
export const AllStates: Story = {
	name: "全状態一覧",
	render: () => (
		<div className="grid gap-y-24">
			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">
					待機中（他プレイヤーの番）
				</p>
				<div className="w-280">
					<SelectSubmissionCard label="前" state="idle" />
				</div>
			</div>

			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">
					準備完了（手札未選択）
				</p>
				<div className="w-280">
					<SelectSubmissionCard
						disabled
						label="前"
						onSelect={() => {}}
						state="ready"
					/>
				</div>
			</div>

			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">
					準備完了（手札選択済み）
				</p>
				<div className="w-280">
					<SelectSubmissionCard label="前" onSelect={() => {}} state="ready" />
				</div>
			</div>

			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">
					選択中（決定ボタン表示）
				</p>
				<div className="w-280">
					<SelectSubmissionCard
						label="前"
						onConfirm={async () => {}}
						state="selected"
						word="激辛"
					/>
				</div>
			</div>

			<div>
				<p className="mb-8 font-bold text-neutral-600 text-sm">配置完了</p>
				<div className="w-280">
					<SelectSubmissionCard label="前" state="placed" word="激辛" />
				</div>
			</div>
		</div>
	),
};
