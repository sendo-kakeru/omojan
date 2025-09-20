import { createInsertSchema } from "drizzle-valibot";
import * as v from "valibot";
import { userSchema, userTable } from "./user";

// model
export const meSchema = v.object({
  ...v.pick(userSchema, ["email", "name", "avatarUrl"]).entries,
  userId: userSchema.entries.id,
});
export type Me = v.InferOutput<typeof meSchema>;

// find
export const getMeResponseBodySchema = meSchema;
export type GetMeResponseBody = v.InferOutput<typeof getMeResponseBodySchema>;

// create
export const createMeRequestBodySchema = v.pick(createInsertSchema(userTable), [
  "email",
  "name",
  "avatarUrl",
]);
export type CreateMeRequestBody = v.InferOutput<
  typeof createMeRequestBodySchema
>;
export const createMeResponseBodySchema = meSchema;
export type CreateMeResponseBody = v.InferOutput<
  typeof createMeResponseBodySchema
>;
