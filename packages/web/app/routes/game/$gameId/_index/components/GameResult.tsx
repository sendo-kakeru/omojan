import type { GameServerResultMessage } from "@repo/db/model";
import classNames from "classnames";
import { useEffect } from "react";
import { FaCrown } from "react-icons/fa";
import { Avatar } from "~/components/Avatar";
import { Separator } from "~/components/Separator";
import { useCountdown } from "~/hooks/useCountdown";
import { createCombination } from "../libs/gameUtils";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";
import { PlayerCardDisplay } from "./PlayerCardDisplay";

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
		<GamePhaseLayout
			nav={
				<GamePhaseNav
					messageVariant="inactive"
					roundNo={game.roundNo}
					timerCount={count}
					timerProgress={progress}
				/>
			}
		>
			<main className="grid grid-rows-[auto_auto_1fr]">
				{/* 結果表示のガイダンスメッセージ */}
				<div className="mb-8 flex justify-center">
					<p className="rounded-full bg-yellow-500 px-16 py-4 font-bold text-sm text-white shadow-lg">
						🏆 ラウンド {game.roundNo} 結果発表 🏆
					</p>
				</div>
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
											{isWinner && (
												<FaCrown className="size-20 text-yellow-500" />
											)}
											<p className="font-semibold text-xs">
												{player.playerName}
												{isSelf && (
													<span className="font-normal text-neutral-400">
														（自分）
													</span>
												)}
											</p>
										</div>
										<p className="font-bold text-sm md:text-base">
											{createCombination({
												position: player.submission?.position,
												text: player.submission?.text,
												theme: game.theme,
											})}
										</p>
									</div>
									<p className="inline-flex w-fit shrink-0 items-center overflow-hidden whitespace-nowrap rounded-full border-2 border-green-200 bg-green-100 px-12 py-2 font-medium text-green-700 text-sm transition-colors">
										{player.voteCount}票
									</p>
								</div>
								{index !== game.players.length - 1 && <Separator />}
							</div>
						);
					})}
				</section>

				<section className="mt-16 flex flex-1 items-center justify-center rounded-t-2xl border border-yellow-300 border-b-0 bg-white p-16">
					<div className="grid w-full max-w-560 place-items-center gap-y-16">
						{winners.length > 0 && (
							<div className="grid place-items-center gap-y-12">
								<p className="text-center font-bold text-yellow-700">
									ラウンド勝者
								</p>
								<div className="flex flex-wrap justify-center gap-16">
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
							{game.roundNo === 4
								? "結果に進みます..."
								: "次のラウンドに進みます..."}
						</p>
					</div>
				</section>

				<PlayerCardDisplay cards={mePlayer.playerCards} />
			</main>
		</GamePhaseLayout>
	);
}
