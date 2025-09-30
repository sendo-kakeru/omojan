import type { User } from "@repo/db/schema/user";
import classNames from "classnames";
import { Avatar } from "../Avatar";

export function UserLabel({
	user,
	textProps,
}: {
	user: Partial<Pick<User, "name" | "image">>;
	textProps?: { className?: string };
}) {
	return (
		<div className="flex items-center gap-x-8">
			<Avatar src={user.image ?? ""} />
			<p
				className={classNames(
					"overflow-hidden text-ellipsis whitespace-nowrap text-sm",
					textProps?.className,
				)}
			>
				{user.name}
			</p>
		</div>
	);
}
