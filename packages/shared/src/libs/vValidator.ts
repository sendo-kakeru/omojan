import type { ValidationTargets } from "hono";
import { validator } from "hono/validator";
import type { GenericSchema, GenericSchemaAsync } from "valibot";
import { safeParseAsync } from "valibot";
import type { HttpResponseBody } from "../types";

export const vValidator = <
	Target extends keyof ValidationTargets,
	S extends GenericSchema | GenericSchemaAsync,
>(
	target: Target,
	schema: S,
) =>
	validator(target, async (value, c) => {
		const result = await safeParseAsync(schema, value);

		if (!result.success) {
			return c.json<HttpResponseBody<null>>(
				{
					data: null,
					message: `リクエストの内容が正しくありません: ${result.issues
						.map((issue) => issue.message)
						.join("\n")}`,
				},
				400,
			);
		}

		return result.output;
	});
