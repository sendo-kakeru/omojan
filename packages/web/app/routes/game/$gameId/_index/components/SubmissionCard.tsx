import type { Submission } from "@repo/db/schema";
import classNames from "classnames";

const POSITIONS = ["prefix", "suffix"] as const;

export function SubmissionCard(
	props:
		| {
				state: "selecting";
				onSelect: (position: Submission["position"]) => void;
				position: Submission["position"] | null;
				theme: string;
				word: string;
		  }
		| {
				state: "confirmed";
				position: Submission["position"];
				text: string;
		  },
) {
	const { state } = props;

	if (state === "confirmed") {
		return (
			<div className="relative w-full rounded-xl border-2 border-green-500 bg-green-100 px-16 py-12 shadow-md">
				<PositionBadge position={props.position} />
				<p className="text-center font-bold text-neutral-700 text-sm sm:text-base">
					{props.text}
				</p>
			</div>
		);
	}

	// state === "selecting"
	return (
		<div className="relative z-10 grid w-full gap-y-8">
			{POSITIONS.map((position) => (
				<button
					className={classNames(
						"relative w-full cursor-pointer rounded-xl border-2 px-16 py-12 transition-colors duration-200",
						props.position === position
							? "border-green-500 bg-green-100 shadow-md"
							: "animate-pulse-slot border-green-300 bg-green-50/50 hover:border-green-500 hover:bg-green-100",
					)}
					key={position}
					onClick={() => props.onSelect(position)}
					type="button"
				>
					<PositionBadge position={position} />
					<CombinationText
						isSelected={props.position === position}
						position={position}
						theme={props.theme}
						word={props.word}
					/>
					{/* 選択中の吹き出し */}
					{props.position === position && (
						<span className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full animate-bounce whitespace-nowrap rounded-lg bg-green-600 px-8 py-4 text-white text-xs shadow-lg before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-6 before:border-t-green-600 before:border-r-transparent before:border-b-transparent before:border-l-transparent">
							もう一度タップで決定
						</span>
					)}
				</button>
			))}
		</div>
	);
}

function PositionBadge({ position }: { position: Submission["position"] }) {
	return (
		<span className="absolute top-1/2 left-0 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-green-500 text-white text-xs">
			{position === "prefix" ? "前" : "後"}
		</span>
	);
}

function CombinationText({
	position,
	theme,
	word,
	isSelected,
}: {
	position: Submission["position"];
	theme: string;
	word: string;
	isSelected: boolean;
}) {
	const wordElement = (
		<span
			className={classNames(
				"transition-colors duration-200",
				isSelected ? "text-neutral-700" : "text-neutral-400",
			)}
		>
			{word}
		</span>
	);
	const themeElement = <span className="text-neutral-700">{theme}</span>;

	return (
		<p className="text-center font-bold text-sm sm:text-base">
			{position === "prefix" ? (
				<>
					{wordElement}
					{themeElement}
				</>
			) : (
				<>
					{themeElement}
					{wordElement}
				</>
			)}
		</p>
	);
}
