export interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
	first<T = unknown>(): Promise<T | null>;
	raw(): Promise<unknown[][]>;
	run<T = unknown>(): Promise<T>;
}

export interface D1Database {
	batch<T = unknown>(statements: readonly D1PreparedStatement[]): Promise<T[]>;
	dump(): Promise<ArrayBuffer>;
	exec(query: string): Promise<unknown>;
	prepare(query: string): D1PreparedStatement;
}
