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
		<Dialog
			onOpenAutoFocus={(e) => e.preventDefault()}
			onOpenChange={setIsOpen}
			open={isOpen}
		>
			<div className="mt-16 grid place-items-center gap-y-32">
				<div className="grid place-items-center gap-y-12">
					<p className="text-center font-semibold">
						ログインしてもっと楽しみましょう！
					</p>
					<LineSigninButton
						className="w-fit"
						onClick={() => cognito.signInWithLine()}
					>
						LINEでログイン
					</LineSigninButton>
				</div>
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
