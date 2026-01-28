import type { PropsWithChildren, ReactNode } from "react";

/**
 * ゲームフェーズ共通のレイアウトコンポーネント
 *
 * nav と main コンテンツを垂直に配置するグリッドレイアウトを提供
 */
export function GamePhaseLayout({
	nav,
	children,
}: PropsWithChildren<{
	/** ナビゲーションバー */
	nav: ReactNode;
}>) {
	return (
		<div className="grid h-full grid-rows-[auto_1fr] gap-y-8 pt-8 xs:pt-16">
			{nav}
			{children}
		</div>
	);
}
