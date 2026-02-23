import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { HttpRespondReturn } from "../types";

export const honoErrorHandler: ErrorHandler = (error, c): HttpRespondReturn => {
	console.error("Error:", error);
	if (error instanceof HTTPException) {
		return c.json({ data: null, message: error.message }, error.status);
	}
	return c.json({ data: null, message: "Internal Server Error" }, 500);
};
