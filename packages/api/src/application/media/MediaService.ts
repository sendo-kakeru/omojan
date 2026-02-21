import type { UploadedImageInfo } from "@repo/db/model";

export class MediaService {
	constructor(
		private readonly bucket: R2Bucket,
		/**
		 * 公開URL
		 * ローカル開発ではオプショナル
		 */
		private readonly publicUrl?: string,
	) {}

	/**
	 * 複数サイズの画像をアップロード
	 * 変換成功時はwebp形式、失敗時またはローカル環境では元の形式で保存
	 * @returns アップロードされた画像情報の配列
	 */
	async uploadImage({
		baseKey,
		file,
		widths = [1024],
	}: {
		/** ストレージのベースキー (例: "users/user-123/images/uuid") */
		baseKey: string;
		/** 元の画像ファイル */
		file: File;
		/** 生成する幅の配列 (例: [64, 128, 256, 512]) */
		widths: number[];
	}): Promise<UploadedImageInfo[]> {
		const originalBuffer = await file.arrayBuffer();
		const results: UploadedImageInfo[] = [];

		// 公開URLからアクセス可能にするため、まず元ファイルをR2にアップロード
		const tempKey = `${baseKey}/temp-original`;
		await this.bucket.put(tempKey, originalBuffer, {
			httpMetadata: { contentType: file.type },
		});

		for (const width of widths) {
			const key = `${baseKey}/${width}`;

			try {
				let imageData: ArrayBuffer;
				let contentType: string;

				// ローカル開発環境（公開URLなし）では変換をスキップ
				if (!this.publicUrl) {
					imageData = originalBuffer;
					contentType = file.type;
				} else {
					imageData = await this.transformImage({ tempKey, width });
					contentType = "image/webp";
				}

				await this.bucket.put(key, imageData, {
					httpMetadata: { contentType },
				});

				results.push({
					key,
					size: imageData.byteLength,
					width,
				});
			} catch (error) {
				console.error(`画像の変換に失敗しました (${width}px):`, error);
				// 変換に失敗した場合は元画像を元のMIMEタイプで保存
				await this.bucket.put(key, originalBuffer, {
					httpMetadata: { contentType: file.type },
				});

				results.push({
					key,
					size: originalBuffer.byteLength,
					width,
				});
			}
		}

		// 一時ファイルを削除
		await this.bucket.delete(tempKey);

		return results;
	}

	/**
	 * Cloudflare Image Transformationsを使用して画像を変換（webp形式）
	 */
	private async transformImage({
		tempKey,
		width,
	}: {
		/** 一時ファイルのキー */
		tempKey: string;
		/** 変換後の幅 */
		width: number;
	}): Promise<ArrayBuffer> {
		const imageUrl = `${this.publicUrl}/${tempKey}`;

		const response = await fetch(imageUrl, {
			cf: {
				image: {
					fit: "cover" as const,
					format: "webp" as const,
					height: width,
					quality: 85,
					width,
				},
			},
		});

		if (!response.ok) {
			throw new Error(
				`画像の変換に失敗しました: ${response.status} ${response.statusText}`,
			);
		}

		return response.arrayBuffer();
	}
}
