import type { GameServerVoteMessage } from "@repo/db/model";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Button } from "~/components/button/Button";
import { CircularTimerProgress } from "~/components/CircularTimerProgress";
import { Separator } from "~/components/Separator";
import { useCountdown } from "~/hooks/useCountdown";
import { createCombination } from "../libs/gameUtils";

export function GameVote({ data }: { data: GameServerVoteMessage }) {
	const { game, mePlayer } = data;

	const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
	const [confirmedPlayerId, setConfirmedPlayerId] = useState<string | null>(
		null,
	);

	const { count, progress, start: startCountdown } = useCountdown();

	// 組み合わせ文字列を生成

	const handleConfirmVote = () => {
		if (!selectedPlayerId) return;
		setConfirmedPlayerId(selectedPlayerId);
		// TODO: サーバーに投票を送信
	};

	const selectedPlayer = game.players.find(
		(player) => player.id === selectedPlayerId,
	);
	const confirmedPlayer = game.players.find(
		(player) => player.id === confirmedPlayerId,
	);

	useEffect(() => {
		startCountdown(10);
	}, [startCountdown]);

	return (
		<div className="grid h-full grid-rows-[auto_1fr] gap-y-8 pt-8 xs:pt-16 pb-16">
			<nav className="flex w-full items-center gap-x-8">
				<p className="grid w-fit place-items-center rounded-lg border border-gray-200 bg-white px-8 py-2 font-mono text-neutral-600">
					<span className="text-xs">Round</span>
					<div className="flex items-center">
						<span className="text-base">{game.roundNo}</span>/
						<span className="text-base">4</span>
					</div>
				</p>
				<p
					className={classNames(
						"flex-1 rounded-lg border bg-white px-8 py-2 text-sm",
						confirmedPlayerId
							? "border-gray-300 bg-gray-50 text-neutral-500"
							: "border-green-300 text-green-600",
					)}
				>
					{confirmedPlayerId
						? "投票が完了しました。"
						: "最も面白いと思う組み合わせに投票してください。"}
				</p>
				<CircularTimerProgress label={count} progress={progress} />
			</nav>
			<main className="grid grid-rows-[auto_1fr]">
				<section className="grid rounded-lg border border-gray-200 bg-white">
					{game.players.map((player, index) => {
						const isSelf = player.id === mePlayer.id;
						const isSelected = selectedPlayerId === player.id;
						const combination = createCombination({
							position: player.submission?.position,
							text: player.submission?.text,
							theme: game.theme,
						});

						return (
							<div className="w-full" key={player.id}>
								<button
									className={classNames(
										"flex w-full items-center gap-x-8 rounded-lg border-green-400 px-8 py-4 transition-colors md:px-12",
										isSelf
											? "cursor-not-allowed bg-gray-200 opacity-40"
											: isSelected
												? "border bg-green-50"
												: "hover:bg-green-50",
									)}
									disabled={isSelf || !!confirmedPlayerId}
									onClick={() => {
										if (player.id === mePlayer.id) return;
										if (confirmedPlayerId) return;
										setSelectedPlayerId(player.id);
									}}
									type="button"
								>
									<div className="grid flex-1 gap-y-8 md:min-h-64 md:grid-cols-[auto_1fr] md:items-center">
										<div className="flex items-center gap-x-4">
											<Avatar
												name={player.playerName}
												size="S"
												src={player.image ?? undefined}
											/>
											<p className="font-semibold text-neutral-500 text-xs">
												{player.playerName}
												{isSelf && (
													<span className="text-neutral-400">（自分）</span>
												)}
											</p>
										</div>
										<p className="font-bold text-sm md:text-base">
											{combination}
										</p>
									</div>
									<Badge color="gray">{player.winCount}勝</Badge>
								</button>
								{index !== game.players.length - 1 && <Separator />}
							</div>
						);
					})}
				</section>

				<section className="mt-16 flex flex-1 items-center justify-center rounded-t-2xl border border-gray-300 border-b-0 bg-white p-16">
					<div className="grid w-full max-w-480 place-items-center gap-y-16">
						{selectedPlayer && !confirmedPlayerId ? (
							<div className="grid w-full gap-y-16">
								<p className="text-center text-neutral-600 text-sm">
									<span className="font-semibold">
										{selectedPlayer.playerName}
									</span>
									さんの
									<span className="font-bold">
										「
										{createCombination({
											position: selectedPlayer.submission?.position,
											text: selectedPlayer.submission?.text,
											theme: game.theme,
										})}
										」
									</span>
									に投票しますか？
								</p>
								<div className="flex justify-center gap-x-12">
									<Button
										as="button"
										color="gray"
										onClick={() => setSelectedPlayerId(null)}
										variant="outline"
									>
										キャンセル
									</Button>
									<Button as="button" onClick={handleConfirmVote}>
										投票する
									</Button>
								</div>
							</div>
						) : confirmedPlayer ? (
							<div className="grid w-full place-items-center gap-y-12">
								<p className="text-center text-neutral-600">
									<span className="font-semibold">
										{confirmedPlayer.playerName}
									</span>
									さんの
									<span className="font-bold text-neutral-800">
										「
										{createCombination({
											position: confirmedPlayer.submission?.position,
											text: confirmedPlayer.submission?.text,
											theme: game.theme,
										})}
										」
									</span>
									に投票しました
								</p>
								<p className="text-center text-neutral-500 text-sm">
									他のプレイヤーの投票を待っています...
								</p>
							</div>
						) : (
							<p className="text-center text-neutral-500">
								一覧から投票先を選んでください
							</p>
						)}
					</div>
				</section>

				<section className="mx-[calc(50%-50cqw)] w-[100cqw] border-t-2 border-t-gray-300 bg-white py-8 xs:pt-16 sm:py-24">
					<div className="mx-auto flex max-w-800 flex-wrap gap-8 px-16">
						{mePlayer.playerCards.map((card) => (
							<div
								className={classNames(
									"flex rounded-md border px-8 py-4 text-center font-bold text-sm xs:text-base sm:text-lg",
									card.used
										? "border-gray-300 bg-gray-200 text-neutral-400"
										: "border-gray-200 bg-gray-100 text-neutral-800",
								)}
								key={card.id}
							>
								{card.word}
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	);
}
