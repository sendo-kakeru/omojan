import type { GameServerSubmissionMessage } from "@repo/db/model";
import type { PlayerCardId } from "@repo/db/schema";
import classNames from "classnames";
import { useState } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { CircularTimerProgress } from "~/components/CircularTimerProgress";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import {
	SelectSubmissionCard,
	type SelectSubmissionCardProps,
} from "./SelectSubmissionCard";

type Position = "prefix" | "suffix";

export function GameSubmission({
	data,
}: {
	data: GameServerSubmissionMessage;
}) {
	const { currentPlayerId, game, mePlayer } = data;
	const isMyTurn = currentPlayerId === mePlayer.id;
	const isStarting = data.type === "ROUND_START";
	// 選択中のカードID（確定前後どちらでも保持）
	const [selectedCardId, setSelectedCardId] = useState<PlayerCardId | null>(
		null,
	);
	// 選択中の配置位置（確定前はnull）
	const [pendingPosition, setPendingPosition] = useState<Position | null>(null);
	// 確定した配置位置
	const [confirmedPosition, setConfirmedPosition] = useState<Position | null>(
		null,
	);
	const selectedCard = mePlayer.playerCards.find(
		(card) => card.id === selectedCardId,
	);
	const isConfirmed = confirmedPosition !== null;

	// 組み合わせ文字列を生成
	const createCombination = ({
		text,
		position,
	}: {
		text: string | null | undefined;
		position: Position | null | undefined;
	}): string | null => {
		if (!text || !position) return null;
		return position === "prefix"
			? `${text}${game.theme}`
			: `${game.theme}${text}`;
	};

	// SelectSubmissionCardのpropsを生成
	const buildSelectSubmissionCardProps = (
		position: Position,
	): SelectSubmissionCardProps => {
		const label = position === "prefix" ? "前" : "後";

		// 自分のターンで確定済み
		if (isMyTurn && selectedCard && confirmedPosition === position) {
			return {
				label,
				state: "placed",
				word: selectedCard.word,
			};
		}
		// 自分のターンで選択中（決定ボタン表示）
		if (isMyTurn && selectedCard && pendingPosition === position) {
			return {
				label,
				onConfirm: () => {
					if (!selectedCard || !pendingPosition) return;
					setConfirmedPosition(pendingPosition);
					setPendingPosition(null);
				},
				state: "selected",
				word: selectedCard.word,
			};
		}
		// 他プレイヤーのターンで提出済み（提出結果表示）
		if (!isMyTurn && game.submitted && game.submitted.position === position) {
			return {
				label,
				state: "placed",
				word: game.submitted.text,
			};
		}
		// 自分の番ではない、または確定済み
		if (!isMyTurn || isConfirmed) {
			return { label, state: "idle" };
		}
		// 選択待ち
		return {
			disabled: !selectedCard,
			label,
			onSelect: () => {
				if (!selectedCard || isConfirmed) return;
				setPendingPosition(position);
			},
			state: "ready",
		};
	};

	const getMessage = () => {
		if (isStarting) {
			return "";
		}
		if (isMyTurn) {
			return "あなたの番です。面白いと思う組み合わせを選んでください。";
		}
		return "他のプレイヤーの提出を待っています…";
	};

	return (
		<>
			{isStarting && (
				<div className="fixed inset-0 z-80 flex justify-center pt-80 bg-gray-300/50">
					<div className="rounded-xl bg-white px-32 h-fit py-16 flex flex-col gap-y-16 justify-center items-center shadow-lg aspect-square">
						<Spinner className="size-32 text-gray-400" />
						<p className="mt-8 text-neutral-700 text-sm">
							まもなく開始します...
						</p>
					</div>
				</div>
			)}
			<div className="grid h-full grid-rows-[auto_1fr] gap-y-8 pt-8 xs:pt-16">
				<nav className="flex w-full items-center gap-x-8">
					<div className="grid w-fit place-items-center rounded-lg border border-gray-200 bg-white px-8 py-2 font-mono text-neutral-600">
						<span className="text-xs">Round</span>
						<div className="flex items-center">
							<span className="text-base">{game.roundNo}</span>/
							<span className="text-base">4</span>
						</div>
					</div>
					<p
						className={classNames(
							"flex-1 rounded-lg border px-8 py-2 text-sm",
							isMyTurn
								? "border-yellow-300 bg-white text-yellow-600"
								: "border-gray-200 bg-gray-50 text-neutral-500",
						)}
					>
						{getMessage()}
					</p>
					<CircularTimerProgress label={game.timeLimit} progress={100} />
				</nav>
				<main className="grid grid-rows-[auto_1fr_auto]">
					<section className="grid rounded-lg border border-gray-200 bg-white">
						{game.players.map((player, index) => {
							const isSelf = player.id === mePlayer.id;
							const combination = createCombination({
								position: isSelf
									? (confirmedPosition ?? pendingPosition)
									: player.submission?.position,
								text: isSelf ? selectedCard?.word : player.submission?.text,
							});

							return (
								<div className="w-full" key={player.id}>
									<div
										className={classNames(
											"flex items-center gap-x-8 rounded-lg px-8 py-4 md:px-12",
											isSelf && "border border-green-400 bg-green-50",
										)}
									>
										<Avatar
											name={player.playerName}
											size="S"
											src={player.image ?? undefined}
										/>
										<div className="grid flex-1 gap-y-1 md:gap-y-2">
											<p className="font-semibold text-xs">
												{player.playerName}
												{isSelf && (
													<span className="font-normal text-neutral-300">
														（自分）
													</span>
												)}
											</p>
											<Badge
												className={classNames(!combination && "opacity-0")}
											>
												{combination ?? "未選択"}
											</Badge>
										</div>
										<Badge color="gray">{player.winCount}勝</Badge>
									</div>
									{index !== game.players.length - 1 && <Separator />}
								</div>
							);
						})}
					</section>

					<section className="mt-8 grid place-items-center rounded-t-2xl border border-gray-300 border-b-0 bg-white p-16">
						<div className="grid w-full max-w-480 place-items-center gap-y-16 sm:gap-y-24">
							<SelectSubmissionCard
								{...buildSelectSubmissionCardProps("prefix")}
							/>
							<p className="grid min-h-56 xs:min-h-64 w-full place-items-center rounded-md border border-yellow-300 bg-yellow-50 p-8 px-12 font-bold text-sm shadow sm:text-base">
								{game.theme}
							</p>
							<SelectSubmissionCard
								{...buildSelectSubmissionCardProps("suffix")}
							/>
						</div>
					</section>

					<section className="mx-[calc(50%-50cqw)] w-[100cqw] border-t-2 border-t-gray-300 bg-white py-8 xs:pt-16 sm:py-24">
						<div className="mx-auto flex max-w-800 flex-wrap gap-8 px-16">
							{mePlayer.playerCards.map((card) => {
								const isSelected = card.id === selectedCardId;
								return (
									<button
										className={classNames(
											"flex rounded-md border px-8 py-4 text-center font-bold text-neutral-800 text-sm xs:text-base transition sm:text-lg",
											card.used
												? "cursor-not-allowed border-gray-300 bg-gray-200 opacity-50"
												: isSelected && isConfirmed
													? "border-green-500 bg-green-100 opacity-50"
													: isSelected
														? "border-green-400 bg-green-50 shadow-sm"
														: "border-gray-200 bg-gray-100 hover:bg-green-50",
										)}
										disabled={card.used || isConfirmed || !isMyTurn}
										key={card.id}
										onClick={() => {
											if (isConfirmed || card.used) return;
											setSelectedCardId(card.id);
											setPendingPosition(null);
										}}
										type="button"
									>
										{card.word}
									</button>
								);
							})}
						</div>
					</section>
				</main>
			</div>
		</>
	);
}
