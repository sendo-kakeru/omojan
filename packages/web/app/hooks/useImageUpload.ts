import { hasMessage } from "@repo/shared/utils";
import { useCallback, useState } from "react";
import { cognito } from "~/libs/cognito";
import { validateImageFile } from "~/libs/image";

export function useImageUpload() {
	const [isUploading, setIsUploading] = useState(false);

	const uploadImage = useCallback(
		async ({ file, key }: { file: File; key: string }) => {
			const validationError = validateImageFile(file);
			if (validationError) throw new Error(validationError);

			setIsUploading(true);
			try {
				const accessToken = await cognito.getAccessToken();
				if (!accessToken) throw new Error("認証が必要です");
				const response = await fetch(
					`${import.meta.env.VITE_CDN_URL}/images/${key}`,
					{
						body: file,
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Content-Type": "application/octet-stream",
						},
						method: "PUT",
					},
				);

				if (!response.ok) {
					const message = await response
						.json()
						.then((json: unknown) =>
							hasMessage(json) ? json.message : "アップロードに失敗しました",
						)
						.catch(() => "アップロードに失敗しました");
					throw new Error(message);
				}

				const { data } = (await response.json()) as {
					data: { key: string };
				};
				return data.key;
			} finally {
				setIsUploading(false);
			}
		},
		[],
	);

	return { isUploading, uploadImage };
}
