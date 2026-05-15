import { uuid58Encode } from "@nakanoaas/uuid58";
import type { Me } from "@repo/db/model";
import { useState } from "react";
import { LuLogIn } from "react-icons/lu";
import { Link } from "react-router";
import { useSWRConfig } from "swr";
import { useMe } from "~/context/me/hooks";
import { cognito } from "~/libs/cognito";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";
import { Avatar } from "../Avatar";
import { Button } from "../button/Button";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuSeparator,
} from "../DropdownMenu";
import { useToast } from "../Toast";
import { SigninModal } from "./SigninModal";

export function AuthUserMenuButton() {
	const { me, isLoading } = useMe();

	if (isLoading) {
		return <div className="size-32 animate-pulse rounded-full bg-gray-200" />;
	}

	if (me) {
		return <UserMenuButton me={me} />;
	}

	return <SigninButton />;
}

/**
 * ログイン時
 */
export function UserMenuButton({ me }: { me: Me }) {
	const { cache } = useSWRConfig();
	const { showToast } = useToast();

	const handleSignOut = () => {
		try {
			cache.delete("/me");
			cognito.signOut();
		} catch (error) {
			console.error("ログアウトに失敗しました:", error);
			showToast({ title: "ログアウトに失敗しました。", type: "error" });
		}
	};

	return (
		<DropdownMenu
			trigger={
				<Avatar
					className="transition-opacity hover:opacity-80"
					name={me.name}
					size="M"
					src={buildImageUrl({
						image: me.image,
						size: AVATAR_IMAGE_DIMENSIONS.M,
					})}
				/>
			}
		>
			<DropdownMenuItem asChild>
				<Link to={`/users/${uuid58Encode(me.userId)}`}>プロフィール</Link>
			</DropdownMenuItem>
			<DropdownMenuSeparator />
			<DropdownMenuItem asChild>
				<button className="w-full" onClick={handleSignOut} type="button">
					ログアウト
				</button>
			</DropdownMenuItem>
		</DropdownMenu>
	);
}

/**
 * 未ログイン時
 */
function SigninButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				aria-label="サインイン"
				as="button"
				isIconOnly
				onClick={() => setIsOpen(true)}
				size="M"
				type="button"
			>
				<LuLogIn aria-hidden="true" />
			</Button>
			<SigninModal isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}
