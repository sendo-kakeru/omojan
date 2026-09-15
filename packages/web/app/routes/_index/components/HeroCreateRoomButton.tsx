import { Button } from "~/components/button/Button";

/**
 * ホームの主要CTA
 */
export function HeroCreateRoomButton({ onClick }: { onClick: () => void }) {
	return (
		<Button as="button" color="primary" onClick={onClick} size="XL">
			部屋をつくる
			{/* NOTE: overflow-hidden を置くと当たり判定を補正する疑似要素まで切られるため切り抜きはこのspanに閉じ込める */}
			<span
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
			>
				<span className="absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/25 motion-reduce:hidden" />
			</span>
		</Button>
	);
}
