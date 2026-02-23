import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { CognitoJwtPayload } from "aws-jwt-verify/jwt-model";

type CognitoServiceConfig = {
	clientId: string;
	userPoolId: string;
};

/** AWS Cognito JWT の検証を行うサービス */
export class CognitoService {
	private readonly accessTokenVerifier;

	constructor({ clientId, userPoolId }: CognitoServiceConfig) {
		this.accessTokenVerifier = CognitoJwtVerifier.create({
			clientId,
			tokenUse: "access",
			userPoolId,
		});
	}

	/** アクセストークンを検証する */
	async verifyAccessToken({
		token,
	}: {
		token: string;
	}): Promise<CognitoJwtPayload> {
		return this.accessTokenVerifier.verify(token);
	}

	/** Authorization ヘッダーから Bearer トークンを抽出する */
	extractToken({
		authorizationHeader,
	}: {
		authorizationHeader?: string;
	}): string | undefined {
		if (!authorizationHeader?.startsWith("Bearer ")) {
			return;
		}
		return authorizationHeader.slice("Bearer ".length).trim();
	}
}

export type { CognitoJwtPayload };
