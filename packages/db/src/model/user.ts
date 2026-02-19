import { type InferOutput, nullable, number, object, string } from "valibot";
import { userIdSchema, userSchema } from "../schema";

export const publicUserSchema = object({
	image: nullable(string()),
	name: userSchema.entries.name,
	playCount: number(),
	userId: userIdSchema,
	winCount: number(),
});
export type PublicUser = InferOutput<typeof publicUserSchema>;

// find
export const getPublicUserResponseBodySchema = nullable(publicUserSchema);
export type GetPublicUserResponseBody = InferOutput<
	typeof getPublicUserResponseBodySchema
>;

// request param
export const userRequestParamSchema = object({
	userId: userIdSchema,
});
export type UserRequestParam = InferOutput<typeof userRequestParamSchema>;
