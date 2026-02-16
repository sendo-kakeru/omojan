import { config } from "dotenv";
import { object, optional, parse, picklist, string } from "valibot";

config();

import * as aws from "@pulumi/aws";
import * as cloudflare from "@pulumi/cloudflare";
import * as pulumi from "@pulumi/pulumi";

export const infrastructureEnvSchema = object({
	GOOGLE_CLIENT_ID: string(),
	GOOGLE_CLIENT_SECRET: string(),
	RUN_TYPE: optional(picklist(["UP", "DESTROY"]), "UP"),
});

const env = parse(infrastructureEnvSchema, process.env);

// 環境別設定
const stackSchema = picklist(["dev", "prod", "stg"]);
const stack = parse(stackSchema, pulumi.getStack());

const envConfig = {
	dev: {
		callbackUrls: ["http://localhost:5173/auth/callback"],
		cognitoDomain: "auth-dev.omojan.com",
		cognitoSubdomain: "auth-dev",
		environment: "development",
		logoutUrls: ["http://localhost:5173"],
	},
	prod: {
		callbackUrls: ["https://omojan.com/auth/callback"],
		cognitoDomain: "auth.omojan.com",
		cognitoSubdomain: "auth",
		environment: "production",
		logoutUrls: ["https://omojan.com"],
	},
	stg: {
		callbackUrls: ["https://stg.omojan.com/auth/callback"],
		cognitoDomain: "auth-stg.omojan.com",
		cognitoSubdomain: "auth-stg",
		environment: "staging",
		logoutUrls: ["https://stg.omojan.com"],
	},
} as const;

const currentEnv = envConfig[stack];

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
	name: `omojan-user-pool-${stack}`,

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
		Environment: currentEnv.environment,
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

// Cognito User Pool Client（googleIdentityProviderの後に作成する必要あり）
export const userPoolClient = new aws.cognito.UserPoolClient(
	"user-pool-client",
	{
		// トークン設定
		accessTokenValidity: 24, // 24時間

		// OAuth フロー
		allowedOauthFlows: ["code"],
		allowedOauthFlowsUserPoolClient: true,
		allowedOauthScopes: ["email", "openid", "profile"],

		callbackUrls: [...currentEnv.callbackUrls],

		// 明示的な認証フロー
		explicitAuthFlows: ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"],

		// セキュリティ設定
		generateSecret: false,
		idTokenValidity: 24, // 24時間

		logoutUrls: [...currentEnv.logoutUrls],
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

// Cloudflare DNS
const zone = cloudflare.getZoneOutput({
	filter: { name: "omojan.com" },
});

// ACM証明書（Cognitoカスタムドメインはus-east-1必須）
const usEast1Provider = new aws.Provider("us-east-1", {
	region: "us-east-1",
});

const certificate = new aws.acm.Certificate(
	"cognito-custom-domain-cert",
	{
		domainName: currentEnv.cognitoDomain,
		validationMethod: "DNS",
	},
	{ provider: usEast1Provider },
);

// ACM証明書のDNS検証レコード
new cloudflare.DnsRecord("acm-validation-record", {
	content: certificate.domainValidationOptions.apply(
		(opts) => opts[0]?.resourceRecordValue ?? "",
	),
	name: certificate.domainValidationOptions.apply(
		(opts) => opts[0]?.resourceRecordName ?? "",
	),
	proxied: false,
	ttl: 1, // automatic
	type: "CNAME",
	zoneId: zone.zoneId,
});

const certValidation = new aws.acm.CertificateValidation(
	"cognito-cert-validation",
	{
		certificateArn: certificate.arn,
	},
	{ provider: usEast1Provider },
);

export const userPoolDomain = new aws.cognito.UserPoolDomain(
	"user-pool-domain",
	{
		certificateArn: certValidation.certificateArn,
		domain: currentEnv.cognitoDomain,
		userPoolId: userPool.id,
	},
	{
		dependsOn: [userPool],
	},
);

// カスタムドメインのCNAMEレコード（プロキシ無効必須）
new cloudflare.DnsRecord("cognito-custom-domain-record", {
	content: userPoolDomain.cloudfrontDistribution,
	name: currentEnv.cognitoSubdomain,
	proxied: false,
	ttl: 1, // automatic
	type: "CNAME",
	zoneId: zone.zoneId,
});
