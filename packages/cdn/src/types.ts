import type { Env } from "./env";

export type BaseContext = { Bindings: Env & { R2: R2Bucket } };
export type PrivateContext = BaseContext & { Variables: { sub: string } };
