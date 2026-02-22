import type { MetaDescriptor } from "react-router";

/**
 * 親ルートの meta を継承しつつ、noindex を追加する。
 * React Router v7 では子ルートの meta が親を完全に置換するため、
 * matches から親の meta を展開して渡す必要がある。
 */
export function buildNoindexMeta(
	parentMeta: MetaDescriptor[],
): MetaDescriptor[] {
	return [...parentMeta, { content: "noindex", name: "robots" }];
}
