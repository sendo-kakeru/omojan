import type { GameServerResultMessage } from "@repo/db/model";
import classNames from "classnames";
import { useEffect } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { CircularTimerProgress } from "~/components/CircularTimerProgress";
import { Separator } from "~/components/Separator";
import { useCountdown } from "~/hooks/useCountdown";
import { createCombination } from "../libs/gameUtils";

export function GameResult({ data }: { data: GameServerResultMessage }) {
	const { game, mePlayer } = data;
	const { count, progress, start: startCountdown } = useCountdown();

	useEffect(() => {
		startCountdown(6);
	}, [startCountdown]);

	const winners = game.players.filter((player) =>
		game.winnerPlayerIds.includes(player.id),
	);

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
				<p className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-8 py-2 text-neutral-500 text-sm">
					ラウンド結果
				</p>
				<CircularTimerProgress label={count} progress={progress} />
			</nav>
			<main className="grid grid-rows-[auto_1fr]">
				<section className="grid rounded-lg border border-gray-200 bg-white">
					{game.players.map((player, index) => {
						const isWinner = game.winnerPlayerIds.includes(player.id);
						const isSelf = player.id === mePlayer.id;

						return (
							<div className="w-full" key={player.id}>
								<div
									className={classNames(
										"flex items-center gap-x-8 rounded-lg px-8 py-4 md:px-12",
										isWinner && "border border-yellow-400 bg-yellow-50",
									)}
								>
									<div className="grid flex-1 gap-y-8">
										<div className="flex items-center gap-x-4">
											<Avatar
												name={player.playerName}
												size="S"
												src={player.image ?? undefined}
											/>
											<p className="font-semibold text-xs">
												{player.playerName}
												{isSelf && (
													<span className="font-normal text-neutral-400">
														（自分）
													</span>
												)}
											</p>
											{isWinner && <Badge color="warning">ラウンド勝者</Badge>}
										</div>
										<p className="font-bold text-sm md:text-base">
											{createCombination({
												position: player.submission?.position,
												text: player.submission?.text,
												theme: game.theme,
											})}
										</p>
									</div>
									<div className="grid gap-y-4 text-right">
										<Badge color="gray">{player.winCount}勝</Badge>
									</div>
								</div>
								{index !== game.players.length - 1 && <Separator />}
							</div>
						);
					})}
				</section>

				<section className="mt-16 flex flex-1 items-center justify-center rounded-t-2xl border border-gray-300 border-b-0 bg-white p-16">
					<div className="grid w-full max-w-560 place-items-center gap-y-16">
						{winners.length > 0 && (
							<div className="grid place-items-center gap-y-12">
								<p className="text-center font-medium text-neutral-600">
									このラウンドの勝者
								</p>
								<div className="flex flex-wrap justify-center gap-x-16">
									{winners.map((winner) => (
										<div
											className="grid place-items-center gap-y-8"
											key={winner.id}
										>
											<div className="flex items-center gap-x-4">
												<Avatar
													name={winner.playerName}
													size="S"
													src={winner.image ?? undefined}
												/>
												<p className="font-bold text-sm">{winner.playerName}</p>
											</div>
											<p className="rounded-lg border border-yellow-300 bg-yellow-50 px-8 py-2 font-bold text-sm">
												{createCombination({
													position: winner.submission?.position,
													text: winner.submission?.text,
													theme: game.theme,
												})}
											</p>
										</div>
									))}
								</div>
							</div>
						)}
						<p className="text-center text-neutral-500 text-sm">
							次のラウンドに進みます...
						</p>
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
