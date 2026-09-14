import { expect, type Locator, type Page, test } from "@playwright/test";

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

/**
 * ダイアログが開くまでトリガーのクリックを再試行する。
 */
async function clickUntilVisible({
	trigger,
	target,
	timeout = 30_000,
}: {
	trigger: Locator;
	target: Locator;
	timeout?: number;
}) {
	await expect(async () => {
		if (!(await target.isVisible())) {
			await trigger.click({ timeout: 5_000 });
		}
		await expect(target).toBeVisible({ timeout: 2_000 });
	}).toPass({ timeout });
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
	await expect(
		page.getByRole("heading", { name: "募集中の部屋" }),
	).toBeVisible();
	await clickUntilVisible({
		target: page.getByLabel("部屋名"),
		trigger: page.getByRole("button", { name: "部屋をつくる" }),
	});
	await page.getByLabel("部屋名").fill(roomTitle);
	await page.getByLabel("プレイヤー名").fill(playerName);
	await page.getByRole("button", { name: "作成する" }).click();
	await page.waitForURL(/\/matching\//);
	const gameId = extractGameIdFromUrl(page.url());
	await expect(page.getByRole("heading", { name: roomTitle })).toBeVisible({
		timeout: 20_000,
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
	await expect(
		page.getByRole("heading", { name: "募集中の部屋" }),
	).toBeVisible();
	const joinButton = page.getByRole("button", { name: `${roomTitle}に参加` });
	await expect(joinButton).toBeVisible();

	const joinConfirmedButton = page.getByRole("button", { name: "参加する" });
	await clickUntilVisible({ target: joinConfirmedButton, trigger: joinButton });

	const nameField = page.getByLabel("プレイヤー名");
	if (await nameField.isVisible()) {
		await nameField.fill(playerName);
	}
	await joinConfirmedButton.click({ timeout: 15_000 });

	// 4人目の参加時はゲーム画面に直接遷移する可能性がある
	await page.waitForURL(/\/(matching|game)\//);
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
		timeout: 25_000,
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
	await page.waitForURL(`/matching/${gameId}`, { timeout: 20_000 });
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

	// 4人揃うとゲーム画面へ遷移する
	// 全プレイヤーがゲーム画面へ遷移することを確認
	// waitUntil: "commit"を使用して、URLが変更されたら次へ進む（load待ちによるタイムアウトを防ぐ）
	await Promise.all([
		hostPage.waitForURL(`/game/${gameId}`, {
			timeout: 30_000,
			waitUntil: "commit",
		}),
		pageB.waitForURL(`/game/${gameId}`, {
			timeout: 30_000,
			waitUntil: "commit",
		}),
		pageC.waitForURL(`/game/${gameId}`, {
			timeout: 30_000,
			waitUntil: "commit",
		}),
		page.waitForURL(`/game/${gameId}`, {
			timeout: 30_000,
			waitUntil: "commit",
		}),
	]);

	// 全プレイヤーでゲーム開始を確認
	const verifyGameStart = async (targetPage: typeof page, label: string) => {
		await expect(
			targetPage.getByRole("navigation").getByText("Round"),
			`${label} should see "Round" in nav`,
		).toBeVisible({ timeout: 30_000 });
	};

	await Promise.all([
		verifyGameStart(hostPage, "Host"),
		verifyGameStart(pageB, "PlayerB"),
		verifyGameStart(pageC, "PlayerC"),
		verifyGameStart(page, "PlayerD"),
	]);

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
	).toHaveCount(0, { timeout: 15_000 });
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

	await expect(page.getByText(guestName)).not.toBeVisible({ timeout: 30_000 });
	expect(page.url()).toContain(`/matching/${gameId}`);
});

test("1人でCPUを補充してゲームを開始し、ゲーム開始画面が表示される", async ({
	page,
}) => {
	const roomTitle = `1人開始-${uniqueSuffix()}`;
	const playerName = `プレイヤー-${uniqueSuffix()}`;

	const { gameId } = await createRoom({
		page,
		playerName: playerName,
		roomTitle,
	});

	const startButton = page.getByRole("button", { name: "今すぐ開始" });
	await expect(startButton).toBeVisible();
	await startButton.click();

	await page.waitForURL(`/game/${gameId}`, { timeout: 30_000 });

	// ゲーム画面が表示されることを確認
	await expect(page.getByRole("navigation").getByText("Round")).toBeVisible({
		timeout: 30_000,
	});
});

test("2人でCPUを補充してゲームを開始し、ゲーム開始画面が表示される", async ({
	browser,
	page,
}) => {
	const roomTitle = `2人開始-${uniqueSuffix()}`;
	const playerName = `プレイヤー-${uniqueSuffix()}`;
	const guestName = `ゲスト-${uniqueSuffix()}`;
	const baseURL = test.info().project.use.baseURL;

	// ホストが部屋を作成
	const hostContext = await browser.newContext({ baseURL });
	const hostPage = await hostContext.newPage();
	const { gameId } = await createRoom({
		page: hostPage,
		playerName: playerName,
		roomTitle,
	});

	// ゲストが参加
	await joinRoom({ page, playerName: guestName, roomTitle });
	await expect(page.getByText(playerName)).toBeVisible({ timeout: 20_000 });

	// ホストが「今すぐ開始」をクリック
	const startButton = hostPage.getByRole("button", { name: "今すぐ開始" });
	await expect(startButton).toBeVisible();
	await startButton.click();

	// ゲスト側でゲーム画面への遷移を確認
	await page.waitForURL(`/game/${gameId}`, { timeout: 30_000 });

	// ゲーム画面が表示されることを確認
	await expect(page.getByRole("navigation").getByText("Round")).toBeVisible({
		timeout: 30_000,
	});

	await hostContext.close();
});
