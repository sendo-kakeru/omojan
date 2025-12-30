import { type InferOutput, literal, union } from "valibot";

export const gameStateSchema = union([
	literal("waiting"),
	literal("setting"), // 不要だったら消す
	literal("submission"),
	literal("voting"),
	literal("result"),
]);
export type GameState = InferOutput<typeof gameStateSchema>;
