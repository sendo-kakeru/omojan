const KEY = "omojan_game_token";

type Options = {
	onError?: (error: unknown) => void;
};

function get(options?: Options): string | null {
	if (typeof window === "undefined") return null;

	try {
		return localStorage.getItem(KEY);
	} catch (error) {
		options?.onError?.(error);
		return null;
	}
}

function set(token: string, options?: Options): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(KEY, token);
	} catch (error) {
		options?.onError?.(error);
	}
}

function remove(options?: Options): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.removeItem(KEY);
	} catch (error) {
		options?.onError?.(error);
	}
}

export const gameTokenLocalStorage = {
	get,
	remove,
	set,
};
