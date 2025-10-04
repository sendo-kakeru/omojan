import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { BaseContext } from "../types";

export function wsMiddleware(): MiddlewareHandler<BaseContext> {
	return async (c, next): Promise<void> => {
		const upgradeHeader = c.req.header("Upgrade");
		if (upgradeHeader !== "websocket") {
			throw new HTTPException(426, { message: "Expected Upgrade: websocket" });
		}
		await next();
	};
}
