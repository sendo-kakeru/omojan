import { Link } from "react-router";
import { AuthUserMenuButton } from "./auth/AuthUserMenuButton";

export function Header() {
	return (
		<header className="flex items-start justify-between bg-transparent p-16">
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
			<AuthUserMenuButton />
		</header>
	);
}
