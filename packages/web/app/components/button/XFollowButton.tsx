import { useEffect, useRef, useState } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { ensureXWidgets, type XFollowButtonOptions } from "~/libs/xWidgets";

const sizeVariants = tv(
	{
		base: "inline-block overflow-hidden",
		compoundVariants: [
			{
				class: "h-20 w-171",
				size: "normal",
			},
			{
				class: "h-28 w-235",
				lang: "ja",
				showScreenName: true,
				size: "large",
			},
			{
				class: "h-28 w-124",
				lang: "ja",
				showScreenName: false,
				size: "large",
			},
		],
		defaultVariants: {
			lang: "en",
			showScreenName: true,
			size: "normal",
		},
		variants: {
			lang: {
				en: "",
				ja: "",
			},
			showScreenName: {
				false: "",
				true: "",
			},
			size: {
				large: "",
				normal: "",
			},
		},
	},
	{ twMerge: false },
);

type SizeVariantProps = VariantProps<typeof sizeVariants>;

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

	const variantProps: SizeVariantProps = {
		lang: options?.lang as SizeVariantProps["lang"],
		showScreenName: options?.showScreenName,
		size: options?.size,
	};

	return (
		<span className={sizeVariants({ ...variantProps, className })}>
			{!isLoaded && (
				<span className="block h-full w-full animate-pulse rounded-full bg-neutral-200" />
			)}
			<span className={isLoaded ? undefined : "hidden"} ref={containerRef} />
		</span>
	);
}
