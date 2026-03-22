import type { GamePlayerCard } from "@repo/db/model";
import type { PlayerCardId } from "@repo/db/schema";
import classNames from "classnames";

/**
 * プレイヤーの手札を表示するコンポーネント
 *
 * 画面下部に固定表示され、使用済み/未使用のスタイル分けと
 * オプションでオーバーレイ表示を行う
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
		<section className="relative right-1/2 left-1/2 -mx-[50vw] w-screen border-t-2 border-t-gray-300 bg-white py-8 xs:pt-16 sm:py-24">
			<div className="mx-auto flex max-w-800 flex-wrap gap-8 px-16">
				{cards.map((card) => {
					const isSelected = selectedCardId === card.id;

					if (isInteractive) {
						return (
							<button
								className={classNames(
									"flex rounded-md border px-8 py-4 text-center font-bold text-neutral-800 text-sm xs:text-base transition sm:text-lg",
									card.used
										? "cursor-not-allowed border-gray-300 bg-gray-200 opacity-50"
										: isSelected && isConfirmed
											? "border-green-500 bg-green-100 opacity-50"
											: isSelected
												? "border-green-400 bg-green-50 shadow-sm"
												: showPulse
													? "animate-pulse-card border-gray-200 bg-gray-100 hover:bg-green-50"
													: "border-gray-200 bg-gray-100 hover:bg-green-50",
								)}
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
						<div
							className={classNames(
								"flex rounded-md border px-8 py-4 text-center font-bold text-sm xs:text-base sm:text-lg",
								card.used
									? "border-gray-300 bg-gray-200 text-neutral-400"
									: "border-gray-200 bg-gray-100 text-neutral-800",
							)}
							key={card.id}
						>
							{card.word}
						</div>
					);
				})}
			</div>
			{disabled && (
				<div className="absolute inset-0 z-50 grid place-items-center bg-black/50">
					{overlayMessage && (
						<p className="text-center font-medium text-sm text-white">
							{overlayMessage}
						</p>
					)}
				</div>
			)}
		</section>
	);
}
