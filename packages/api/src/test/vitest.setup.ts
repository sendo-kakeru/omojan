import { execSync } from "node:child_process";
import pg from "pg";

const { Client } = pg;

export default async function () {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
	});

	try {
		await client.connect();

		console.log("全てのテーブルを削除しています");
		await client.query("DROP SCHEMA IF EXISTS public CASCADE");
		await client.query("CREATE SCHEMA public");
		await client.query("GRANT ALL ON SCHEMA public TO public");

		console.log("マイグレーションを実行しています");
		execSync("cd ../db && pnpm drizzle-kit push --config=drizzle.config.ts", {
			env: process.env,
			stdio: "inherit",
		});
	} catch (error) {
		console.error("テストデータベースのセットアップに失敗しました:", error);
		throw error;
	} finally {
		await client.end();
	}
}
