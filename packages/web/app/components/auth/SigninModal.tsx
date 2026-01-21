import type { Dispatch, SetStateAction } from "react";
import { FaRocket } from "react-icons/fa";
import { Dialog } from "../Dialog";

export function SigninModal({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen} title="ログイン">
			<div className="grid w-full place-items-center gap-y-24">
				<FaRocket className="size-56 text-neutral-400" />
				<div className="grid gap-y-12">
					<p className="text-center font-bold text-3xl text-neutral-400">
						Coming Soon
					</p>
					<p className="text-lg text-neutral-500">
						ログイン機能は近日公開予定。
					</p>
					{/* TODO: Xへの動線追加 */}
				</div>
				<ul className="grid list-disc gap-y-8 py-16 text-neutral-500">
					<li>名前入力なしでゲーム参加</li>
					<li>ゲーム中のアイコン設定</li>
					<li>戦績確認</li>
				</ul>
			</div>
		</Dialog>
	);

	// TODO: デザイン調整
	// return (
	// 	<Dialog onOpenChange={setIsOpen} open={isOpen} title="ログイン">
	// 		<div className="grid place-items-center gap-y-16">
	// 			<p className="w-full">ログインしてOmojanをもっと楽しみましょう！</p>
	// 			<GoogleSigninButton
	// 				disabled={isAppBrowser}
	// 				onClick={() => cognito.signInWithGoogle()}
	// 			>
	// 				Sign in with Google
	// 			</GoogleSigninButton>
	// 		</div>
	// 		{isAppBrowser && (
	// 			<div className="grid gap-y-8 rounded-lg border border-yellow-300 bg-yellow-50 p-12 text-sm">
	// 				<p className="font-bold text-yellow-800">
	// 					このブラウザではGoogleログインをご利用いただけません
	// 				</p>
	// 				<div className="text-neutral-600">
	// 					<p>Safari、Chromeなど通常のブラウザで開いてください。</p>
	// 					<p>
	// 						メニューからブラウザを開くか、URLをコピーしてブラウザに貼り付けてください。
	// 					</p>
	// 				</div>
	// 			</div>
	// 		)}
	// 	</Dialog>
	// );
}
