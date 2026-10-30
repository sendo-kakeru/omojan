import { uuid58Encode } from "@nakanoaas/uuid58";
import type { GameResultResponseBody } from "@repo/db/models";
import {
	OFFICIAL_X_ID,
	PROD_SITE_URL,
	SITE_NAME,
} from "@repo/shared/constants/config";
import classNames from "classnames";
import { FaCrown } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IoMdShare } from "react-icons/io";
import { Link } from "react-router";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Button } from "~/components/button/Button";
import { Confetti } from "~/components/Confetti";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Tile } from "~/components/Tile";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import { useMe } from "~/contexts/me/hooks";
import { useShare } from "~/hooks/useShare";
import { getDisplayName } from "~/libs/displayName";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";

function buildXShareUrl({
	submission,
	theme,
}: {
	submission: string;
	theme: string;
}): string {
	const text = [
		`「${submission}」`,
		"",
		`お題「${theme}」で文字を組み合わせて作った造語です🀄`,
		PROD_SITE_URL,
		"",
		"#おもじゃんオンライン #おもじゃん #OMOJAN",
	].join("\n");
	const url = new URL("https://x.com/intent/tweet");
	url.searchParams.set("text", text);
	return url.toString();
}

export type GameFinalResultProps = {
	result: GameResultResponseBody;
};

export function GameFinalResult({
	result: { title, winners, rounds },
}: GameFinalResultProps) {
	const { me } = useMe();
	const { share } = useShare({
		text: "一緒に遊ぼう！",
		title: SITE_NAME,
		url: PROD_SITE_URL,
	});

	return (
		<>
			<Header />
			<Confetti />
			<main className="grid gap-y-24 pb-36">
				<div className="grid gap-y-4">
					<Tile
						className="grid animate-place-tile place-items-center gap-y-12 p-16 motion-reduce:animate-none"
						thickness="amber"
					>
						<h1 className="text-base font-bold text-neutral-500">{title}</h1>
						<div className="flex items-center gap-x-8">
							<FaCrown aria-hidden className="size-20 text-amber-500" />
							<h2 className="text-lg font-bold text-lime-800 carved-text">
								優勝
							</h2>
							<FaCrown aria-hidden className="size-20 text-amber-500" />
						</div>
						<div className="flex flex-wrap justify-center gap-16">
							{winners.map((winner) => {
								const winnerContent = (
									<>
										<div className="relative">
											<Avatar
												name={winner.playerName}
												size="L"
												src={buildImageUrl({
													image: winner.image,
													size: AVATAR_IMAGE_DIMENSIONS.L,
												})}
											/>
											{me && winner.userId === me.userId && (
												<Badge
													className="absolute -bottom-12 left-1/2 -translate-x-1/2 outline-2 outline-cream-50"
													variant="fill"
												>
													自分
												</Badge>
											)}
										</div>
										<p className="mt-14 text-sm font-bold">
											{getDisplayName(winner.playerName)}
										</p>
										<p className="text-sm font-bold text-lime-800">
											{winner.winCount}勝
										</p>
									</>
								);
								return winner.userId ? (
									<Link
										className="grid place-items-center"
										key={winner.id}
										to={`/users/${uuid58Encode(winner.userId)}`}
									>
										{winnerContent}
									</Link>
								) : (
									<div className="grid place-items-center" key={winner.id}>
										{winnerContent}
									</div>
								);
							})}
						</div>
					</Tile>
				</div>

				<aside className="flex items-center justify-center gap-x-12">
					<a
						className="flex h-28 items-center gap-x-8 rounded-full bg-neutral-800 pr-16 pl-12 text-xs font-bold text-white transition-opacity hover:opacity-80"
						href={`https://x.com/${OFFICIAL_X_ID}`}
						rel="noopener noreferrer"
						target="_blank"
					>
						<FaXTwitter className="size-18" />
						フォロー
					</a>
					<button
						className="flex h-28 items-center gap-x-8 rounded-full bg-orange-700 pr-16 pl-12 text-xs font-bold text-white transition-colors hover:bg-orange-900"
						onClick={share}
						type="button"
					>
						<IoMdShare className="size-18" />
						共有
					</button>
				</aside>

				{/* Round History */}
				<section className="grid gap-y-4">
					<h2 className="font-bold text-lime-800">ラウンド結果</h2>
					<div className="grid gap-y-12">
						{rounds.map((round) => {
							return (
								<Tile className="overflow-hidden p-0" key={round.roundNo}>
									{/* Round Header */}
									<div className="flex items-center gap-x-12 border-b border-cream-200 bg-cream-100/70 px-16 py-8">
										<span className="flex size-28 items-center justify-center rounded-full bg-lime-800 font-display text-sm text-white">
											{round.roundNo}
										</span>
										<p className="text-base font-bold text-lime-800">
											{round.theme}
										</p>
									</div>
									{/* Round Content */}
									<div className="grid gap-y-8 p-16">
										{round.players.map((player) => {
											const playerInfo = (
												<>
													<Avatar
														name={player.playerName}
														size="S"
														src={buildImageUrl({
															image: player.image,
															size: AVATAR_IMAGE_DIMENSIONS.S,
														})}
													/>
													<p className="flex-1 text-xs md:flex-none">
														{getDisplayName(player.playerName)}
														{me && player.userId === me.userId && (
															<span className="text-neutral-400">（自分）</span>
														)}
													</p>
												</>
											);
											return (
												<div
													className={classNames(
														"grid gap-y-4 rounded-lg px-12 py-8 md:flex md:items-center md:gap-x-16",
														player.isWinner
															? "border-2 border-amber-300 bg-amber-300/15"
															: "bg-cream-100/60",
													)}
													key={player.id}
												>
													<div className="flex items-center gap-x-4 pr-3 md:gap-x-8 md:pr-0">
														{player.userId ? (
															<Link
																className="flex items-center gap-x-4 md:gap-x-8"
																to={`/users/${uuid58Encode(player.userId)}`}
															>
																{playerInfo}
															</Link>
														) : (
															playerInfo
														)}
														{player.isWinner && (
															<FaCrown className="size-16 text-amber-500 md:hidden" />
														)}
													</div>
													{player.isWinner && (
														<FaCrown className="hidden size-16 text-amber-500 md:block" />
													)}
													<div className="flex items-center gap-x-4 md:contents">
														<p
															className={classNames(
																"flex-1 font-bold",
																player.isWinner
																	? "text-lime-800"
																	: "text-neutral-700",
															)}
														>
															{player.submission}
														</p>
														<Tooltip>
															<TooltipTrigger asChild>
																<a
																	aria-label="Xで共有する"
																	className="grid shrink-0 place-items-center rounded-full bg-black p-4 text-white transition-colors hover:bg-gray-700"
																	href={buildXShareUrl({
																		submission: player.submission,
																		theme: round.theme,
																	})}
																	rel="noopener noreferrer"
																	target="_blank"
																>
																	<FaXTwitter className="size-14" />
																</a>
															</TooltipTrigger>
															<TooltipContent>Xで共有する</TooltipContent>
														</Tooltip>
													</div>
												</div>
											);
										})}
									</div>
								</Tile>
							);
						})}
					</div>
				</section>

				{/* Actions */}
				<section className="grid gap-y-12">
					<Button
						as="link"
						className="mx-auto w-full max-w-240"
						color="primary"
						replace
						size="L"
						to="/"
					>
						トップに戻る
					</Button>
				</section>
			</main>
			<Footer />
		</>
	);
}
