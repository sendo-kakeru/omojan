import type { User } from "@repo/db/schemas";
import classNames from "classnames";
import type { ComponentProps } from "react";
import { getDisplayName } from "~/libs/displayName";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";
import { Avatar } from "../Avatar";

export function UserLabel({
	user,
	textProps,
	avatarProps,
	className,
}: {
	user: Pick<User, "name"> & Partial<Pick<User, "image">>;
	avatarProps?: {
		size?: Extract<
			ComponentProps<typeof Avatar>["size"],
			keyof typeof AVATAR_IMAGE_DIMENSIONS
		>;
	};
	textProps?: { className?: string };
	className?: string;
}) {
	return (
		<div className={classNames("flex min-w-0 items-center gap-x-8", className)}>
			<Avatar
				name={user.name}
				src={buildImageUrl({
					image: user.image,
					size: AVATAR_IMAGE_DIMENSIONS[avatarProps?.size ?? "M"],
				})}
				{...avatarProps}
			/>
			<p
				className={classNames(
					// NOTE: min-w-0 がないと flex アイテムの最小幅が名前の全長になり、
					// 省略されずに行ごと画面外へ伸びる
					"min-w-0 truncate text-sm",
					textProps?.className,
				)}
			>
				{getDisplayName(user.name)}
			</p>
		</div>
	);
}
