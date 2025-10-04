import type { Hook } from "@hono/valibot-validator";
import type { Env, ValidationTargets } from "hono";
import { HTTPException } from "hono/http-exception";
import type { GenericSchema, GenericSchemaAsync } from "valibot";

export const routeValidateCallback:
	| Hook<
			GenericSchema | GenericSchemaAsync,
			Env,
			string,
			keyof ValidationTargets
	  >
	| undefined = (result): void => {
	if (!result.success) {
		throw new HTTPException(400, {
			message: result.issues.map((issue) => issue.message).join("\n"),
		});
	}
};
