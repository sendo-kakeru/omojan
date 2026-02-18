import { Link } from "react-router";

export function Footer() {
	return (
		<footer className="flex justify-center gap-x-16 py-24 text-neutral-400 text-xs">
			<Link className="transition hover:text-neutral-600" to="/terms">
				利用規約
			</Link>
			<Link className="transition hover:text-neutral-600" to="/privacy">
				プライバシーポリシー
			</Link>
		</footer>
	);
}
