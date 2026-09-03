import { Link } from "react-router";
import { AuthUserMenuButton } from "./auth/AuthUserMenuButton";
import { BeginnerMarkIcon } from "./icons/BeginnerMarkIcon";
import { tileClassName } from "./Tile";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export function Header() {
	return (
		<header className="flex items-start justify-between bg-transparent p-16">
			{/* ロゴも牌として見せ、アプリ全体の視覚言語を揃える */}
			<Link
				className={tileClassName({
					className: "grid size-40 place-items-center p-4",
					interactive: true,
					stand: "gold",
				})}
				to="/"
			>
				<img
					alt="おもじゃんオンライン"
					className="size-full rounded-[3px]"
					height={32}
					src="/icons/omojan.webp"
					width={32}
				/>
			</Link>
			<div className="flex items-center gap-x-8">
				<Tooltip>
					<TooltipTrigger asChild>
						<Link
							aria-label="遊び方を見る"
							className="transition-opacity hover:opacity-70"
							to="/guide"
						>
							<BeginnerMarkIcon className="size-32" />
						</Link>
					</TooltipTrigger>
					<TooltipContent>遊び方を見る</TooltipContent>
				</Tooltip>
				<AuthUserMenuButton />
			</div>
		</header>
	);
}
