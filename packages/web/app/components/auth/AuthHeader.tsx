import { AuthUserMenuButton } from "./AuthUserMenuButton";

export function AuthHeader() {
	return (
		<nav className="pointer-events-none flex items-start justify-end bg-transparent p-16">
			<AuthUserMenuButton />
		</nav>
	);
}
