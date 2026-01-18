import { useCallback, useEffect } from "react";
import { useBeforeUnload, useBlocker } from "react-router";

/**
 * ブラウザバック、タブを閉じる、リロードなどのナビゲーションに対して警告を表示するフック
 */
export function useNavigationWarning({
	enabled,
	message,
}: {
	enabled: boolean;
	message: string;
}): void {
	// タブを閉じる、リロードに対する警告（beforeunload）
	// 最新のブラウザではカスタムメッセージは無視され、ブラウザのデフォルトメッセージが表示される
	const handleBeforeUnload = useCallback(
		(event: BeforeUnloadEvent) => {
			if (enabled) {
				event.preventDefault();
			}
		},
		[enabled],
	);
	useBeforeUnload(handleBeforeUnload);

	// React Router内でのナビゲーション（ブラウザバック含む）に対する警告
	const blocker = useBlocker(enabled);

	useEffect(() => {
		if (blocker.state !== "blocked") return;

		const confirmed = window.confirm(message);
		if (confirmed) {
			blocker.proceed();
		} else {
			blocker.reset();
		}
	}, [blocker, message]);
}
