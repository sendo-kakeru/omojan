import type { ComponentPropsWithoutRef } from "react";
import { cognitoService } from "~/libs/cognito";
import { GoogleSigninButton } from "../button/GoogleSigninButton";
import { Dialog } from "../Dialog";

export function SigninModal(
	props: Pick<ComponentPropsWithoutRef<typeof Dialog>, "open" | "onOpenChange">,
) {
	// TODO: デザイン調整
	return (
		<Dialog {...props} title="ログインして遊ぶ">
			<div className="grid place-items-center gap-y-16">
				<p className="w-full">
					GoogleログインをしてOmojanをもっと楽しみましょう！
				</p>
				<GoogleSigninButton onClick={() => cognitoService.signInWithGoogle()}>
					Sign in with Google
				</GoogleSigninButton>
			</div>
		</Dialog>
	);
}
