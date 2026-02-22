/** PEM 形式の秘密鍵から DER バイナリを抽出する。 */
export function pemToDer(pem: string): Uint8Array {
	const pemBody = pem
		.replace(/-----BEGIN PRIVATE KEY-----/, "")
		.replace(/-----END PRIVATE KEY-----/, "")
		.replace(/\s/g, "");
	return Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
}
