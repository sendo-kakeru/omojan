import type { ReactNode } from "react";
import { tileClassName } from "./Tile";

/**
 * セクション見出し
 *
 * NOTE: 見出しに絵文字を直書きすると OS ごとに字形と色が変わり
 * トーンが崩れるため、漢字を彫った牌をマークとして使う
 */
export function SectionHeading({
	mark,
	count,
	action,
	children,
}: {
	/** 牌に彫る1文字（装飾なので読み上げ対象にしない） */
	mark: string;
	/** 見出し横に添える件数などの補足 */
	count?: ReactNode;
	/** 右端に置くアクション */
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-x-8">
			<h2 className="flex items-center gap-x-8">
				<span
					aria-hidden="true"
					className={tileClassName({
						className: "grid size-34 shrink-0 place-items-center",
						stand: "gold",
					})}
				>
					<span className="font-bold text-base text-brand text-carved">
						{mark}
					</span>
				</span>
				{/* NOTE: 漢字が続く見出しを極太の font-display で組むと字画が潰れるため、
				    font-display はロゴタイプ専用にして、ここは丸ゴシックの太字にする */}
				<span className="font-bold text-base text-moss">{children}</span>
				{count !== undefined && (
					<span className="text-neutral-500 text-xs">{count}</span>
				)}
			</h2>
			{action}
		</div>
	);
}
