import { createInsertSchema } from "drizzle-valibot";
import { type InferOutput, object, pick } from "valibot";
import { userSchema, userTable } from "./user";

// model
export const meSchema = object({
	...pick(userSchema, ["email", "name", "image"]).entries,
	userId: userSchema.entries.id,
});
export type Me = InferOutput<typeof meSchema>;

// find
export const getMeResponseBodySchema = meSchema;
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
