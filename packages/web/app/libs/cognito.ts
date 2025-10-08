/**
 * 初期リリースではGoogle認証のみ対応。ユーザーからの要望が多ければパスワード認証など他の方法を検討
 */

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
	ValiError,
} from "valibot";

const COGNITO_LOCALSTORAGE_KEY_PREFIX = `CognitoIdentityServiceProvider.${import.meta.env.VITE_COGNITO_CLIENT_ID}`;
const PKCE_STORAGE_KEY = "pkce_verifier";
const STATE_STORAGE_KEY = "oauth_state";
const NONCE_STORAGE_KEY = "oauth_nonce";

export const cognitoIdTokenPayloadSchema = object({
	email: emailSchema,
	// NOTE: 現在はGoogle認証のみ対応しているためnameは非optional
	name: string(),
	picture: optional(string()),
	sub: string(),
});

const tokenResponseSchema = object({
	access_token: string(),
	id_token: string(),
	refresh_token: string(),
});

// export const signinSchema = object({
// 	email: emailSchema,
// 	password: passwordSchema,
// });

// export const signupSchema = object({
// 	confirmPassword: string(),
// 	email: emailSchema,
// 	name: pipe(string(), minLength(2, "名前は2文字以上である必要があります")),
// 	password: passwordSchema,
// });

// export const verifySchema = object({
// 	code: pipe(string(), length(6, "確認コードは6桁である必要があります")),
// });

export type CognitoIdTokenPayload = InferOutput<
	typeof cognitoIdTokenPayloadSchema
>;
// export type SigninFormInput = InferInput<typeof signinSchema>;
// export type SignupFormInput = InferInput<typeof signupSchema>;
// export type VerifyFormInput = InferInput<typeof verifySchema>;

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

	// async signUp({
	// 	email,
	// 	password,
	// 	name,
	// }: Omit<SignupFormInput, "confirmPassword">): Promise<ISignUpResult> {
	// 	return new Promise((resolve, reject) => {
	// 		this.userPool.signUp(
	// 			email,
	// 			password,
	// 			[
	// 				new CognitoUserAttribute({ Name: "email", Value: email }),
	// 				new CognitoUserAttribute({ Name: "name", Value: name }),
	// 			],
	// 			[],
	// 			(error, result) => {
	// 				if (error) {
	// 					reject(error);
	// 					return;
	// 				}
	// 				if (!result) {
	// 					reject(new Error("サインアップに失敗しました"));
	// 					return;
	// 				}
	// 				resolve(result);
	// 			},
	// 		);
	// 	});
	// }

	// async confirmSignUp({
	// 	email,
	// 	code,
	// }: VerifyFormInput & { email: string }): Promise<void> {
	// 	const cognitoUser = new CognitoUser({
	// 		Pool: this.userPool,
	// 		Username: email,
	// 	});

	// 	return new Promise((resolve, reject) => {
	// 		cognitoUser.confirmRegistration(code, true, (error) => {
	// 			if (error) {
	// 				reject(error);
	// 				return;
	// 			}
	// 			resolve();
	// 		});
	// 	});
	// }

	// async signIn({
	// 	email,
	// 	password,
	// }: SigninFormInput): Promise<CognitoUserSession> {
	// 	const cognitoUser = new CognitoUser({
	// 		Pool: this.userPool,
	// 		Username: email,
	// 	});

	// 	return new Promise((resolve, reject) => {
	// 		cognitoUser.authenticateUser(
	// 			new AuthenticationDetails({
	// 				Password: password,
	// 				Username: email,
	// 			}),
	// 			{
	// 				onFailure: (error) => {
	// 					reject(error);
	// 				},
	// 				onSuccess: (session) => {
	// 					resolve(session);
	// 				},
	// 			},
	// 		);
	// 	});
	// }

	async signInWithGoogle(): Promise<void> {
		// PKCE Code Verifierを生成して保存
		const codeVerifier = this.generateRandomString(64);
		localStorage.setItem(PKCE_STORAGE_KEY, codeVerifier);

		// State（CSRF対策）を生成して保存
		const state = this.generateRandomString(32);
		localStorage.setItem(STATE_STORAGE_KEY, state);

		// Nonce（リプレイ攻撃対策）を生成して保存
		const nonce = this.generateRandomString(32);
		localStorage.setItem(NONCE_STORAGE_KEY, nonce);

		// Code Challengeを生成
		const codeChallenge = await this.generateCodeChallenge(codeVerifier);

		const searchParams = new URLSearchParams({
			client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
			code_challenge: codeChallenge,
			code_challenge_method: "S256",
			identity_provider: "Google",
			nonce: nonce,
			redirect_uri: `${window.location.origin}/auth/callback`,
			response_type: "code",
			scope: "email openid profile",
			state: state,
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

		const payload = await this.decodeIdToken(tokenData.id_token);
		if (!payload) {
			throw new Error("IDトークンのデコードに失敗しました");
		}

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
		};
	}

	// パスワードリセット要求
	// async forgotPassword(email: string): Promise<void> {
	//   const cognitoUser = new CognitoUser({
	//     Username: email,
	//     Pool: this.userPool,
	//   });

	//   return new Promise((resolve, reject) => {
	//     cognitoUser.forgotPassword({
	//       onSuccess: () => resolve(),
	//       onFailure: (error) => reject(error),
	//     });
	//   });
	// }

	// パスワードリセット確認
	// async confirmPassword(email: string, code: string, newPassword: string): Promise<void> {
	//   const cognitoUser = new CognitoUser({
	//     Username: email,
	//     Pool: this.userPool,
	//   });

	//   return new Promise((resolve, reject) => {
	//     cognitoUser.confirmPassword(code, newPassword, {
	//       onSuccess: () => resolve(),
	//       onFailure: (error) => reject(error),
	//     });
	//   });
	// }

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

	// async getIdToken(): Promise<string | null> {
	// 	const session = await this.getCurrentSession();
	// 	return session?.getIdToken().getJwtToken() ?? null;
	// }

	async getAccessToken(): Promise<string | null> {
		const session = await this.getCurrentSession();
		return session?.getAccessToken().getJwtToken() ?? null;
	}

	async decodeIdToken(idToken: string): Promise<CognitoIdTokenPayload | null> {
		try {
			const payload = jwtDecode(idToken);
			return parse(cognitoIdTokenPayloadSchema, payload);
		} catch (error) {
			console.error(
				error instanceof ValiError
					? "IDトークンのデコード結果が不足しています"
					: "IDトークンのデコード中にエラーが発生しました:",
				error,
			);
			return null;
		}
	}
}

export const cognito = new Cognito();
