import { useCallback } from "react";
import { useToast } from "~/components/Toast";

export function useShare({
	url,
	title,
	text,
}: {
	url: string;
	title: string;
	text: string;
}) {
	const { showToast } = useToast();

	const share = useCallback(async () => {
		if (navigator.share) {
			try {
				await navigator.share({ text, title, url });
			} catch (error) {
				// ユーザーが共有をキャンセルした場合は何もしない
				if (error instanceof Error && error.name === "AbortError") return;
				console.error("共有に失敗しました:", error);
			}
			return;
		}

		// navigator.share 非対応: クリップボードにコピー
		try {
			await navigator.clipboard.writeText(url);
			showToast({ title: "リンクをコピーしました", type: "success" });
		} catch (error) {
			console.error("クリップボードへのコピーに失敗しました:", error);
			showToast({ title: "コピーに失敗しました", type: "error" });
		}
	}, [url, title, text, showToast]);

	return { share };
}
