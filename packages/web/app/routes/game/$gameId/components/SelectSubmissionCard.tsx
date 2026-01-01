import classNames from "classnames";
import { PiHandTap } from "react-icons/pi";
import { Button } from "~/components/button/Button";

export type SelectSubmissionCardProps = (
	| { state: "idle" }
	| { state: "ready"; onSelect: () => void; disabled?: boolean }
	| { state: "selected"; word: string; onConfirm: () => void }
	| { state: "placed"; word: string }
) & { label: string };

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

	return (
		<div
			className={classNames(
				"relative grid min-h-56 xs:min-h-64 w-full place-items-center rounded-xl border px-8 pt-10 pb-4 xs:pb-8 transition-all duration-300",
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

			{/* 決定ボタン（選択状態時のみ表示） */}
			{isSelected && (
				<Button
					as="button"
					className="absolute top-0 left-1/2 z-20 animate-button-pop"
					leftIcon={<PiHandTap />}
					onClick={props.onConfirm}
					size="S"
					variant="fill"
				>
					決定
				</Button>
			)}

			{/* コンテンツエリア */}
			{isSelected || isPlaced ? (
				<div
					className={classNames(
						"text-center font-bold text-neutral-700 text-sm transition-all duration-600 sm:text-base",
						isPlaced && "animate-place-card",
					)}
				>
					{props.word}
				</div>
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
