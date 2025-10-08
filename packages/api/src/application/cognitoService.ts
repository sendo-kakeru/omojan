import { CognitoJwtVerifier } from "aws-jwt-verify";
import type {
	CognitoJwtVerifierMultiProperties,
	CognitoJwtVerifierMultiUserPool,
} from "aws-jwt-verify/cognito-verifier";
import type { CognitoJwtPayload } from "aws-jwt-verify/jwt-model";
import type { Env } from "../env";

export class CognitoService {
	private readonly accessTokenVerifier: CognitoJwtVerifierMultiUserPool<CognitoJwtVerifierMultiProperties>;

	constructor(env: Env) {
		this.accessTokenVerifier = CognitoJwtVerifier.create({
			clientId: env.COGNITO_CLIENT_ID,
			tokenUse: "access",
			userPoolId: env.COGNITO_USER_POOL_ID,
		});
	}

	/**
	 * アクセストークンを検証（API認証用）
	 */
	async verifyAccessToken({
		token,
	}: {
		token: string;
	}): Promise<CognitoJwtPayload> {
		return this.accessTokenVerifier.verify(token);
	}

	/**
	 * Authorizationヘッダーからトークン抽出
	 */
	extractToken({
		authorizationHeader,
	}: {
		authorizationHeader?: string;
	}): string | undefined {
		if (!authorizationHeader || !authorizationHeader.startsWith("Bearer")) {
			return;
		}
		return authorizationHeader.split("Bearer")[1]?.trim();
	}
}
