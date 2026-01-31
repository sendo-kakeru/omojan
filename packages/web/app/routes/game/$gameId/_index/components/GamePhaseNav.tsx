import classNames from "classnames";
import type { ReactNode } from "react";
import { CircularTimerProgress } from "~/components/CircularTimerProgress";

/**
 * ゲームフェーズ共通のナビゲーションバー
 *
 * Round表示、メッセージエリア、タイマーを含む
 */
export function GamePhaseNav({
	roundNo,
	totalRounds = 4,
	message,
	messageVariant = "inactive",
	timerCount,
	timerProgress,
}: {
	/** 現在のラウンド番号 */
	roundNo: number;
	/** 総ラウンド数 */
	totalRounds?: number;
	/** メッセージ内容（nullの場合は非表示） */
	message?: ReactNode;
	/** メッセージエリアのスタイルバリエーション */
	messageVariant?: "active" | "inactive";
	/** タイマーのカウント（秒） */
	timerCount: number;
	/** タイマーの進捗（0-100） */
	timerProgress: number;
}) {
	return (
		<nav className="relative flex w-full items-center gap-x-8">
			{/* Round表示はオーバーレイの下に配置 */}
			<RoundIndicator roundNo={roundNo} totalRounds={totalRounds} />
			{/* メッセージとタイマーはオーバーレイの上に表示 */}
			{message ? (
				<p
					className={classNames(
						"relative z-40 flex h-full flex-1 items-center rounded-lg border px-8 py-2 text-sm",
						messageVariant === "active"
							? "border-green-300 bg-white text-green-600"
							: "border-gray-300 bg-gray-50 text-neutral-500",
					)}
				>
					{message}
				</p>
			) : (
				<div className="flex-1" />
			)}
			<div className="relative z-40">
				<CircularTimerProgress count={timerCount} progress={timerProgress} />
			</div>
		</nav>
	);
}

/**
 * ラウンド番号表示コンポーネント
 *
 * GamePhaseNav内部で使用されるが、ラウンド開始モーダルなど他の場所でも再利用可能
 */
export function RoundIndicator({
	roundNo,
	totalRounds = 4,
}: {
	/** 現在のラウンド番号 */
	roundNo: number;
	/** 総ラウンド数 */
	totalRounds?: number;
}) {
	return (
		<div className="grid w-fit place-items-center rounded-lg border border-gray-200 bg-white px-8 py-2 font-mono text-neutral-600">
			<span className="text-xs">Round</span>
			<div className="flex items-center">
				<span className="text-base">{roundNo}</span>/
				<span className="text-base">{totalRounds}</span>
			</div>
		</div>
	);
}
