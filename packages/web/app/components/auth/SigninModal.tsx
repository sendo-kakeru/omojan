import { OFFICIAL_X_ID } from "@repo/shared/constants/config";
import type { Dispatch, SetStateAction } from "react";
import { FaRocket } from "react-icons/fa";
import { XFollowButton } from "../button/XFollowButton";
import { Dialog } from "../Dialog";

export function SigninModal({
	isOpen,
	setIsOpen,
	// biome-ignore lint/correctness/noUnusedFunctionParameters: ログイン機能活性化時に必要
	isAppBrowser = false,
}: {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	isAppBrowser?: boolean;
}) {
	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<div className="grid place-items-center gap-y-48">
				<div className="grid place-items-center gap-y-16">
					<FaRocket className="size-56 text-neutral-400" />
					<p className="text-center font-bold text-3xl text-neutral-400">
						Coming Soon
					</p>
				</div>
				<div className="grid place-items-center gap-y-12 text-neutral-500">
					<p className="font-bold text-lg text-neutral-600">
						ログイン機能は近日公開予定です
					</p>
					<ul className="grid list-disc gap-y-2">
						<li>名前入力なしでゲーム参加</li>
						<li>ゲーム中のアイコン設定</li>
						<li>戦績</li>
					</ul>
				</div>
				<div className="grid place-items-center gap-y-8">
					<p className="text-neutral-500 text-sm">
						最新情報は公式Xアカウントをチェック
					</p>
					<XFollowButton
						options={{ lang: "ja", size: "large" }}
						username={OFFICIAL_X_ID}
					/>
				</div>
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
