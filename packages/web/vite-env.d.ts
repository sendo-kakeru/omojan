// biome-ignore-all lint/correctness/noUnusedVariables: .d.tsのため参照する必要無し
// biome-ignore-all lint/style/useConsistentTypeDefinitions: vite/client の型を declaration merging で拡張するため interface が必須
/// <reference types="vite/client" />

interface ViteTypeOptions {
	strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
	readonly VITE_COGNITO_USER_POOL_ID: string;
	readonly VITE_COGNITO_CLIENT_ID: string;
	readonly VITE_COGNITO_DOMAIN: string;
	readonly VITE_API_URL: string;
	readonly VITE_CDN_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
