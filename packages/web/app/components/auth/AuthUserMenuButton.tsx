import type { User } from "@repo/db/schema/user";
import { useState } from "react";
import { LuLogIn } from "react-icons/lu";
import { Button } from "../button/Button";
import { SigninModal } from "./SigninModal";

type PickedUser = Pick<User, "name" | "image">;

export function AuthUserMenuButton({ user }: { user: PickedUser | null }) {
	// if (user) {
	// 	return <UserMenuButton user={user} />;
	// }

	return <SigninButton />;
}

/**
 * ログイン時
 */
// export function UserMenuButton({ user }: { user: PickedUser }) {
// 	const { showToast } = useToast();

// 	const handleSignOut = async () => {
// 		try {
// 			await cognitoService.signOut();
// 			showToast({ title: "ログアウトしました。", type: "success" });
// 		} catch (error) {
// 			console.error("ログアウトに失敗しました:", error);
// 			showToast({ title: "ログアウトに失敗しました。", type: "error" });
// 		}
// 	};

// 	return (
// 		<DropdownMenu
// 			trigger={
// 				<Avatar
// 					className="transition-opacity hover:opacity-80"
// 					name={user.name}
// 					size="M"
// 					src={user.image}
// 				/>
// 			}
// 		>
// 			{/* TODO: メニュー内容の実装 */}
// 			<DropdownMenuItem asChild>
// 				<Link to="/">プロフィール</Link>
// 			</DropdownMenuItem>
// 			<DropdownMenuItem asChild>
// 				<Link to="/">アカウント設定</Link>
// 			</DropdownMenuItem>
// 			<DropdownMenuSeparator />
// 			<DropdownMenuItem asChild>
// 				<button className="w-full" onClick={handleLogout} type="button">
// 					ログアウト
// 				</button>
// 			</DropdownMenuItem>
// 		</DropdownMenu>
// 	);
// }

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
