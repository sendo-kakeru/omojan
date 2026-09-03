import type { GamePlayerCard } from "@repo/db/model";
import type { PlayerCardId } from "@repo/db/schema";
import classNames from "classnames";
import { tileClassName } from "~/components/Tile";

/**
 * プレイヤーの手札を表示するコンポーネント
 *
 * 画面下部に固定表示され、使用済み/未使用のスタイル分けと
 * オプションでオーバーレイ表示を行う。
 *
 * 手札は麻雀牌として表現し、選ぶと持ち上がり、確定すると沈む
 */
export function PlayerCardDisplay({
	cards,
	disabled = false,
	onCardClick,
	selectedCardId,
	isConfirmed = false,
	overlayMessage,
	showPulse = false,
}: {
	/** プレイヤーの手札 */
	cards: GamePlayerCard[];
	/** 無効化オーバーレイを表示するか */
	disabled?: boolean;
	/** カードがクリック可能な場合のハンドラ */
	onCardClick?: (cardId: PlayerCardId) => void;
	/** 選択中のカードID */
	selectedCardId?: PlayerCardId | null;
	/** 確定済みかどうか（選択後の状態を変えるため） */
	isConfirmed?: boolean;
	/** オーバーレイ上に表示するメッセージ */
	overlayMessage?: string;
	/** 未選択カードにパルスアニメーションを表示するか */
	showPulse?: boolean;
}) {
	const isInteractive = !!onCardClick && !disabled;

	return (
		// 卓の手前の縁。上辺に山吹のレールを引いて手札置き場だと分かるようにする
		<section className="relative right-1/2 left-1/2 -mx-[50vw] w-screen border-t-4 border-t-gold-deep bg-gradient-to-b from-ivory to-mat py-12 sm:py-24">
			<div className="mx-auto flex max-w-800 flex-wrap gap-8 px-16">
				{cards.map((card) => {
					const isSelected = selectedCardId === card.id;
					const cardClassName = tileClassName({
						className: classNames(
							"px-10 py-6 text-center font-bold text-sm xs:text-base sm:text-lg",
							card.used
								? "cursor-not-allowed text-neutral-400 opacity-60"
								: "text-neutral-800",
							isSelected && !isConfirmed && "-translate-y-4",
							isSelected && isConfirmed && "opacity-70",
							!isSelected &&
								!card.used &&
								showPulse &&
								"animate-pulse-card motion-reduce:animate-none",
						),
						interactive: isInteractive && !card.used && !isConfirmed,
						stand: (() => {
							if (card.used) return "ivory";
							if (isSelected) return "moss";
							return "gold";
						})(),
					});

					if (isInteractive) {
						return (
							<button
								className={cardClassName}
								disabled={card.used || isConfirmed}
								key={card.id}
								onClick={() => onCardClick(card.id)}
								type="button"
							>
								{card.word}
							</button>
						);
					}

					return (
						<div className={cardClassName} key={card.id}>
							{card.word}
						</div>
					);
				})}
			</div>
			{disabled && (
				<div className="absolute inset-0 z-50 grid place-items-center bg-moss/70">
					{overlayMessage && (
						<p className="text-center font-bold text-sm text-white">
							{overlayMessage}
						</p>
					)}
				</div>
			)}
		</section>
	);
}
