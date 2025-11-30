import { expect, type Page, test } from "@playwright/test";

function uniqueSuffix() {
	return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function extractGameIdFromUrl(url: string): string | undefined {
	const match = /\/matching\/([^/]+)/.exec(url);
	if (!match) {
		throw new Error("gameIdの取得に失敗しました");
	}
	return match[1];
}

async function createRoom({
	page,
	roomTitle,
	playerName,
}: {
	page: Page;
	roomTitle: string;
	playerName: string;
}) {
	await page.goto("/");
	await page.getByRole("button", { name: "部屋作成" }).click();
	await expect(page.getByLabel("部屋名")).toBeVisible({ timeout: 5_000 });
	await page.getByLabel("部屋名").fill(roomTitle);
	await page.getByLabel("プレイヤー名").fill(playerName);
	await page.getByRole("button", { name: "作成する" }).click();

	await page.waitForURL(/\/matching\//);
	const gameId = extractGameIdFromUrl(page.url());
	await expect(page.getByRole("heading", { name: roomTitle })).toBeVisible({
		timeout: 10_000,
	});
	await expect(page.getByText(playerName)).toBeVisible();

	return { gameId };
}

async function joinRoom({
	page,
	roomTitle,
	playerName,
}: {
	page: Page;
	roomTitle: string;
	playerName: string;
}) {
	await page.goto("/");
	const joinButton = page.getByRole("button", { name: `${roomTitle}に参加` });
	await expect(joinButton).toBeVisible({ timeout: 5_000 });
	await joinButton.click();

	const nameField = page.getByLabel("プレイヤー名");
	if (await nameField.isVisible()) {
		await nameField.fill(playerName);
	}
	await page.getByRole("button", { name: "参加する" }).click();

	await page.waitForURL(/\/matching\//);
	const gameId = extractGameIdFromUrl(page.url());

	return { gameId };
}

test("部屋を作成したらマッチングルームに接続できる", async ({ page }) => {
	const roomTitle = `作成テスト-${uniqueSuffix()}`;
	const playerName = `プレイヤー-${uniqueSuffix()}`;

	const { gameId } = await createRoom({
		page,
		playerName: playerName,
		roomTitle,
	});

	expect(gameId).toBeTruthy();
	await expect(page.getByRole("button", { name: "退出する" })).toBeVisible({
		timeout: 15_000,
	});
});

test("参加者1人の部屋に入ったら募集中画面に遷移する", async ({
	browser,
	page,
}) => {
	const roomTitle = `募集中-${uniqueSuffix()}`;
	const playerName = `プレイヤー-${uniqueSuffix()}`;
	const guestName = `ゲスト-${uniqueSuffix()}`;
	const baseURL = test.info().project.use.baseURL;

	const hostContext = await browser.newContext({ baseURL });
	const hostPage = await hostContext.newPage();
	await createRoom({ page: hostPage, playerName, roomTitle });

	const { gameId } = await joinRoom({
		page,
		playerName: guestName,
		roomTitle,
	});
	await expect(page.getByRole("heading", { name: roomTitle })).toBeVisible();
	await expect(page.getByText(playerName)).toBeVisible();
	await expect(
		page.getByText("4人揃ったらゲームが開始されます。"),
	).toBeVisible();
	await page.waitForURL(`/matching/${gameId}`, { timeout: 8_000 });
	expect(page.url()).toContain(`/matching/${gameId}`);

	await hostContext.close();
});

test("参加者3人の部屋に入るとマッチング完了後にゲーム画面へ遷移する", async ({
	browser,
	page,
}) => {
	const roomTitle = `満員-${uniqueSuffix()}`;
	const baseURL = test.info().project.use.baseURL;
	const playerName = `プレイヤー-${uniqueSuffix()}`;
	const playerB = `参加者B-${uniqueSuffix()}`;
	const playerC = `参加者C-${uniqueSuffix()}`;
	const playerD = `参加者D-${uniqueSuffix()}`;

	const hostContext = await browser.newContext({ baseURL });
	const hostPage = await hostContext.newPage();
	const { gameId } = await createRoom({
		page: hostPage,
		playerName: playerName,
		roomTitle,
	});

	const contextB = await browser.newContext({ baseURL });
	const pageB = await contextB.newPage();
	await joinRoom({ page: pageB, playerName: playerB, roomTitle });

	const contextC = await browser.newContext({ baseURL });
	const pageC = await contextC.newPage();
	await joinRoom({ page: pageC, playerName: playerC, roomTitle });

	await joinRoom({ page, playerName: playerD, roomTitle });

	await expect(
		page.getByText("参加者が集まりました。5秒後にゲーム画面へ移動します。"),
	).toBeVisible({ timeout: 5_000 });

	await page.waitForURL(`/game/${gameId}`, { timeout: 20_000 });
	await expect(page.getByRole("heading", { name: "ゲーム画面" })).toBeVisible();

	await contextB.close();
	await contextC.close();
	await hostContext.close();
});

test("退出ボタンで退出が行える", async ({ page }) => {
	const roomTitle = `退出-${uniqueSuffix()}`;
	const playerName = `プレイヤー-${uniqueSuffix()}`;

	await createRoom({ page, playerName: playerName, roomTitle });
	await page.getByRole("button", { name: "退出する" }).click();

	await page.waitForURL("/");
	await expect(
		page.getByRole("button", { name: `${roomTitle}に参加` }),
	).toHaveCount(0, { timeout: 5_000 });
});

test("ページを閉じたら数秒後に離席となる", async ({ browser, page }) => {
	const roomTitle = `離席-${uniqueSuffix()}`;
	const playerName = `プレイヤー-${uniqueSuffix()}`;
	const guestName = `ゲスト-${uniqueSuffix()}`;
	const baseURL = test.info().project.use.baseURL;

	const { gameId } = await createRoom({
		page,
		playerName: playerName,
		roomTitle,
	});

	const guestContext = await browser.newContext({ baseURL });
	const guestPage = await guestContext.newPage();
	await joinRoom({ page: guestPage, playerName: guestName, roomTitle });

	await expect(page.getByText(guestName)).toBeVisible();

	await guestContext.close();

	await expect(page.getByText(guestName)).not.toBeVisible({ timeout: 20_000 });
	expect(page.url()).toContain(`/matching/${gameId}`);
});
