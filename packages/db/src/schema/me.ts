import { createInsertSchema } from "drizzle-valibot";
import { type InferOutput, nullable, object, pick } from "valibot";
import { userSchema, userTable } from "./user";

export const meSchema = object({
	...pick(userSchema, ["email", "name", "image"]).entries,
	userId: userSchema.entries.id,
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
