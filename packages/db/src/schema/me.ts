import { type InferOutput, object, pick } from "valibot";
import { userSchema } from "./user";

export const meSchema = object({
	...pick(userSchema, ["email", "name", "image"]).entries,
	userId: userSchema.entries.id,
});
export type Me = InferOutput<typeof meSchema>;
