/**
 * 終了済みゲームの勝者を、player.is_winner の反映前後で照合するスクリプト
 * 詳細は docs/design-docs/game-winner-column.md の「本番データでの反映前後の照合」を参照
 *
 * 使い方（packages/api で実行）:
 *   # 反映前・反映後にそれぞれ、終了済み一覧の全ページから勝者を取得して保存する
 *   pnpm exec tsx ./src/scripts/compare-finished-winners.ts snapshot --api-url https://api.omojan.com --out before.json
 *   pnpm exec tsx ./src/scripts/compare-finished-winners.ts snapshot --api-url https://api.omojan.com --out after.json
 *   # 保存した2つを照合する（不一致があれば終了コード1）
 *   pnpm exec tsx ./src/scripts/compare-finished-winners.ts compare --before before.json --after after.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
	array,
	boolean,
	type InferOutput,
	number,
	object,
	parse,
	record,
	string,
} from "valibot";

/** 1リクエストあたりの取得件数（API の上限） */
const PAGE_LIMIT = 100;
/** 本番 API への負荷を避けるためのリクエスト間隔 */
const REQUEST_INTERVAL_MS = 1000;

const finishedRoomListResponseSchema = object({
	data: object({
		items: array(
			object({
				gameId: string(),
				players: array(object({ id: string(), isWinner: boolean() })),
			}),
		),
		meta: object({ totalPages: number() }),
	}),
});

/** gameId → 勝者の playerId（昇順） */
const snapshotSchema = record(string(), array(string()));
type Snapshot = InferOutput<typeof snapshotSchema>;

async function sleep({ ms }: { ms: number }): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSnapshot({
	apiUrl,
}: {
	apiUrl: string;
}): Promise<Snapshot> {
	const snapshot: Snapshot = {};
	let totalPages = 1;

	// リクエストは直列にし、間隔を空ける
	for (let page = 1; page <= totalPages; page++) {
		const url = new URL("/v1/rooms", apiUrl);
		url.searchParams.set("status", "finished");
		url.searchParams.set("limit", String(PAGE_LIMIT));
		url.searchParams.set("page", String(page));

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`終了済み一覧の取得に失敗しました: ${url.toString()} (${response.status})`,
			);
		}
		const body = parse(finishedRoomListResponseSchema, await response.json());
		totalPages = body.data.meta.totalPages;

		for (const item of body.data.items) {
			snapshot[item.gameId] = item.players
				.filter((player) => player.isWinner)
				.map((player) => player.id)
				.sort();
		}
		console.log(`${page}/${totalPages} ページを取得しました`);

		if (page < totalPages) await sleep({ ms: REQUEST_INTERVAL_MS });
	}

	return snapshot;
}

function readSnapshot({ path }: { path: string }): Snapshot {
	return parse(snapshotSchema, JSON.parse(readFileSync(path, "utf8")));
}

/**
 * 反映前後の両方に存在するゲームだけを比較し、勝者が異なるゲームを返す
 * 取得中に終了したゲームによるページのずれを吸収するため、gameId をキーに比較する
 */
function compareSnapshots({
	after,
	before,
}: {
	after: Snapshot;
	before: Snapshot;
}): {
	comparedCount: number;
	mismatches: { after: string[]; before: string[]; gameId: string }[];
} {
	const mismatches: { after: string[]; before: string[]; gameId: string }[] =
		[];
	let comparedCount = 0;

	for (const [gameId, beforeWinners] of Object.entries(before)) {
		const afterWinners = after[gameId];
		if (!afterWinners) continue;

		comparedCount++;
		if (beforeWinners.join(",") !== afterWinners.join(",")) {
			mismatches.push({ after: afterWinners, before: beforeWinners, gameId });
		}
	}

	return { comparedCount, mismatches };
}

async function main(): Promise<void> {
	const { positionals, values } = parseArgs({
		allowPositionals: true,
		options: {
			after: { type: "string" },
			"api-url": { type: "string" },
			before: { type: "string" },
			out: { type: "string" },
		},
	});
	const [command] = positionals;

	if (command === "snapshot") {
		const apiUrl = values["api-url"];
		const out = values.out;
		if (!apiUrl || !out) {
			throw new Error("snapshot には --api-url と --out を指定してください");
		}

		const snapshot = await fetchSnapshot({ apiUrl });
		writeFileSync(out, `${JSON.stringify(snapshot, null, "\t")}\n`);
		console.log(
			`${Object.keys(snapshot).length} 件のゲームの勝者を ${out} に保存しました`,
		);
		return;
	}

	if (command === "compare") {
		if (!values.before || !values.after) {
			throw new Error("compare には --before と --after を指定してください");
		}

		const { comparedCount, mismatches } = compareSnapshots({
			after: readSnapshot({ path: values.after }),
			before: readSnapshot({ path: values.before }),
		});
		console.log(`${comparedCount} 件のゲームを照合しました`);

		if (mismatches.length > 0) {
			console.error(`勝者が一致しないゲームが ${mismatches.length} 件あります`);
			for (const mismatch of mismatches) {
				console.error(JSON.stringify(mismatch));
			}
			process.exitCode = 1;
			return;
		}
		console.log("全てのゲームで勝者が一致しました");
		return;
	}

	throw new Error("コマンドには snapshot または compare を指定してください");
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
