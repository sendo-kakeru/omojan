import type { ReactNode } from "react";
import { FiChevronRight } from "react-icons/fi";
import { RxUpdate } from "react-icons/rx";
import { Link } from "react-router";
import { DecorativeGlyph } from "./DecorativeGlyph";
import { Tile } from "./Tile";

/**
 * セクション見出し
 */
export function SectionHeading({
	mark,
	action,
	children,
	headingTag: HeadingTag = "h2",
}: {
	/** 牌に彫る1文字（装飾なので読み上げ・検索スニペットの対象にしない） */
	mark: string;
	/** 右端に置くアクション */
	action?: ReactNode;
	children: ReactNode;
	headingTag?: "h1" | "h2";
}) {
	return (
		<div className="flex items-center justify-between gap-x-8">
			<HeadingTag className="flex items-center gap-x-8">
				<Tile
					aria-hidden="true"
					as="span"
					className="grid size-34 shrink-0 place-items-center"
					thickness="amber"
				>
					<DecorativeGlyph
						char={mark}
						className="text-base font-bold text-orange-600 carved-text"
					/>
				</Tile>
				<span className="text-base font-bold text-lime-800">{children}</span>
			</HeadingTag>
			{action}
		</div>
	);
}

/**
 * セクション見出しの「もっと見る」導線
 */
export function SectionMoreLink({ to }: { to: string }) {
	return (
		<Link className="w-fit shrink-0" to={to}>
			<Tile
				className="flex items-center gap-x-2 rounded-full px-12 py-6 text-xs font-bold text-lime-800"
				interactive
				thickness="amber"
			>
				もっと見る
				<FiChevronRight className="size-14" />
			</Tile>
		</Link>
	);
}

/**
 * セクション見出しの「更新」導線
 */
export function SectionRefreshButton({ onClick }: { onClick: () => void }) {
	return (
		<Tile
			as="button"
			className="flex shrink-0 items-center gap-x-4 rounded-full px-12 py-6 text-xs font-bold text-lime-800"
			onClick={onClick}
			thickness="amber"
		>
			<RxUpdate className="size-14" />
			更新
		</Tile>
	);
}
