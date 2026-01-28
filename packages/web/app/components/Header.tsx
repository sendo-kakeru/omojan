import { OFFICIAL_X_ID } from "@repo/shared/constants/config";
import { Link } from "react-router";
import { AuthUserMenuButton } from "./auth/AuthUserMenuButton";

export function Header() {
	return (
		<nav className="flex items-start justify-between bg-transparent p-16">
			<Link
				className="hover:translate-0.5 flex size-32 rounded-md shadow transition hover:shadow-none"
				to="/"
			>
				<img
					alt="おもじゃんオンライン"
					height={32}
					src="/logo.png"
					width={32}
				/>
			</Link>
			<div className="flex gap-x-8">
				<Link
					className="flex rounded-full bg-black p-8 transition-opacity hover:opacity-70"
					to={`https://x.com/${OFFICIAL_X_ID}}`}
				>
					<img alt="x" height={16} src="/x.svg" width={16} />
				</Link>
				<AuthUserMenuButton />
			</div>
		</nav>
	);
}
