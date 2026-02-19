import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router";
import { cognito } from "~/libs/cognito";
import { LineSigninButton } from "../button/LineSigninButton";
import { Dialog } from "../Dialog";

export function SigninModal({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<div className="grid place-items-center gap-y-16">
				<p>ログインしてOmojanをもっと楽しみましょう！</p>
				<LineSigninButton onClick={() => cognito.signInWithLine()}>
					LINEでログイン
				</LineSigninButton>
				<p className="text-center text-neutral-500 text-xs">
					ログインすることで
					<Link className="text-blue-600 underline" to="/terms">
						利用規約
					</Link>
					と
					<Link className="text-blue-600 underline" to="/privacy">
						プライバシーポリシー
					</Link>
					に同意したものとみなします
				</p>
			</div>
		</Dialog>
	);
}
