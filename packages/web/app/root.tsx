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
import type { PropsWithChildren } from "react";
import { ToastProvider } from "./components/Toast";
import { MeProvider } from "./context/me/provider";

// TODO: メタ情報設定
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
	{ href: "/favicon.ico", rel: "icon", sizes: "any" },
	{ href: "/favicon.svg", rel: "icon", type: "image/svg+xml" },
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
				<Meta />
				<Links />
			</head>
			<body className="bg-yellow-50 font-[Inter] text-neutral-800 overflow-x-hidden">
				<ToastProvider>{children}</ToastProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<MeProvider>
			<div className="mx-auto grid min-h-svh max-w-800 px-16">
				<div>
					<Outlet />
				</div>
			</div>
		</MeProvider>
	);
}

// TODO: 整備
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
