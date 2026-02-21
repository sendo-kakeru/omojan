import { useEffect, useRef, useState } from "react";
import { ensureXWidgets, type XFollowButtonOptions } from "~/libs/xWidgets";

export function XFollowButton({
	username,
	options,
	className,
}: {
	/** "XDevelopers" または "@XDevelopers" */
	username: string;

	/** 公式 createFollowButton の options（必要分だけ型定義済み） */
	options?: XFollowButtonOptions;

	className?: string;
}) {
	/** X公式ウィジェットを挿入するコンテナ要素への参照 */
	const containerRef = useRef<HTMLSpanElement>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	/**
	 * useEffect の実行世代番号
	 *
	 * 非同期処理完了時に「古いuseEffectで開始された処理」を無視するために使用。
	 * useEffectが再実行されるたびにインクリメントし、
	 * 非同期処理完了時に現在の世代と一致しなければ処理をスキップする。
	 */
	const runRef = useRef(0);

	const normalizedUsername = username.replace(/^@/, "");

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// 世代番号で「古い非同期完了」を無効化
		runRef.current += 1;
		const runId = runRef.current;

		void (async () => {
			const twttr = await ensureXWidgets();
			if (runRef.current !== runId) return;

			// 既存のボタンをクリアしてから新規生成
			container.innerHTML = "";
			await twttr.widgets.createFollowButton(
				normalizedUsername,
				container,
				options,
			);
			if (runRef.current === runId) {
				setIsLoaded(true);
			}
		})();
	}, [normalizedUsername, options]);

	return (
		<span className={className}>
			{!isLoaded && (
				<span className="inline-block h-20 w-171 animate-pulse rounded-full bg-neutral-200" />
			)}
			<span className={isLoaded ? undefined : "hidden"} ref={containerRef} />
		</span>
	);
}
