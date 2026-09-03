import type { Submission } from "@repo/db/schema";
import classNames from "classnames";
import { tileClassName } from "~/components/Tile";

const POSITIONS = ["prefix", "suffix"] as const;

/**
 * 提出する組み合わせ
 *
 * 選択中は「牌を置けるスロット」として点滅させ、
 * 確定すると牌が場に叩きつけられる
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
			<div
				className={tileClassName({
					className:
						"relative w-full animate-place-tile px-24 py-12 motion-reduce:animate-none",
					stand: "moss",
				})}
			>
				<PositionBadge position={props.position} />
				<p className="text-center font-bold text-base text-carved text-moss sm:text-lg">
					{props.text}
				</p>
			</div>
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
								? "-translate-y-2 border-moss bg-moss/10 shadow-tile [--tile-base:var(--color-moss)]"
								: "animate-pulse-slot border-gold border-dashed bg-ivory/70 hover:border-moss hover:bg-moss/5 motion-reduce:animate-none",
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
							<span className="absolute -top-6 left-1/2 -translate-x-1/2 animate-pop whitespace-nowrap rounded-full bg-brand-deep px-10 py-4 text-white text-xs shadow-lg before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-6 before:border-t-brand-deep before:border-r-transparent before:border-b-transparent before:border-l-transparent motion-reduce:animate-none">
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
		<span
			className={tileClassName({
				className:
					"absolute top-1/2 left-0 grid size-26 -translate-x-1/2 -translate-y-1/2 place-items-center font-bold text-brand text-xs",
				stand: "brand",
			})}
		>
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
				isSelected ? "text-moss" : "text-neutral-400",
			)}
		>
			{word}
		</span>
	);
	const themeElement = <span className="text-neutral-700">{theme}</span>;

	return (
		<p className="text-center font-bold text-base sm:text-lg">
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
