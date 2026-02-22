import type { TypedResponse } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type HttpResponseBody<T> = {
	data: T | null;
	message: string;
};

export type HttpRespondReturn<T = null> = Response &
	TypedResponse<HttpResponseBody<T>, ContentfulStatusCode, "json">;
