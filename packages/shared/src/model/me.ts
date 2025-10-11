import { userSchema } from "@repo/db/schema/user";
import { type InferOutput, object, pick } from "valibot";

export const meSchema = object({
	...pick(userSchema, ["email", "name", "image"]).entries,
	userId: userSchema.entries.id,
});
export type Me = InferOutput<typeof meSchema>;
