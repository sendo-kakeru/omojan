import { Uuid58DecodeError, uuid58DecodeSafe } from "@nakanoaas/uuid58";

export function decodeUuid58Param<T extends string>(encoded: string): T {
	const result = uuid58DecodeSafe(encoded);
	if (result instanceof Uuid58DecodeError) {
		throw new Response("不正なIDです", { status: 404 });
	}
	return result as T;
}
