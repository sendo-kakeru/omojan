import type { RoundTheme, Submission } from "@repo/db/schemas";

export function createCombination({
	text,
	position,
	theme,
}: {
	text: string | null | undefined;
	position: Submission["position"] | null | undefined;
	theme: RoundTheme["text"];
}): string | null {
	if (!text || !position) return null;
	return position === "prefix" ? `${text}${theme}` : `${theme}${text}`;
}

/** 対応デバイスでハプティックフィードバックを発火する */
export function vibrate(): void {
	navigator.vibrate?.([30, 20, 15]);
}
