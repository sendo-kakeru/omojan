import classNames from "classnames";
import type { ReactNode } from "react";
import { CircularTimerProgress } from "~/components/CircularTimerProgress";
import { tileClassName } from "~/components/Tile";

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
						"relative z-40 flex h-full flex-1 items-center rounded-full border px-12 py-4 font-bold text-xs",
						messageVariant === "active"
							? "border-moss bg-ivory text-moss"
							: "border-ivory-edge bg-mat/70 text-neutral-500",
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
		<div
			className={tileClassName({
				className: "grid w-fit shrink-0 place-items-center px-12 py-2",
				stand: "gold",
			})}
		>
			{/* NOTE: ラテン文字と数字だけなので font-display でも読み込みは軽い */}
			<span className="font-display text-[9px] text-moss/70 tracking-widest">
				ROUND
			</span>
			<div className="flex items-baseline font-display text-moss">
				<span className="text-base leading-none">{roundNo}</span>
				<span className="text-[10px] text-neutral-400">/{totalRounds}</span>
			</div>
		</div>
	);
}
