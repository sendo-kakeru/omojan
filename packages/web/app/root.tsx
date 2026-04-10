import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import {
	OFFICIAL_X_ID,
	PROD_SITE_URL,
	SITE_NAME,
} from "@repo/shared/constants/config";
import type { PropsWithChildren } from "react";
import { ErrorPage } from "./components/ErrorPage";
import { GlobalNavigationProgress } from "./components/GlobalNavigationProgress";
import { ToastProvider } from "./components/Toast";
import { TooltipProvider } from "./components/Tooltip";
import { MeProvider } from "./context/me/provider";

const SITE_DESCRIPTION =
	"おもじゃんをオンラインで遊ぼう！言葉を組み合わせて一番面白い人が勝ち。4人対戦ワードゲーム。";
const OGP_IMAGE = `${PROD_SITE_URL}/ogp.png`;

export const meta: Route.MetaFunction = () => [
	{ title: SITE_NAME },
	{ content: SITE_DESCRIPTION, name: "description" },
	{
		content: "おもじゃん, OMOJAN, ワードゲーム, オンラインゲーム, 言葉遊び",
		name: "keywords",
	},
	// Canonical
	{ href: PROD_SITE_URL, rel: "canonical", tagName: "link" },
	// OGP
	{ content: SITE_NAME, property: "og:title" },
	{ content: SITE_DESCRIPTION, property: "og:description" },
	{ content: "website", property: "og:type" },
	{ content: PROD_SITE_URL, property: "og:url" },
	{ content: SITE_NAME, property: "og:site_name" },
	{ content: "ja_JP", property: "og:locale" },
	{ content: OGP_IMAGE, property: "og:image" },
	{ content: "1200", property: "og:image:width" },
	{ content: "630", property: "og:image:height" },
	// Twitter Card
	{ content: "summary_large_image", name: "twitter:card" },
	{ content: `@${OFFICIAL_X_ID}`, name: "twitter:site" },
	{ content: SITE_NAME, name: "twitter:title" },
	{ content: SITE_DESCRIPTION, name: "twitter:description" },
	{ content: OGP_IMAGE, name: "twitter:image" },
	// Theme
	{ content: "#fef9c3", name: "theme-color" },
];

export const links: Route.LinksFunction = () => [
	{ href: "https://fonts.googleapis.com", rel: "preconnect" },
	{
		crossOrigin: "anonymous",
		href: "https://fonts.gstatic.com",
		rel: "preconnect",
	},
	{
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
		rel: "stylesheet",
	},
	{ href: "/favicon.ico", rel: "icon", sizes: "48x48" },
	{ href: "/favicon.svg", rel: "icon", sizes: "any", type: "image/svg+xml" },
	{
		href: "/favicon-96x96.png",
		rel: "icon",
		sizes: "96x96",
		type: "image/png",
	},
	{ href: "/apple-touch-icon.png", rel: "apple-touch-icon", sizes: "180x180" },
	{ href: "/site.webmanifest", rel: "manifest" },
];

export function Layout({ children }: PropsWithChildren) {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: GTM requires inline script
					dangerouslySetInnerHTML={{
						__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N9PLX5GD');`,
					}}
				/>
				<script
					async
					crossOrigin="anonymous"
					src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5477394430005803"
				/>
				<Meta />
				<Links />
			</head>
			<body className="overflow-x-hidden bg-yellow-50 font-[Inter] text-neutral-800">
				<noscript>
					<iframe
						height="0"
						src="https://www.googletagmanager.com/ns.html?id=GTM-N9PLX5GD"
						style={{ display: "none", visibility: "hidden" }}
						title="GTM"
						width="0"
					/>
				</noscript>
				<TooltipProvider>
					<ToastProvider>{children}</ToastProvider>
				</TooltipProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<MeProvider>
			<GlobalNavigationProgress />
			<div className="mx-auto grid min-h-svh max-w-800 px-16">
				<div>
					<Outlet />
				</div>
			</div>
		</MeProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	if (isRouteErrorResponse(error)) {
		const statusCode = [401, 403, 404, 500].includes(error.status)
			? (error.status as 401 | 403 | 404 | 500)
			: 500;
		return <ErrorPage statusCode={statusCode} />;
	}

	// 本番以外ではスタックトレースを表示
	if (!import.meta.env.PROD && error instanceof Error) {
		return (
			<div className="flex min-h-svh flex-col items-center justify-center px-16">
				<div className="grid max-w-600 gap-y-16">
					<h1 className="font-bold text-2xl text-red-500">
						開発環境エラー: {error.message}
					</h1>
					{error.stack && (
						<pre className="overflow-x-auto rounded-lg bg-neutral-100 p-16 text-sm">
							<code>{error.stack}</code>
						</pre>
					)}
				</div>
			</div>
		);
	}

	return <ErrorPage statusCode={500} />;
}
