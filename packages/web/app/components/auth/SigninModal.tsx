import type { Dispatch, SetStateAction } from "react";
import { cognito } from "~/libs/cognito";
import { GoogleSigninButton } from "../button/GoogleSigninButton";
import { Dialog } from "../Dialog";

export function SigninModal({
	isOpen,
	setIsOpen,
	isAppBrowser = false,
}: {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	isAppBrowser?: boolean;
}) {
	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen} title="ログイン">
			<div className="grid place-items-center gap-y-16">
				<p className="w-full">ログインしてOmojanをもっと楽しみましょう！</p>
				<GoogleSigninButton
					disabled={isAppBrowser}
					onClick={() => cognito.signInWithGoogle()}
				>
					Sign in with Google
				</GoogleSigninButton>
			</div>
			{isAppBrowser && (
				<div className="grid gap-y-8 rounded-lg border border-yellow-300 bg-yellow-50 p-12 text-sm">
					<p className="font-bold text-yellow-800">
						このブラウザではGoogleログインをご利用いただけません
					</p>
					<div className="text-neutral-600">
						<p>Safari、Chromeなど通常のブラウザで開いてください。</p>
						<p>
							メニューからブラウザを開くか、URLをコピーしてブラウザに貼り付けてください。
						</p>
					</div>
				</div>
			)}
		</Dialog>
	);
}
