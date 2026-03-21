import classNames from "classnames";
import { useEffect, useRef } from "react";

export type SelectSubmissionCardProps = (
	| { state: "idle" }
	| { state: "ready"; onSelect: () => void; disabled?: boolean }
	| { state: "selected"; word: string; onSubmit: () => Promise<void> }
	| { state: "placed"; word: string }
) & { label: string };

/** 対応デバイスでハプティックフィードバックを発火する */
function triggerHaptic(): void {
	if (typeof navigator !== "undefined" && "vibrate" in navigator) {
		navigator.vibrate([30, 20, 15]);
	}
}

export function SelectSubmissionCard({
	label,
	...props
}: SelectSubmissionCardProps) {
	const { state } = props;
	const isIdle = state === "idle";
	const isReady = state === "ready";
	const isSelected = state === "selected";
	const isPlaced = state === "placed";
	const disabled = isReady ? props.disabled : false;
	const prevStateRef = useRef(state);

	// "placed" 状態への遷移時にハプティックフィードバックを発火する
	useEffect(() => {
		if (state === "placed" && prevStateRef.current !== "placed") {
			triggerHaptic();
		}
		prevStateRef.current = state;
	}, [state]);

	return (
		<div
			className={classNames(
				"relative grid min-h-60 xs:min-h-64 w-full place-items-center rounded-xl border px-8 pt-10 pb-4 xs:pb-8 transition-all duration-300",
				isIdle && "border-gray-300 border-dashed bg-gray-50/10",
				isReady && "border-green-400 border-dashed bg-green-50/10",
				isSelected && "border-green-500 border-solid bg-green-50/50 shadow-md",
				isPlaced && "border-green-400 border-solid bg-green-50/20",
			)}
		>
			{/* ラベル */}
			<p className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-4 text-neutral-400 text-xs sm:text-sm">
				{label}
			</p>

			{/* 配置時のエフェクト（リングバースト + 背景フラッシュ） */}
			{isPlaced && (
				<>
					<div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
						<div className="absolute inset-0 animate-place-card-ring rounded-xl border-3 border-green-400" />
					</div>
					<div className="pointer-events-none absolute inset-0 animate-place-card-flash rounded-xl bg-green-400/30" />
				</>
			)}

			{/* コンテンツエリア */}
			{isPlaced ? (
				<div className="animate-place-card text-center font-bold text-neutral-700 text-sm sm:text-base">
					{props.word}
				</div>
			) : isSelected ? (
				<button
					className="absolute inset-0 grid cursor-pointer place-items-center rounded-xl bg-green-50/50 transition-all duration-200 hover:bg-green-100"
					onClick={props.onSubmit}
					type="button"
				>
					<div className="grid place-items-center gap-y-2">
						<span className="font-bold text-neutral-700 text-sm sm:text-base">
							{props.word}
						</span>
						<span className="text-green-600 text-xs">タップで決定</span>
					</div>
				</button>
			) : (
				<button
					className={classNames(
						"absolute inset-0 rounded-xl text-neutral-400 text-sm transition-all duration-200 sm:text-base",
						isReady && !disabled
							? "cursor-pointer bg-green-50/50 hover:bg-green-100"
							: "cursor-default bg-gray-50/50",
					)}
					disabled={isIdle || disabled}
					onClick={isReady ? props.onSelect : undefined}
					type="button"
				>
					{isIdle
						? "選択待ち..."
						: disabled
							? "手札を選んでください"
							: "タップしてここに置く"}
				</button>
			)}
		</div>
	);
}
