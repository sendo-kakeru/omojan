/** Cloudflare Workers の `caches.default`（DOM の CacheStorage 型には存在しない） */
const defaultCache = (caches as unknown as { default: Cache }).default;

/**
 * クエリパラメータをソートしてキャッシュキーを正規化する。
 * 同じ画像・同じパラメータに対して一意のキャッシュキーを生成する。
 */
export function normalizeCacheKey(url: URL): Request {
	const normalized = new URL(url);
	normalized.searchParams.sort();
	return new Request(normalized.toString());
}

/** Cache API からキャッシュ済みレスポンスを照合する。 */
export async function getCached(
	cacheKey: Request,
): Promise<Response | undefined> {
	return defaultCache.match(cacheKey);
}

/** レスポンスを Cache API に格納する。 */
export async function setCached(params: {
	cacheKey: Request;
	response: Response;
}): Promise<void> {
	await defaultCache.put(params.cacheKey, params.response.clone());
}
