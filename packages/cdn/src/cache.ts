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

/**
 * 指定キーに対応するキャッシュエントリを削除する。
 * クエリパラメータなしのベースURLを対象にパージする。
 */
export async function purgeCached(url: URL): Promise<void> {
	const base = new URL(url);
	base.search = "";
	await defaultCache.delete(new Request(base.toString()));
}

/** レスポンスを Cache API に格納する。 */
export async function setCached({
	cacheKey,
	response,
}: {
	cacheKey: Request;
	response: Response;
}): Promise<void> {
	await defaultCache.put(cacheKey, response);
}
