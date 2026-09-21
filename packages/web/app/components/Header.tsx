import { Link } from "react-router";
import { AuthUserMenuButton } from "./auth/AuthUserMenuButton";
import { BeginnerMarkIcon } from "./icon/BeginnerMarkIcon";
import { Tile } from "./Tile";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export function Header() {
	return (
		<header className="flex items-start justify-between bg-transparent p-16">
			<Link aria-label="おもじゃんオンライン" className="w-fit" to="/">
				<Tile
					className="grid size-40 place-items-center"
					interactive
					thickness="amber"
				>
					<span
						aria-hidden="true"
						className="carved-text font-bold text-2xl text-orange-600"
					>
						お
					</span>
				</Tile>
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
