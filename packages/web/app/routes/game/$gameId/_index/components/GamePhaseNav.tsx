import { CircularTimerProgress } from "~/components/CircularTimerProgress";
import { Tile } from "~/components/Tile";

/**
 * ゲームフェーズ共通のナビゲーションバー
 *
 * Round表示とタイマーを含む
 */
export function GamePhaseNav({
	roundNo,
	totalRounds = 4,
	statusText,
	timerCount,
	timerProgress,
}: {
	/** 現在のラウンド番号 */
	roundNo: number;
	/** 総ラウンド数 */
	totalRounds?: number;
	/**
	 * 画面の状態を読み上げにだけ伝える文言
	 *
	 * NOTE: 手番や完了は行のハイライト・手札のパルス・投票済みバッジで
	 * 視覚的に伝わるので画面には出さない。ただしそれらは視覚専用で、
	 * 制限時間のあるゲームで手番に気づけないと困るためここで読み上げる
	 */
	statusText?: string;
	/** タイマーのカウント（秒） */
	timerCount: number;
	/** タイマーの進捗（0-100） */
	timerProgress: number;
}) {
	return (
		<nav className="relative flex w-full items-center gap-x-8">
			{/* Round表示はオーバーレイの下に配置 */}
			<RoundIndicator roundNo={roundNo} totalRounds={totalRounds} />
			<div className="flex-1" />
			{/*
			 * NOTE: 状態が変わったときに読み上げさせたいので、空でも常に描画する。
			 * 条件付きで出し入れするとライブリージョンとして機能しない
			 */}
			<p aria-live="polite" className="sr-only">
				{statusText}
			</p>
			{/* タイマーはオーバーレイの上に表示 */}
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
		<Tile
			className="grid w-fit shrink-0 place-items-center px-12 py-2"
			thickness="amber"
		>
			<span className="font-display text-[9px] tracking-widest text-lime-800/70">
				ROUND
			</span>
			<div className="flex items-baseline font-display text-lime-800">
				<span className="text-base leading-none">{roundNo}</span>
				<span className="ml-4 text-[10px] text-neutral-400">
					/{totalRounds}
				</span>
			</div>
		</Tile>
	);
}
