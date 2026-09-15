import {
	OFFICIAL_X_ID,
	PROD_SITE_URL,
	SITE_NAME,
} from "@repo/shared/constants/config";
import { FaXTwitter } from "react-icons/fa6";
import { IoMdShare } from "react-icons/io";
import { Tile } from "~/components/Tile";
import { useShare } from "~/hooks/useShare";

/**
 * 公式Xと共有への導線
 */
export function SocialLinks() {
	const { share } = useShare({
		text: "一緒に遊ぼう！",
		title: SITE_NAME,
		url: PROD_SITE_URL,
	});

	const itemClassName = "grid size-44 place-items-center";

	return (
		<div className="flex items-center gap-x-12">
			<a
				aria-label="公式X"
				className="w-fit"
				href={`https://x.com/${OFFICIAL_X_ID}`}
				rel="noopener noreferrer"
				target="_blank"
			>
				<Tile className={itemClassName} interactive>
					<FaXTwitter className="size-20 text-neutral-800" />
				</Tile>
			</a>
			<Tile
				aria-label="友達に共有する"
				as="button"
				className={itemClassName}
				onClick={share}
			>
				<IoMdShare className="size-20 text-orange-700" />
			</Tile>
		</div>
	);
}
