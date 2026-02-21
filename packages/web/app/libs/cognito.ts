import { emailSchema } from "@repo/shared/schema";
import {
	CognitoUserPool,
	type CognitoUserSession,
} from "amazon-cognito-identity-js";
import { jwtDecode } from "jwt-decode";
import {
	type InferOutput,
	object,
	optional,
	parse,
	safeParse,
	string,
} from "valibot";

const COGNITO_LOCALSTORAGE_KEY_PREFIX = `CognitoIdentityServiceProvider.${import.meta.env.VITE_COGNITO_CLIENT_ID}`;
const PKCE_STORAGE_KEY = "pkce_verifier";
const STATE_STORAGE_KEY = "oauth_state";
const NONCE_STORAGE_KEY = "oauth_nonce";

export const cognitoIdTokenPayloadSchema = object({
	email: emailSchema,
	name: optional(string()),
	picture: optional(string()),
	sub: string(),
});

const tokenResponseSchema = object({
	access_token: string(),
	id_token: string(),
	refresh_token: string(),
});

export type CognitoIdTokenPayload = InferOutput<
	typeof cognitoIdTokenPayloadSchema
>;

class Cognito {
	private readonly userPool: CognitoUserPool;

	constructor() {
		this.userPool = new CognitoUserPool({
			ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
			UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
		});
	}

	// セキュアなランダム文字列生成
	private generateRandomString(length: number): string {
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
			"",
		);
	}

	// PKCE Code Challengeの生成
	private async generateCodeChallenge(verifier: string): Promise<string> {
		const encoder = new TextEncoder();
		const data = encoder.encode(verifier);
		const digest = await crypto.subtle.digest("SHA-256", data);
		return btoa(String.fromCharCode(...new Uint8Array(digest)))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");
	}

	async signInWithLine(): Promise<void> {
		const codeVerifier = this.generateRandomString(64);
		localStorage.setItem(PKCE_STORAGE_KEY, codeVerifier);

		const state = this.generateRandomString(32);
		localStorage.setItem(STATE_STORAGE_KEY, state);

		const nonce = this.generateRandomString(32);
		localStorage.setItem(NONCE_STORAGE_KEY, nonce);

		const codeChallenge = await this.generateCodeChallenge(codeVerifier);

		const searchParams = new URLSearchParams({
			client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
			code_challenge: codeChallenge,
			code_challenge_method: "S256",
			identity_provider: "LINE",
			nonce,
			redirect_uri: `${window.location.origin}/auth/callback`,
			response_type: "code",
			scope: "email openid profile",
			state,
		});
		window.location.href = `${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/authorize?${searchParams.toString()}`;
	}

	async handleOAuthCallback({
		code,
		state,
	}: {
		code: string | null;
		state: string | null;
	}): Promise<{
		idToken: string;
		accessToken: string;
		payload: CognitoIdTokenPayload;
	}> {
		if (!code) {
			throw new Error("認証コードが見つかりません");
		}
		// State検証（CSRF対策）
		if (!state) {
			throw new Error("stateが見つかりません");
		}
		const savedState = localStorage.getItem(STATE_STORAGE_KEY);
		if (savedState !== state) {
			throw new Error("stateが一致しません");
		}
		localStorage.removeItem(STATE_STORAGE_KEY);

		const codeVerifier = localStorage.getItem(PKCE_STORAGE_KEY);
		if (!codeVerifier) {
			throw new Error("PKCE codeが見つかりません");
		}

		const searchParams = new URLSearchParams({
			client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
			code,
			code_verifier: codeVerifier,
			grant_type: "authorization_code",
			redirect_uri: `${window.location.origin}/auth/callback`,
		});

		// Nonce検証のため保存してから削除
		const savedNonce = localStorage.getItem(NONCE_STORAGE_KEY);
		localStorage.removeItem(PKCE_STORAGE_KEY);
		localStorage.removeItem(NONCE_STORAGE_KEY);

		const response = await fetch(
			`${import.meta.env.VITE_COGNITO_DOMAIN}/oauth2/token`,
			{
				body: searchParams.toString(),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
			},
		);

		if (!response.ok) {
			throw new Error(
				`トークンとコードの交換に失敗しました: ${response.status}`,
			);
		}

		const tokenResponse = await response.json();

		const { success: tokenDataSuccess, output: tokenData } = safeParse(
			tokenResponseSchema,
			tokenResponse,
		);
		if (!tokenDataSuccess) {
			throw new Error("トークンレスポンスの検証に失敗しました");
		}

		// IDトークンのデコード
		const decodedToken = jwtDecode<{ nonce?: string }>(tokenData.id_token);
		// Nonce検証（リプレイ攻撃対策）
		if (!savedNonce) {
			throw new Error("nonceが見つかりません");
		}
		if (decodedToken.nonce !== savedNonce) {
			throw new Error("nonceが一致しません");
		}
		const payload = parse(cognitoIdTokenPayloadSchema, decodedToken);

		localStorage.setItem(
			`${COGNITO_LOCALSTORAGE_KEY_PREFIX}.${payload.sub}.idToken`,
			tokenData.id_token,
		);
		localStorage.setItem(
			`${COGNITO_LOCALSTORAGE_KEY_PREFIX}.${payload.sub}.accessToken`,
			tokenData.access_token,
		);
		localStorage.setItem(
			`${COGNITO_LOCALSTORAGE_KEY_PREFIX}.${payload.sub}.refreshToken`,
			tokenData.refresh_token,
		);
		localStorage.setItem(
			`${COGNITO_LOCALSTORAGE_KEY_PREFIX}.${payload.sub}.clockDrift`,
			"0",
		);
		localStorage.setItem(
			`${COGNITO_LOCALSTORAGE_KEY_PREFIX}.LastAuthUser`,
			payload.sub,
		);

		return {
			accessToken: tokenData.access_token,
			idToken: tokenData.id_token,
			payload,
		};
	}

	signOut(): void {
		const cognitoUser = this.userPool.getCurrentUser();
		if (cognitoUser) cognitoUser.signOut();

		window.location.href = `${import.meta.env.VITE_COGNITO_DOMAIN}/logout?${new URLSearchParams(
			{
				client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
				logout_uri: `${window.location.origin}`,
			},
		).toString()}`;
	}

	async getCurrentSession(): Promise<CognitoUserSession | null> {
		return new Promise((resolve) => {
			const cognitoUser = this.userPool.getCurrentUser();
			if (!cognitoUser) {
				resolve(null);
				return;
			}

			cognitoUser.getSession(
				(error: Error | null, session: CognitoUserSession | null) => {
					if (error || !session) {
						resolve(null);
						return;
					}
					resolve(session);
				},
			);
		});
	}

	async getAccessToken(): Promise<string | null> {
		const session = await this.getCurrentSession();
		return session?.getAccessToken().getJwtToken() ?? null;
	}

	async refreshSession(): Promise<void> {
		const cognitoUser = this.userPool.getCurrentUser();
		if (!cognitoUser) {
			throw new Error("ユーザーが見つかりません");
		}

		const session = await this.getCurrentSession();
		if (!session) {
			throw new Error("セッションの取得に失敗しました");
		}

		const refreshToken = session.getRefreshToken();
		return new Promise((resolve, reject) => {
			cognitoUser.refreshSession(refreshToken, (error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}
}

export const cognito = new Cognito();
