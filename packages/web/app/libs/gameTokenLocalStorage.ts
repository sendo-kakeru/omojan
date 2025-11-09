const KEY = "omojan_game_token";

function get(): string | null {
	return localStorage.getItem(KEY);
}

function set(token: string): void {
	localStorage.setItem(KEY, token);
}

function remove(): void {
	localStorage.removeItem(KEY);
}

export const gameTokenLocalStorage = {
	get,
	remove,
	set,
};
