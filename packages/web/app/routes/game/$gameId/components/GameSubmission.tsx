import classNames from "classnames";
import { useMemo, useState } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { CircularTimerProgress } from "~/components/CircularTimerProgress";
import { Separator } from "~/components/Separator";
import { SelectSubmissionCard } from "./SelectSubmissionCard";

export const handle = { hideHeader: true };

type Player = {
	name: string;
	icon?: string;
	submitted: boolean;
	combination?: string;
	isSelf?: boolean;
};

type HandCard = {
	id: string;
	word: string;
};

type PlacementPosition = "prefix" | "suffix" | null;

export function GameSubmission() {
	const themeWord = "カレー";
	const isMyTurn = true; // TODO: 実際のゲーム状態から取得

	const handCards: HandCard[] = useMemo(
		() => [
			{ id: "h1", word: "激辛" },
			{ id: "h2", word: "思いもよらぬ" },
			{ id: "h3", word: "おふくろ" },
			{ id: "h4", word: "生麦生米" },
			{ id: "h5", word: "ジャーナリズムのかけらもない" },
			{ id: "h6", word: "プリン" },
			{ id: "h7", word: "よそはよそうちは" },
		],
		[],
	);

	// 選択中の手札
	const [selectedHand, setSelectedHand] = useState<HandCard | null>(null);
	// 配置候補中かどうか（決定ボタン表示中）
	const [candidatePosition, setCandidatePosition] =
		useState<PlacementPosition>(null);
	// 確定した配置
	const [confirmedPlacement, setConfirmedPlacement] = useState<{
		position: PlacementPosition;
		card: HandCard | null;
	}>({ card: null, position: null });

	// カードをタップして配置位置を選択
	const handleSelectPosition = (position: "prefix" | "suffix") => {
		if (!selectedHand) return;
		setCandidatePosition(position);
	};

	// 決定ボタンを押して確定
	const handleConfirm = () => {
		if (!selectedHand || !candidatePosition) return;
		setConfirmedPlacement({
			card: selectedHand,
			position: candidatePosition,
		});
		setCandidatePosition(null);
		setSelectedHand(null);
	};

	// 手札を選択
	const handleSelectHand = (card: HandCard) => {
		if (confirmedPlacement.card?.id === card.id) return;
		setSelectedHand(card);
		setCandidatePosition(null);
	};

	// 表示する組み合わせを計算
	const getCombination = () => {
		const card = confirmedPlacement.card ?? selectedHand;
		if (!card) return null;
		if (
			confirmedPlacement.position === "prefix" ||
			candidatePosition === "prefix"
		) {
			return `${card.word}${themeWord}`;
		}
		if (
			confirmedPlacement.position === "suffix" ||
			candidatePosition === "suffix"
		) {
			return `${themeWord}${card.word}`;
		}
		return null;
	};

	const players: Player[] = [
		{
			combination: getCombination() ?? undefined,
			icon: undefined,
			isSelf: true,
			name: "自分",
			submitted: !!confirmedPlacement.card,
		},
		{
			combination: "究極カレー",
			icon: undefined,
			name: "さとう",
			submitted: true,
		},
		{
			icon: undefined,
			name: "たなか",
			submitted: false,
		},
		{
			combination: "カレー職人",
			icon: undefined,
			name: "やまもと",
			submitted: true,
		},
	];

	// SelectSubmissionCardのpropsを生成
	const getCardProps = (position: "prefix" | "suffix") => {
		// 確定済み
		if (confirmedPlacement.position === position && confirmedPlacement.card) {
			return {
				state: "placed" as const,
				word: confirmedPlacement.card.word,
			};
		}
		// 選択中（決定ボタン表示）
		if (candidatePosition === position && selectedHand) {
			return {
				onConfirm: handleConfirm,
				state: "selected" as const,
				word: selectedHand.word,
			};
		}
		// 自分の番かどうか
		if (!isMyTurn) {
			return { state: "idle" as const };
		}
		// 準備完了（手札選択状態に応じてdisabled）
		return {
			disabled: !selectedHand,
			onSelect: () => handleSelectPosition(position),
			state: "ready" as const,
		};
	};

	return (
		<div className="grid h-full grid-rows-[auto_1fr] gap-y-8 pt-8 xs:pt-16">
			<nav className="flex w-full items-center gap-x-8">
				<p className="grid w-fit place-items-center rounded-lg border border-gray-200 bg-white px-8 py-2 font-mono text-gray-600">
					<span className="text-xs">Round</span>
					<div className="flex items-center">
						<span className="text-base">3</span>/
						<span className="text-base">4</span>
					</div>
				</p>
				<p className="flex-1 rounded-lg border border-yellow-300 bg-white px-8 py-2 text-sm text-yellow-600">
					{/* あなたの番です。 */}
					あなたの番です。面白いと思う組み合わせを選んでください。
				</p>
				<CircularTimerProgress label={10} progress={60} />
			</nav>
			<main className="grid">
				<div className="grid grid-rows-[auto_1fr_auto]">
					<section className="grid rounded-lg border border-gray-200 bg-white">
						{players.map((player, index) => (
							<div className="w-full" key={player.name}>
								<div
									className={classNames(
										"flex items-center gap-x-8 rounded-lg px-8 py-4 md:px-12",
										player.isSelf ? "border border-green-400 bg-green-50" : "",
									)}
								>
									<Avatar
										className={classNames(
											player.isSelf && "ring-2 ring-green-400",
										)}
										name={player.name}
										size="S-M"
									/>
									<div className="grid gap-y-1 md:gap-y-2">
										<p className="font-semibold text-sm md:text-base">
											{player.name}
										</p>
										<Badge
											className={classNames(!player.combination && "opacity-0")}
											color="gray"
										>
											{player.combination ?? "未選択"}
										</Badge>
									</div>
								</div>
								{index !== players.length - 1 && <Separator />}
							</div>
						))}
					</section>

					<section className="mt-8 xs:mt-16 grid place-items-center rounded-t-2xl border border-gray-300 border-b-0 bg-white p-16">
						<div className="grid w-full max-w-480 place-items-center gap-y-16 sm:gap-y-24">
							<SelectSubmissionCard label="前" {...getCardProps("prefix")} />
							<p className="grid min-h-56 xs:min-h-64 w-full place-items-center rounded-md border border-yellow-300 bg-yellow-50 p-8 px-12 font-bold text-sm shadow sm:text-base">
								{themeWord}
							</p>
							<SelectSubmissionCard label="後" {...getCardProps("suffix")} />
						</div>
					</section>

					<section className="mx-[calc(50%-50cqw)] w-[100cqw] border-t-2 border-t-gray-300 bg-white py-8 xs:pt-16 sm:py-24">
						<div className="mx-auto flex max-w-800 flex-wrap gap-8 px-16">
							{handCards.map((card) => {
								const isSelected = card.id === selectedHand?.id;
								const isConfirmed = card.id === confirmedPlacement.card?.id;
								return (
									<button
										className={classNames(
											"flex rounded-md border px-8 py-4 text-center font-bold text-gray-800 text-sm xs:text-base transition sm:text-lg",
											isConfirmed
												? "border-green-500 bg-green-100 opacity-50"
												: isSelected
													? "border-green-400 bg-green-50 shadow-sm"
													: "border-gray-200 bg-gray-100 hover:bg-green-50",
										)}
										disabled={isConfirmed}
										key={card.id}
										onClick={() => handleSelectHand(card)}
										type="button"
									>
										{card.word}
									</button>
								);
							})}
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}
