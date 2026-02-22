// biome-ignore-all lint/correctness/noUnusedVariables: .d.tsのため参照する必要無し
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
