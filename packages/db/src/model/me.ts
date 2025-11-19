import { createInsertSchema } from "drizzle-valibot";
import {
	type BrandSymbol,
	type InferOutput,
	nullable,
	object,
	pick,
} from "valibot";
import { userIdSchema, userSchema, userTable } from "../schema";
export type { BrandSymbol };

export const meSchema = object({
	...pick(userSchema, ["email", "name", "image"]).entries,
	userId: userIdSchema,
});
export type Me = InferOutput<typeof meSchema>;

// find
export const getMeResponseBodySchema = nullable(meSchema);
export type GetMeResponseBody = InferOutput<typeof getMeResponseBodySchema>;

// create
export const createMeRequestBodySchema = pick(createInsertSchema(userTable), [
	"email",
	"name",
	"image",
]);
export type CreateMeRequestBody = InferOutput<typeof createMeRequestBodySchema>;
export const createMeResponseBodySchema = meSchema;
export type CreateMeResponseBody = InferOutput<
	typeof createMeResponseBodySchema
>;
