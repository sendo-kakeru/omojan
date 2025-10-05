export class UniqueKeyAlreadyExistsError extends Error {
	constructor(message?: string) {
		super(message ?? "ユニークキーが既に存在します");
		this.name = "UniqueKeyAlreadyExistsError";
	}
}
