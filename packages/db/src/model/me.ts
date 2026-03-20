import { createInsertSchema } from "drizzle-valibot";
import {
	type BrandSymbol,
	type InferOutput,
	maxLength,
	minLength,
	nullable,
	object,
	optional,
	pick,
	pipe,
	string,
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

// update
export const meProfileSchema = object({
	image: userSchema.entries.image,
	name: pipe(
		string(),
		minLength(1, "名前を入力してください"),
		maxLength(50, "名前は50文字以下で入力してください"),
	),
});

export const updateMeRequestBodySchema = object({
	image: optional(meProfileSchema.entries.image),
	name: optional(meProfileSchema.entries.name),
});
export type UpdateMeRequestBody = InferOutput<typeof updateMeRequestBodySchema>;
export const updateMeResponseBodySchema = meSchema;
export type UpdateMeResponseBody = InferOutput<
	typeof updateMeResponseBodySchema
>;
