import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import classNames from "classnames";
import type { ComponentProps } from "react";
import { FaUser } from "react-icons/fa";
import { Avatar } from "~/components/Avatar";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";

type RoomPlayer = (WaitingRoom | FinishedRoom)["players"][number];

const ROOM_CARD_AVATAR_SIZE = {
	M: { avatarSize: "M", box: "size-32", cpuIconPadding: "pt-6" },
	S: { avatarSize: "S", box: "size-24", cpuIconPadding: "pt-4" },
} as const satisfies Record<
	string,
	{
		avatarSize: ComponentProps<typeof Avatar>["size"];
		box: string;
		cpuIconPadding: string;
	}
>;

export function RoomCardAvatar({
	player,
	className,
	isWinner = false,
	size = "S",
}: {
	player: RoomPlayer;
	className?: string;
	isWinner?: boolean;
	size?: keyof typeof ROOM_CARD_AVATAR_SIZE;
}) {
	const winnerRingClassName = isWinner
		? "shadow-[0_0_0_2px_var(--color-amber-300),0_0_10px_1px_rgb(255_216_72/0.5)]"
		: undefined;
	const { avatarSize, box, cpuIconPadding } = ROOM_CARD_AVATAR_SIZE[size];

	if (player.isCpu) {
		return (
			<FaUser
				aria-label="CPU"
				className={classNames(
					"aspect-square shrink-0 rounded-full bg-cream-200 text-cream-400",
					box,
					cpuIconPadding,
					winnerRingClassName,
					className,
				)}
				role="img"
			/>
		);
	}

	return (
		<Avatar
			className={classNames(winnerRingClassName, className)}
			name={player.playerName}
			size={avatarSize}
			src={
				player.image
					? buildImageUrl({
							image: player.image,
							size: AVATAR_IMAGE_DIMENSIONS[avatarSize],
						})
					: undefined
			}
		/>
	);
}
