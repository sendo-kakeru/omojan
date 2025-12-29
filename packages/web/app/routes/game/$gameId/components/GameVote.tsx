import classNames from "classnames";
import { useMemo, useState } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { CircularTimerProgress } from "~/components/CircularTimerProgress";
import { Separator } from "~/components/Separator";

type Submission = {
	playerId: string;
	playerName: string;
	playerIcon?: string;
	combination: string;
	isSelf: boolean;
};

export function GameVote() {
	const submissions: Submission[] = useMemo(
		() => [
			{
				combination: "激辛カレー",
				isSelf: true,
				playerIcon: undefined,
				playerId: "p1",
				playerName: "自分",
			},
			{
				combination: "究極カレー",
				isSelf: false,
				playerIcon: undefined,
				playerId: "p2",
				playerName: "さとう",
			},
			{
				combination: "カレー職人",
				isSelf: false,
				playerIcon: undefined,
				playerId: "p3",
				playerName: "たなか",
			},
			{
				combination: "おふくろカレー",
				isSelf: false,
				playerIcon: undefined,
				playerId: "p4",
				playerName: "やまもと",
			},
		],
		[],
	);

	const [selectedSubmission, setSelectedSubmission] =
		useState<Submission | null>(null);
	const [confirmedVote, setConfirmedVote] = useState<Submission | null>(null);

	const handleSelectSubmission = (submission: Submission) => {
		if (submission.isSelf) return;
		if (confirmedVote) return;
		setSelectedSubmission(submission);
	};

	const handleConfirmVote = () => {
		if (!selectedSubmission) return;
		setConfirmedVote(selectedSubmission);
		setSelectedSubmission(null);
	};

	const handleCancelSelection = () => {
		setSelectedSubmission(null);
	};

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
				<p className="flex-1 rounded-lg border border-yellow-300 bg-white px-8 py-2 text-sm text-yellow-600">
					{confirmedVote
						? "投票が完了しました。"
						: "最も面白いと思う組み合わせに投票してください。"}
				</p>
				<CircularTimerProgress label={30} progress={100} />
			</nav>
			<main className="grid grid-rows-[auto_1fr] gap-16">
				<section className="grid rounded-lg border border-gray-200 bg-white">
					{submissions.map((submission, index) => {
						const isSelected =
							selectedSubmission?.playerId === submission.playerId;
						return (
							<div className="w-full" key={submission.playerId}>
								<button
									className={classNames(
										"flex w-full items-center gap-x-8 rounded-lg px-8 py-4 transition md:px-12",
										submission.isSelf
											? "cursor-not-allowed bg-gray-200 opacity-40"
											: isSelected
												? "border border-yellow-400 bg-yellow-50"
												: "hover:bg-neutral-50",
									)}
									disabled={submission.isSelf || !!confirmedVote}
									onClick={() => handleSelectSubmission(submission)}
									type="button"
								>
									<div className="grid flex-1 gap-y-8">
										<div className="flex items-center gap-x-4">
											<Avatar name={submission.playerName} size="S-M" />
											<p className="font-semibold text-sm md:text-base">
												{submission.playerName}
												{submission.isSelf && (
													<span className="text-neutral-400 text-xs">
														（自分）
													</span>
												)}
											</p>
										</div>
										<p className="font-bold text-lg md:text-2xl">
											{submission.combination}
										</p>
									</div>
									{/* TODO: 必要であれば各ユーザーの投票済み状況の表示 */}
									<Badge color="gray">2勝</Badge>
								</button>
								{index !== submissions.length - 1 && <Separator />}
							</div>
						);
					})}
				</section>

				<section className="xs:mt-16 flex flex-1 items-center justify-center rounded-2xl border border-gray-300 bg-white p-16">
					<div className="grid w-full max-w-480 place-items-center gap-y-16">
						{selectedSubmission && !confirmedVote && (
							<div className="grid w-full gap-y-16">
								<p className="text-center text-neutral-600 text-sm">
									<span className="font-semibold">
										{selectedSubmission.playerName}
									</span>
									さんの
									<span className="font-bold text-neutral-800">
										「{selectedSubmission.combination}」
									</span>
									に投票しますか？
								</p>
								<div className="flex justify-center gap-x-12">
									<button
										className="rounded-lg border border-gray-300 bg-white px-24 py-12 font-semibold text-neutral-600 text-sm transition hover:bg-neutral-50"
										onClick={handleCancelSelection}
										type="button"
									>
										キャンセル
									</button>
									<button
										className="rounded-lg bg-green-500 px-24 py-12 font-semibold text-sm text-white transition hover:bg-green-600"
										onClick={handleConfirmVote}
										type="button"
									>
										投票する
									</button>
								</div>
							</div>
						)}

						{confirmedVote && (
							<div className="grid w-full place-items-center gap-y-12">
								<p className="text-center text-neutral-600">
									<span className="font-semibold">
										{confirmedVote.playerName}
									</span>
									さんの
									<span className="font-bold text-neutral-800">
										「{confirmedVote.combination}」
									</span>
									に投票しました
								</p>
								<p className="text-center text-neutral-500 text-sm">
									他のプレイヤーの投票を待っています...
								</p>
							</div>
						)}

						{!selectedSubmission && !confirmedVote && (
							<p className="text-center text-neutral-500">
								上の一覧から投票先を選んでください
							</p>
						)}
					</div>
				</section>
			</main>
		</div>
	);
}
