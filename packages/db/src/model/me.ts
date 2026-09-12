import { createInsertSchema } from "drizzle-valibot";
import {
	type BrandSymbol,
	type InferOutput,
	nullable,
	object,
	optional,
	pick,
} from "valibot";
import { userIdSchema, userNameSchema, userSchema, userTable } from "../schema";

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
/**
 * NOTE: name に userNameSchema を当て直している。createInsertSchema が生成する
 * name は text().notNull() 由来の素の string で、空文字や空白だけでも通ってしまう。
 * サインアップは外部プロバイダから来た値をそのまま入れる経路なので、ここで弾く
 */
export const createMeRequestBodySchema = pick(
	createInsertSchema(userTable, { name: userNameSchema }),
	["email", "name", "image"],
);
export type CreateMeRequestBody = InferOutput<typeof createMeRequestBodySchema>;
export const createMeResponseBodySchema = meSchema;
export type CreateMeResponseBody = InferOutput<
	typeof createMeResponseBodySchema
>;

// update
export const meProfileSchema = object({
	image: userSchema.entries.image,
	name: userNameSchema,
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
