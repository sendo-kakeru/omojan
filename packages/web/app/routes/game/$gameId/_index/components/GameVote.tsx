import type {
	GameClientVoteMessage,
	GameServerVoteMessage,
} from "@repo/db/model";
import type { PlayerId } from "@repo/db/schema";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Button } from "~/components/button/Button";
import { Separator } from "~/components/Separator";
import { useCountdown } from "~/hooks/useCountdown";
import { createCombination } from "../libs/gameUtils";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";
import { PlayerCardDisplay } from "./PlayerCardDisplay";

export function GameVote({
	data,
	sendVote,
}: {
	data: GameServerVoteMessage;
	sendVote: (
		votePlayerId: GameClientVoteMessage["votePlayerId"],
	) => Promise<void>;
}) {
	const { game, mePlayer } = data;

	const [selectedPlayerId, setSelectedPlayerId] = useState<PlayerId | null>(
		null,
	);
	const [confirmedPlayerId, setConfirmedPlayerId] = useState<PlayerId | null>(
		null,
	);

	const { count, progress, start: startCountdown } = useCountdown();

	const selectedPlayer = game.players.find(
		(player) => player.id === selectedPlayerId,
	);
	const confirmedPlayer = game.players.find(
		(player) => player.id === confirmedPlayerId,
	);

	useEffect(() => {
		startCountdown(15);
	}, [startCountdown]);

	const getMessage = () => {
		if (confirmedPlayerId) {
			return "投票しました。他のプレイヤーの投票を待っています。";
		}
		return "面白いと思う組み合わせに投票してください。";
	};

	return (
		<GamePhaseLayout
			nav={
				<GamePhaseNav
					message={getMessage()}
					messageVariant={confirmedPlayerId ? "inactive" : "active"}
					roundNo={game.roundNo}
					timerCount={count}
					timerProgress={progress}
				/>
			}
		>
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
									<Button
										as="button"
										onClick={async () => {
											if (!selectedPlayerId) return;
											setConfirmedPlayerId(selectedPlayerId);
											await sendVote(selectedPlayerId);
										}}
									>
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

				<PlayerCardDisplay cards={mePlayer.playerCards} disabled />
			</main>
		</GamePhaseLayout>
	);
}
