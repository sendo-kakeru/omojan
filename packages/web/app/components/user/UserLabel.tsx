import type { User } from "@repo/db/schema";
import classNames from "classnames";
import type { ComponentProps } from "react";
import { Avatar } from "../Avatar";

export function UserLabel({
	user,
	textProps,
	avatarProps,
	className,
}: {
	user: Partial<Pick<User, "name" | "image">>;
	avatarProps?: Pick<ComponentProps<typeof Avatar>, "size">;
	textProps?: { className?: string };
	className?: string;
}) {
	return (
		<div className={classNames("flex items-center gap-x-8", className)}>
			<Avatar src={user.image ?? ""} {...avatarProps} />
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
