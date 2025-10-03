import type { User } from "@repo/db/schema/user";
import { AuthUserMenuButton } from "./AuthUserMenuButton";

export function AuthHeader({
	user,
}: {
	user: Pick<User, "name" | "image"> | null;
}) {
	return (
		<nav className="pointer-events-none flex items-start justify-end bg-transparent p-16">
			<AuthUserMenuButton user={user} />
		</nav>
	);
}
