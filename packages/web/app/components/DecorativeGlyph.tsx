import classNames from "classnames";

/**
 * 牌に彫る装飾の文字
 *
 * 文字をDOMのテキストとして置くと、検索エンジンのスニペットや見出し、
 * ブラウザのリーダーモード、コピー＆ペーストに混ざってしまう。
 * そのためCSSの生成コンテンツ（::before）で描画し、テキストとして扱われないようにする。
 */
export function DecorativeGlyph({
	char,
	className,
}: {
	/** 描画する文字 */
	char: string;
	className?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={classNames(
				"select-none before:content-[attr(data-glyph)]",
				className,
			)}
			data-glyph={char}
		/>
	);
}
