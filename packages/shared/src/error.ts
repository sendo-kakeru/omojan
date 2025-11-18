import { hasCause, hasMessage } from "./utils";

export const LOCALSTORAGE_OPERATION_FAILED_MESSAGE =
	"localStorageの操作に失敗しました。\nブラウザ設定でlocalStorageが有効か確認してください。";

const getMessagesFromError = (error: unknown): string[] => {
	if (!(error instanceof Error)) return [];

	const messages = [error.message];
	if (hasCause(error) && hasMessage(error.cause)) {
		messages.push(error.cause.message);
	}

	return messages;
};

export const isUniqueConstraintError = (
	error: unknown,
	options?: {
		/**
		 * 例: "user.email"
		 */
		causeName?: string;
	},
): boolean => {
	return getMessagesFromError(error).some((message) => {
		if (options?.causeName) {
			return message.includes(`UNIQUE constraint failed: ${options.causeName}`);
		}
		return message.includes("UNIQUE constraint failed");
	});
};
