/** バイト配列を base64url エンコードする。 */
export function base64urlEncodeBytes(data: Uint8Array): string {
	let binary = "";
	for (const byte of data) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/** 文字列を base64url エンコードする。 */
export function base64urlEncodeString(str: string): string {
	return base64urlEncodeBytes(new TextEncoder().encode(str));
}
