import type { RoundTheme, Submission } from "@repo/db/schema";

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
