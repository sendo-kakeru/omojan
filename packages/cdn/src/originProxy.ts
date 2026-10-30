import {
	base64urlEncodeBytes,
	base64urlEncodeString,
} from "@repo/shared/libs/base64url";
import { pemToDer } from "@repo/shared/libs/pem";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { object, parse, string } from "valibot";
import { type GcpServiceAccountKey, gcpServiceAccountKeySchema } from "./env";
import type { ImageDeliveryQuery } from "./schemas";

type TokenCache = {
	token: string;
	expiresAt: number;
};

/**
 * OIDC トークンのキャッシュ。audience（= ORIGIN_URL）をキーとして保持する。
 * 単一変数ではなく Map にすることで、staging / production など
 * 異なる audience に対するトークンの誤再利用を防止する。
 * Workers の isolate 間では共有されないが、同一 isolate 内では
 * リクエストをまたいでキャッシュが有効になる。
 */
const tokenCacheMap = new Map<string, TokenCache>();

/**
 * 進行中のトークン取得 Promise。audience をキーとして保持する。
 * 同一 audience に対する並行リクエストで Promise を共有し、
 * Google トークンエンドポイントへの重複フェッチ（Thundering Herd）を防ぐ。
 */
const pendingTokenMap = new Map<string, Promise<string>>();

/**
 * パース済みの GCP サービスアカウントキー。
 * 環境変数 GCP_SERVICE_ACCOUNT_KEY は実行中に変化しないため、
 * 初回リクエスト時に JSON.parse + valibot バリデーションを行い、
 * 以降は同一 isolate 内でキャッシュを再利用する。
 */
let cachedServiceAccount: GcpServiceAccountKey | null = null;

/**
 * RSA 秘密鍵のインポート済み CryptoKey。
 * crypto.subtle.importKey は CPU コストが高いため、
 * 初回のみ実行して以降は同一 isolate 内でキャッシュを再利用する。
 */
let cachedCryptoKey: CryptoKey | null = null;

/** パース済みの GCP サービスアカウントキーを取得する（モジュールスコープでキャッシュ）。 */
function getServiceAccount({
	gcpServiceAccountKey,
}: {
	gcpServiceAccountKey: string;
}): GcpServiceAccountKey {
	if (cachedServiceAccount) {
		return cachedServiceAccount;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(gcpServiceAccountKey);
	} catch {
		throw new HTTPException(500, {
			message: "GCPサービスアカウントキーのJSONが不正です",
		});
	}
	cachedServiceAccount = parse(gcpServiceAccountKeySchema, parsed);
	return cachedServiceAccount;
}

/** RSA 秘密鍵の CryptoKey を取得する（モジュールスコープでキャッシュ）。 */
async function getCryptoKey({
	privateKey,
}: {
	privateKey: string;
}): Promise<CryptoKey> {
	if (cachedCryptoKey) {
		return cachedCryptoKey;
	}

	const der = pemToDer(privateKey);
	cachedCryptoKey = await crypto.subtle.importKey(
		"pkcs8",
		der.buffer as ArrayBuffer,
		{ hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" },
		false,
		["sign"],
	);
	return cachedCryptoKey;
}

/** GCP サービスアカウントの秘密鍵で自己署名 JWT を生成する（RS256）。 */
async function createSignedJwt({
	audience,
	serviceAccount,
}: {
	serviceAccount: GcpServiceAccountKey;
	audience: string;
}): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const header = base64urlEncodeString(
		JSON.stringify({ alg: "RS256", typ: "JWT" }),
	);
	const payload = base64urlEncodeString(
		JSON.stringify({
			aud: "https://oauth2.googleapis.com/token",
			exp: now + 3600,
			iat: now,
			iss: serviceAccount.client_email,
			sub: serviceAccount.client_email,
			target_audience: audience,
		}),
	);
	const signingInput = `${header}.${payload}`;
	const key = await getCryptoKey({ privateKey: serviceAccount.private_key });
	const signature = new Uint8Array(
		await crypto.subtle.sign(
			"RSASSA-PKCS1-v1_5",
			key,
			new TextEncoder().encode(signingInput),
		),
	);
	return `${signingInput}.${base64urlEncodeBytes(signature)}`;
}

const oidcTokenResponseSchema = object({ id_token: string() });

/**
 * GCP OIDC トークンを取得する。
 * トークンは1時間有効で、期限5分前に再取得する。
 * 並行リクエスト時は同一の Promise を共有して重複フェッチを防ぐ。
 * audience をキーとしてキャッシュし、環境ごとのトークン誤再利用を防止する。
 */
async function getOidcToken({
	audience,
	serviceAccount,
}: {
	serviceAccount: GcpServiceAccountKey;
	audience: string;
}): Promise<string> {
	const now = Date.now();
	const REFRESH_MARGIN_MS = 5 * 60 * 1000;

	const cached = tokenCacheMap.get(audience);
	if (cached && cached.expiresAt - REFRESH_MARGIN_MS > now) {
		return cached.token;
	}

	const pending = pendingTokenMap.get(audience);
	if (pending !== undefined) {
		return pending;
	}

	const request = fetchOidcToken({ audience, serviceAccount }).finally(() => {
		pendingTokenMap.delete(audience);
	});
	pendingTokenMap.set(audience, request);

	return request;
}

async function fetchOidcToken({
	audience,
	serviceAccount,
}: {
	serviceAccount: GcpServiceAccountKey;
	audience: string;
}): Promise<string> {
	const jwt = await createSignedJwt({ audience, serviceAccount });
	const response = await fetch("https://oauth2.googleapis.com/token", {
		body: new URLSearchParams({
			assertion: jwt,
			grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
		}),
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		method: "POST",
	});

	if (!response.ok) {
		const body = await response.text();
		console.error("OIDCトークン取得失敗:", body);
		throw new HTTPException(502, {
			message: "オリジンサーバーへの認証に失敗しました",
		});
	}

	const data = parse(oidcTokenResponseSchema, await response.json());
	tokenCacheMap.set(audience, {
		expiresAt: Date.now() + 3600 * 1000,
		token: data.id_token,
	});
	return data.id_token;
}

/**
 * Cloud Run（Image Processor）にリクエストをプロキシする。
 * ローカル環境以外では GCP OIDC トークンで認証し、SSRF 防止のためホスト検証を行う。
 */
export async function proxyToOrigin({
	gcpServiceAccountKey,
	key,
	originUrl,
	query,
}: {
	originUrl: string;
	key: string;
	query: ImageDeliveryQuery;
	gcpServiceAccountKey?: string;
}): Promise<Response> {
	const originBase = new URL(originUrl);
	const targetUrl = new URL(`/transform/${key}`, originBase);

	if (targetUrl.host !== originBase.host) {
		throw new HTTPException(400, {
			message: "不正なリクエストです",
		});
	}

	if (query.w) {
		targetUrl.searchParams.set("w", String(query.w));
	}
	if (query.h) {
		targetUrl.searchParams.set("h", String(query.h));
	}

	const headers: Record<string, string> = {};
	const isLocal = originBase.hostname === "localhost";

	if (!isLocal) {
		if (!gcpServiceAccountKey) {
			throw new HTTPException(500, {
				message: "GCPサービスアカウントキーが設定されていません",
			});
		}

		const serviceAccount = getServiceAccount({ gcpServiceAccountKey });
		const token = await getOidcToken({
			audience: originUrl,
			serviceAccount,
		});
		headers.Authorization = `Bearer ${token}`;
	}

	const response = await fetch(targetUrl.toString(), { headers });

	if (!response.ok) {
		const status: ContentfulStatusCode =
			response.status >= 400 && response.status < 500
				? (response.status as ContentfulStatusCode)
				: 502;
		const body = await response.text();
		console.error(`オリジンエラー (${response.status}):`, body);
		throw new HTTPException(status, {
			message: status === 502 ? "オリジンサーバーでエラーが発生しました" : body,
		});
	}

	return response;
}
