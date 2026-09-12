import classNames from "classnames";
import { tv } from "tailwind-variants";
import { getDisplayName } from "~/libs/displayName";

const avatarVariants = tv(
	{
		base: "aspect-square shrink-0 overflow-hidden rounded-full object-cover object-center",
		variants: {
			size: {
				L: "size-40",
				M: "size-32",
				S: "size-24",
				XL: "size-96",
			},
		},
	},
	{ twMerge: false },
);

/** 名前から決定的に選ぶ、画像が無いプレイヤーの背景色 */
const AVATAR_PALETTE = [
	"bg-orange-700",
	"bg-lime-800",
	"bg-amber-700",
	"bg-red-700",
	"bg-lime-900",
] as const;

/**
 * NOTE: 書記素クラスタ単位で切る。
 * charAt や [0] はUTF-16のコードユニット単位なので、絵文字やサロゲートペアの漢字だと前半だけを取り出して豆腐（�）になる。
 */
const graphemeSegmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

function getInitial(name: string): string {
	const [first] = graphemeSegmenter.segment(name.trim());
	return first?.segment ?? "";
}

function pickAvatarColorClassName(seed: string): string {
	let hash = 0;
	for (const char of seed) {
		// NOTE: charCodeAt は上位サロゲートしか読まないため、絵文字同士でハッシュが衝突しやすくなる。コードポイントで読む。
		// >>> 0 で符号なし32bitに丸め、桁溢れによる精度落ちと負値を同時に防ぐ
		hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
	}
	const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
	return palette ?? AVATAR_PALETTE[0];
}

const letterVariants = tv(
	{
		base: "grid place-items-center font-bold text-white",
		variants: {
			size: {
				L: "text-base",
				M: "text-sm",
				S: "text-xs",
				XL: "text-4xl",
			},
		},
	},
	{ twMerge: false },
);

export function Avatar({
	className,
	size = "M",
	src,
	name,
	...props
}: Omit<React.ComponentProps<"img">, "alt"> & {
	size?: "S" | "M" | "L" | "XL";
	name: string;
}) {
	const displayName = getDisplayName(name);
	const avatarClassName = avatarVariants({
		className,
		size,
	});

	if (src) {
		return (
			<img alt={displayName} className={avatarClassName} src={src} {...props} />
		);
	}

	// 頭文字+名前から決定的に選んだ色で表示する。同じ名前は常に同じ色になる
	return (
		<div
			aria-label={displayName}
			className={classNames(
				avatarClassName,
				pickAvatarColorClassName(displayName),
				letterVariants({ size }),
			)}
			role="img"
		>
			{getInitial(displayName)}
		</div>
	);
}
