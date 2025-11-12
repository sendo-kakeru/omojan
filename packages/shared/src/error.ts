import { hasCause, hasMessage } from "./utils";

export const LOCALSTORAGE_OPERATION_FAILED_MESSAGE =
	"localStorageの操作に失敗しました。\nブラウザ設定でlocalStorageが有効か確認してください。";

const getErrorMessagesFromError = (error: unknown): string[] => {
	if (!(error instanceof Error)) return [];

	const messages = [error.message];
	if (hasCause(error) && hasMessage(error.cause)) {
		messages.push(error.cause.message);
	}

	return messages;
};

export const isUniqueConstraintError = ({
	error,
	causeName,
}: {
	error: unknown;
	causeName?: string;
}): boolean => {
	return getErrorMessagesFromError(error).some((message) => {
		if (causeName) {
			return message.includes(`UNIQUE constraint failed: ${causeName}`);
		}
		return message.includes("UNIQUE constraint failed");
	});
};
