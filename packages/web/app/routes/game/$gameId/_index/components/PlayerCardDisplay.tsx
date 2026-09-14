import type { GamePlayerCard } from "@repo/db/model";
import type { PlayerCardId } from "@repo/db/schema";
import classNames from "classnames";
import type { ReactNode } from "react";
import { Tile } from "~/components/Tile";

/**
 * プレイヤーの手札を表示するコンポーネント
 *
 * 画面下部に固定表示され、使用済み/未使用のスタイル分けを行う
 */
export function PlayerCardDisplay({
	cards,
	onCardClick,
	selectedCardId,
	isConfirmed = false,
	showPulse = false,
	reactionBar,
	className,
}: {
	/** プレイヤーの手札 */
	cards: GamePlayerCard[];
	/** カードがクリック可能な場合のハンドラ */
	onCardClick?: (cardId: PlayerCardId) => void;
	/** 選択中のカードID */
	selectedCardId?: PlayerCardId | null;
	/** 確定済みかどうか（選択後の状態を変えるため） */
	isConfirmed?: boolean;
	/** 未選択カードにパルスアニメーションを表示するか */
	showPulse?: boolean;
	reactionBar?: ReactNode;
	className?: string;
}) {
	const isInteractive = !!onCardClick;

	return (
		<section
			className={classNames(
				"relative border-t-4 border-t-amber-500 bg-linear-to-b from-cream-50 to-cream-100 py-8 xs:py-12",
				className,
			)}
		>
			{reactionBar && (
				// NOTE: 手札セクションの右肩を基点に、上方向へ出す。独立した固定要素に
				// するとタイマーや手札と必ずどこかで重なるため。bottom-fullはrelativeな
				// 祖先が要るので、その箱を持っているここで配置する
				<div className="absolute right-12 bottom-full z-40 mb-8">
					{reactionBar}
				</div>
			)}
			<div className="mx-auto flex max-w-800 flex-wrap gap-6 px-16">
				{cards.map((card) => {
					const isSelected = selectedCardId === card.id;
					const cardClassName = classNames(
						"px-8 py-4 text-center font-bold text-xs xs:text-sm sm:text-base",
						card.used
							? "cursor-not-allowed text-neutral-400 opacity-60"
							: "text-neutral-800",

						isSelected && isConfirmed && "opacity-70",
						!isSelected &&
							!card.used &&
							showPulse &&
							// NOTE: box-shadowを動かすアニメーションはホバー時のbox-shadowより強く、点滅中はホバーしても厚みが増えず立体に見えないため止める
							"animate-pulse-card hover:animate-none motion-reduce:animate-none",
					);
					const thickness = (() => {
						if (card.used) return "cream";
						if (isSelected) return "lime";
						return "amber";
					})();

					if (isInteractive) {
						return (
							<Tile
								as="button"
								className={cardClassName}
								disabled={card.used || isConfirmed}
								interactive={!card.used && !isConfirmed}
								key={card.id}
								onClick={() => onCardClick(card.id)}
								raised={isSelected && !isConfirmed}
								thickness={thickness}
							>
								{card.word}
							</Tile>
						);
					}

					return (
						<Tile className={cardClassName} key={card.id} thickness={thickness}>
							{card.word}
						</Tile>
					);
				})}
			</div>
		</section>
	);
}
