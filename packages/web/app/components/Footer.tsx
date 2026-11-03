import { Link } from "react-router";

const FOOTER_LINKS = [
	{ label: "遊び方", to: "/guide" },
	{ label: "利用規約", to: "/terms" },
	{ label: "プライバシーポリシー", to: "/privacy" },
] as const;

export function Footer() {
	return (
		<footer className="flex justify-center gap-x-16 py-24 text-xs text-neutral-400">
			{FOOTER_LINKS.map((link) => (
				<Link
					className="transition hover:text-neutral-600"
					key={link.to}
					to={link.to}
				>
					{link.label}
				</Link>
			))}
		</footer>
	);
}
