import { config } from "dotenv";
import { object, optional, parse, picklist, string } from "valibot";

config();

import * as aws from "@pulumi/aws";

export const infrastructureEnvSchema = object({
	GOOGLE_CLIENT_ID: string(),
	GOOGLE_CLIENT_SECRET: string(),
	RUN_TYPE: optional(picklist(["UP", "DESTROY"]), "UP"),
});

const env = parse(infrastructureEnvSchema, process.env);

export const userPool = new aws.cognito.UserPool("user-pool", {
	// アカウント復旧
	accountRecoverySetting: {
		recoveryMechanisms: [
			{
				name: "verified_email",
				priority: 1,
			},
		],
	},

	// 自動検証
	autoVerifiedAttributes: ["email"],

	// ユーザープール削除保護
	// TODO: 本番環境ではACTIVEにする
	deletionProtection: env.RUN_TYPE === "UP" ? "ACTIVE" : "INACTIVE",

	// デバイス設定
	deviceConfiguration: {
		challengeRequiredOnNewDevice: false,
		deviceOnlyRememberedOnUserPrompt: false,
	},

	// メール設定
	emailConfiguration: {
		emailSendingAccount: "COGNITO_DEFAULT",
	},

	// MFA設定
	mfaConfiguration: "OFF",
	name: "omojan-user-pool",

	// パスワードポリシー
	passwordPolicy: {
		minimumLength: 8,
		requireLowercase: true,
		requireNumbers: true,
		requireSymbols: true,
		requireUppercase: true,
	},

	// スキーマ（追加属性）
	schemas: [
		{
			attributeDataType: "String",
			mutable: true,
			name: "email",
			required: true,
		},
		{
			attributeDataType: "String",
			mutable: true,
			name: "name",
			required: false,
		},
	],

	tags: {
		Environment: "development",
		Project: "omojan",
	},

	// ユーザー名設定
	usernameAttributes: ["email"],
});

export const googleIdentityProvider = new aws.cognito.IdentityProvider(
	"google-identity-provider",
	{
		attributeMapping: {
			email: "email",
			name: "name",
			picture: "picture",
			username: "sub",
		},
		providerDetails: {
			authorize_scopes: "email openid profile",
			client_id: env.GOOGLE_CLIENT_ID,
			client_secret: env.GOOGLE_CLIENT_SECRET,
		},
		providerName: "Google",
		providerType: "Google",
		userPoolId: userPool.id,
	},
	{
		dependsOn: [userPool],
	},
);

// Cognito User Pool Client (must be created after googleIdentityProvider)
export const userPoolClient = new aws.cognito.UserPoolClient(
	"user-pool-client",
	{
		// トークン設定
		accessTokenValidity: 24, // 24時間

		// OAuth フロー
		allowedOauthFlows: ["code"],
		allowedOauthFlowsUserPoolClient: true,
		allowedOauthScopes: ["email", "openid", "profile"],

		// TODO: 本番環境のURLを設定(Stack追加時)
		callbackUrls: [
			"http://localhost:5173/auth/callback",
			"https://stg.omojan.com/auth/callback",
		],

		// 明示的な認証フロー
		explicitAuthFlows: ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"],

		// セキュリティ設定
		generateSecret: false,
		idTokenValidity: 24, // 24時間
		name: "user-pool-client",
		preventUserExistenceErrors: "ENABLED",

		// 読み書き属性
		readAttributes: ["email", "name", "picture"],
		refreshTokenValidity: 30, // 30日

		// OAuth設定
		supportedIdentityProviders: ["COGNITO", "Google"],
		tokenValidityUnits: {
			accessToken: "hours",
			idToken: "hours",
			refreshToken: "days",
		},
		userPoolId: userPool.id,
	},
	{
		dependsOn: [userPool, googleIdentityProvider],
	},
);

export const userPoolDomain = new aws.cognito.UserPoolDomain(
	"user-pool-domain",
	{
		domain: "omojan-dev",
		userPoolId: userPool.id,
	},
	{
		dependsOn: [userPool],
	},
);
