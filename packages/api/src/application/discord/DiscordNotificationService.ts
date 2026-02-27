import { PROD_SITE_URL } from "@repo/shared/constants/config";

export class DiscordNotificationService {
	constructor(private readonly webhookUrl: string) {}

	/**
	 * 募集中の部屋をDiscordに通知する。
	 * 送信失敗してもエラーは投げずログ出力のみ行う。
	 */
	async sendWaitingRoomNotification(): Promise<void> {
		const body = {
			embeds: [
				{
					color: 0x5865f2,
					description: `現在募集中の部屋があります。\nゲームに参加しましょう！\n\n${PROD_SITE_URL}`,
					timestamp: new Date().toISOString(),
					title: "🎮 対戦相手を募集中",
					url: PROD_SITE_URL,
				},
			],
		};

		try {
			const response = await fetch(this.webhookUrl, {
				body: JSON.stringify(body),
				headers: { "Content-Type": "application/json" },
				method: "POST",
			});

			if (!response.ok) {
				console.error(
					`Discord通知の送信に失敗しました: ${response.status} ${response.statusText}`,
				);
			}
		} catch (error) {
			console.error("Discord通知の送信中にエラーが発生しました:", error);
		}
	}
}
