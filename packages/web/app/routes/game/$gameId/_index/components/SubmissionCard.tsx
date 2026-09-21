import type { Submission } from "@repo/db/schemas";
import classNames from "classnames";
import { Tile } from "~/components/Tile";

const POSITIONS = ["prefix", "suffix"] as const;

/**
 * 提出する組み合わせ
 */
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
			<Tile
				className="relative w-full animate-place-tile px-24 py-12 motion-reduce:animate-none"
				thickness="lime"
			>
				<PositionBadge position={props.position} />
				<p className="carved-text text-center font-bold text-lg text-lime-800 xs:text-xl">
					{props.text}
				</p>
			</Tile>
		);
	}

	// state === "selecting"
	return (
		<div className="relative z-10 grid w-full gap-y-12">
			{POSITIONS.map((position) => {
				const isSelected = props.position === position;
				return (
					<button
						className={classNames(
							"relative w-full cursor-pointer rounded-lg border-2 px-24 py-12 transition-all duration-200",
							isSelected
								? "tile-lift -translate-y-4 border-lime-800 bg-lime-800/10 [--tile-thickness:var(--color-lime-800)]"
								: "animate-pulse-slot border-orange-600 border-dashed bg-cream-50/70 hover:border-lime-800 hover:bg-lime-800/5 motion-reduce:animate-none",
						)}
						key={position}
						onClick={() => props.onSelect(position)}
						type="button"
					>
						<PositionBadge position={position} />
						<CombinationText
							isSelected={isSelected}
							position={position}
							theme={props.theme}
							word={props.word}
						/>
						{/* 選択中の吹き出し */}
						{isSelected && (
							<span
								className={classNames(
									"absolute -top-6 left-1/2 -translate-x-1/2 animate-pop whitespace-nowrap rounded-full bg-orange-700 px-10 py-4 text-white text-xs shadow-lg motion-reduce:animate-none",
									"before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-6 before:border-t-orange-700 before:border-r-transparent before:border-b-transparent before:border-l-transparent",
								)}
							>
								もう一度タップで決定
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

/** 前置き／後置きを示す牌 */
function PositionBadge({ position }: { position: Submission["position"] }) {
	return (
		<Tile
			as="span"
			className="absolute top-1/2 left-0 grid size-26 -translate-x-1/2 -translate-y-1/2 place-items-center font-bold text-orange-600 text-xs"
			thickness="orange"
		>
			{position === "prefix" ? "前" : "後"}
		</Tile>
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
				isSelected ? "text-lime-800" : "text-neutral-400",
			)}
		>
			{word}
		</span>
	);
	const themeElement = <span className="text-neutral-700">{theme}</span>;

	return (
		<p className="wrap-break-word text-center font-bold text-lg xs:text-xl">
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
