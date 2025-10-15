import type { Dispatch, SetStateAction } from "react";
import { cognito } from "~/libs/cognito";
import { GoogleSigninButton } from "../button/GoogleSigninButton";
import { Dialog } from "../Dialog";

export function SigninModal({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
	// TODO: デザイン調整
	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen} title="ログインして遊ぶ">
			<div className="grid place-items-center gap-y-16">
				<p className="w-full">
					GoogleログインをしてOmojanをもっと楽しみましょう！
				</p>
				<GoogleSigninButton onClick={() => cognito.signInWithGoogle()}>
					Sign in with Google
				</GoogleSigninButton>
			</div>
		</Dialog>
	);
}
