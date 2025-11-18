import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	index("routes/page.tsx"),
	route("auth/callback", "routes/auth/callback/page.tsx"),
	route("matching/:gameId", "routes/matching/[gameId]/page.tsx"),
] satisfies RouteConfig;
