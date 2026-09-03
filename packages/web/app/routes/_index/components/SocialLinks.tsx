import {
	OFFICIAL_X_ID,
	PROD_SITE_URL,
	SITE_NAME,
} from "@repo/shared/constants/config";
import { FaXTwitter } from "react-icons/fa6";
import { IoMdShare } from "react-icons/io";
import { tileClassName } from "~/components/Tile";
import { useShare } from "~/hooks/useShare";

/**
 * 公式Xと共有への導線
 *
 * NOTE: 以前はホーム最上部（ファーストビューで最も目立つ位置）に置かれ、
 * 「部屋をつくる／参加する」という本来の目的より前に出ていた。
 * 一通り部屋を見終わった後に置くほうが行動の順番として自然
 */
export function SocialLinks() {
	const { share } = useShare({
		text: "一緒に遊ぼう！",
		title: SITE_NAME,
		url: PROD_SITE_URL,
	});

	const itemClassName = tileClassName({
		className: "grid size-44 place-items-center",
		interactive: true,
	});

	return (
		<section className="grid place-items-center gap-y-12 pt-8">
			<p className="font-bold text-moss text-sm">友達をさそって遊ぼう</p>
			<div className="flex items-center gap-x-12">
				<a
					aria-label="公式X"
					className={itemClassName}
					href={`https://x.com/${OFFICIAL_X_ID}`}
					rel="noopener noreferrer"
					target="_blank"
				>
					<FaXTwitter className="size-20 text-neutral-800" />
				</a>
				<button
					aria-label="友達に共有する"
					className={itemClassName}
					onClick={share}
					type="button"
				>
					<IoMdShare className="size-20 text-brand-deep" />
				</button>
			</div>
		</section>
	);
}
