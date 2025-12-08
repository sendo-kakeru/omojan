import { useCallback, useEffect, useState } from "react";
import { useToast } from "~/components/Toast";

export function useClipboard(
	text: string,
	options?: {
		/**
		 * コピー成功後に `isCopied` を false に戻すまでの時間（ミリ秒）
		 */
		successDuration?: number;
		/**
		 * コピーに失敗したときのコールバック
		 */
		onError?: (error: unknown) => void;
	},
) {
	const [isCopied, setIsCopied] = useState(false);
	const { showToast } = useToast();
	const successDuration = options?.successDuration;

	// 一定時間後に isCopied をリセットする
	useEffect(() => {
		if (!isCopied) return;

		const id = setTimeout(() => {
			setIsCopied(false);
		}, successDuration ?? 2000);

		return () => clearTimeout(id);
	}, [isCopied, successDuration]);

	const copy = useCallback(() => {
		// SSR / テスト環境で window / document が無い場合は何もしない
		if (typeof window === "undefined" || typeof document === "undefined") {
			options?.onError?.(
				new Error("Clipboardはクライアント環境でのみ利用可能です"),
			);
			setIsCopied(false);
			return;
		}

		const doCopy = async () => {
			try {
				if (!navigator.clipboard?.writeText) {
					showToast({ title: "コピーが利用できない環境です。", type: "error" });
					throw new Error("Clipboard API がサポートされていない環境です");
				}

				await navigator.clipboard.writeText(text);
				setIsCopied(true);
			} catch (error) {
				setIsCopied(false);
				options?.onError?.(error);
				console.error("クリップボードへのコピーに失敗しました:", error);
				showToast({ title: "コピーに失敗しました。", type: "error" });
			}
		};

		void doCopy();
	}, [text, options, showToast]);

	return { copy, isCopied };
}
