import { Link } from "react-router";
import { AuthUserMenuButton } from "./auth/AuthUserMenuButton";
import { BeginnerMarkIcon } from "./icons/BeginnerMarkIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export function Header() {
	return (
		<header className="flex items-start justify-between bg-transparent p-16">
			<Link
				className="hover:translate-0.5 flex size-32 overflow-hidden rounded-md shadow transition hover:shadow-none"
				to="/"
			>
				<img
					alt="おもじゃんオンライン"
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
