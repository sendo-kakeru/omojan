import type { Me } from "@repo/shared/model/me";
import { useState } from "react";
import { LuLogIn } from "react-icons/lu";
import { Link } from "react-router";
import { useMe } from "~/context/me/hooks";
import { cognito } from "~/libs/cognito";
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
	const { me } = useMe();
	if (me) {
		return <UserMenuButton me={me} />;
	}

	return <SigninButton />;
}

/**
 * ログイン時
 */
export function UserMenuButton({ me }: { me: Me }) {
	const { showToast } = useToast();

	const handleSignOut = () => {
		try {
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
					src={me.image ?? undefined}
				/>
			}
		>
			{/* TODO: メニュー内容の実装 */}
			<DropdownMenuItem asChild>
				<Link to="/">プロフィール</Link>
			</DropdownMenuItem>
			<DropdownMenuItem asChild>
				<Link to="/">アカウント設定</Link>
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
			<SigninModal onOpenChange={setIsOpen} open={isOpen} />
		</>
	);
}
