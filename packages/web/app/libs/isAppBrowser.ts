/**
 * アプリ内ブラウザ判定ユーティリティ
 * Google OAuthはWebView（ネイティブアプリの内部ブラウザ）では機能しないため、
 * これらのブラウザを検出してユーザーに通常ブラウザでの閲覧を促す必要がある
 */

export function isLineWebBrowser(): boolean {
	if (typeof navigator === "undefined") return false;
	return /Line/i.test(navigator.userAgent);
}

export function isInstagramWebBrowser(): boolean {
	if (typeof navigator === "undefined") return false;
	return /Instagram/i.test(navigator.userAgent);
}

export function isFacebookWebBrowser(): boolean {
	if (typeof navigator === "undefined") return false;
	return /FB_IAB|FBAN|FBAV/i.test(navigator.userAgent);
}

export function isAppBrowser(): boolean {
	return (
		isLineWebBrowser() || isInstagramWebBrowser() || isFacebookWebBrowser()
	);
}
