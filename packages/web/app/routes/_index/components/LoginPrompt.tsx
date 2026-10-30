import { cognito } from "~/libs/cognito";
import { LineSigninButton } from "../../../components/button/LineSigninButton";

export function LoginPrompt({ guestLabel }: { guestLabel: string }) {
	return (
		<>
			<div className="grid place-items-center gap-y-12 py-8">
				<p className="text-center font-semibold">
					ログインしてもっと楽しもう！
				</p>
				<LineSigninButton
					className="w-fit"
					onClick={() => cognito.signInWithLine()}
				>
					LINEでログイン
				</LineSigninButton>
			</div>
			<div className="flex items-center gap-x-12">
				<div className="h-px flex-1 bg-gray-200" />
				<p className="text-xs text-neutral-400">{guestLabel}</p>
				<div className="h-px flex-1 bg-gray-200" />
			</div>
		</>
	);
}
