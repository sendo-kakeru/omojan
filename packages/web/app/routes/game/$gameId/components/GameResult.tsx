import classNames from "classnames";
import { useMemo } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Separator } from "~/components/Separator";

type PlayerResult = {
	combination: string;
	isSelf: boolean;
	isWinner: boolean;
	playerIcon?: string;
	playerId: string;
	playerName: string;
	totalWins: number;
	voteCount: number;
};

type HandCard = {
	id: string;
	word: string;
};

export function GameResult() {
	const handCards: HandCard[] = useMemo(
		() => [
			{ id: "h2", word: "思いもよらぬ" },
			{ id: "h3", word: "おふくろ" },
			{ id: "h4", word: "生麦生米" },
			{ id: "h5", word: "ジャーナリズムのかけらもない" },
			{ id: "h6", word: "プリン" },
			{ id: "h7", word: "よそはよそうちは" },
		],
		[],
	);

	const results: PlayerResult[] = useMemo(
		() => [
			{
				combination: "究極カレー",
				isSelf: false,
				isWinner: true,
				playerIcon: undefined,
				playerId: "p2",
				playerName: "さとう",
				totalWins: 3,
				voteCount: 2,
			},
			{
				combination: "激辛カレー",
				isSelf: true,
				isWinner: true,
				playerIcon: undefined,
				playerId: "p1",
				playerName: "自分",
				totalWins: 2,
				voteCount: 2,
			},
			{
				combination: "カレー職人",
				isSelf: false,
				isWinner: false,
				playerIcon: undefined,
				playerId: "p3",
				playerName: "たなか",
				totalWins: 1,
				voteCount: 0,
			},
			{
				combination: "おふくろカレー",
				isSelf: false,
				isWinner: false,
				playerIcon: undefined,
				playerId: "p4",
				playerName: "やまもと",
				totalWins: 0,
				voteCount: 0,
			},
		],
		[],
	);

	const winners = results.filter((r) => r.isWinner);

	return (
		<div className="grid h-full grid-rows-[auto_1fr] gap-y-8 pt-8 xs:pt-16 pb-16">
			<nav className="flex w-full items-center gap-x-8">
				<p className="grid w-fit place-items-center rounded-lg border border-gray-200 bg-white px-8 py-2 font-mono text-neutral-600">
					<span className="text-xs">Round</span>
					<div className="flex items-center">
						<span className="text-base">3</span>/
						<span className="text-base">4</span>
					</div>
				</p>
				<p className="flex-1 rounded-lg border border-green-300 bg-green-50 px-8 py-2 text-green-700 text-sm">
					ラウンド結果
				</p>
			</nav>
			<main className="grid grid-rows-[auto_1fr]">
				<section className="grid rounded-lg border border-gray-200 bg-white">
					{results.map((result, index) => (
						<div className="w-full" key={result.playerId}>
							<div
								className={classNames(
									"flex items-center gap-x-8 rounded-lg px-8 py-4 md:px-12",
									result.isWinner && "border border-yellow-400 bg-yellow-50",
								)}
							>
								<div className="grid flex-1 gap-y-8">
									<div className="flex items-center gap-x-4">
										<Avatar name={result.playerName} size="S" />
										<p className="font-semibold text-xs">
											{result.playerName}
											{result.isSelf && (
												<span className="font-normal text-neutral-400">
													（自分）
												</span>
											)}
										</p>
										{result.isWinner && (
											<Badge color="primary">ラウンド勝者</Badge>
										)}
									</div>
									<p className="font-bold text-sm md:text-base">
										{result.combination}
									</p>
								</div>
								<div className="grid gap-y-4 text-right">
									<p className="font-bold text-lg text-neutral-800">
										{result.voteCount}
										<span className="ml-2 font-normal text-neutral-500 text-sm">
											票
										</span>
									</p>
									<Badge color="gray">{result.totalWins}勝</Badge>
								</div>
							</div>
							{index !== results.length - 1 && <Separator />}
						</div>
					))}
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
											key={winner.playerId}
										>
											<div className="flex items-center gap-x-4">
												<Avatar name={winner.playerName} size="S" />
												<p className="font-bold text-sm">{winner.playerName}</p>
											</div>
											<p className="rounded-lg border border-yellow-300 bg-yellow-50 px-8 py-2 font-bold text-sm">
												{winner.combination}
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
						{handCards.map((card) => (
							<div
								className="flex rounded-md border border-gray-200 bg-gray-100 px-8 py-4 text-center font-bold text-neutral-800 text-sm xs:text-base sm:text-lg"
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
