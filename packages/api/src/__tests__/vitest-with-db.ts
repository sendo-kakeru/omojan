import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repoRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], {
	cwd: process.cwd(),
	encoding: "utf8",
});

if (repoRoot.status !== 0) {
	process.exit(repoRoot.status ?? 1);
}

const root = repoRoot.stdout.trim();
const packageRoot = resolve(root, "packages/api");
const sourceDbPath = resolve(root, "packages/db/src/local.db");
const copyDir = mkdtempSync(join(tmpdir(), "test-db"));
const testDbFile = join(copyDir, "local.db");

cpSync(sourceDbPath, testDbFile);

const vitestArgs = process.argv.slice(2);

const testResult = spawnSync("pnpm", ["vitest", ...vitestArgs], {
	cwd: packageRoot,
	env: {
		...process.env,
		TEST_DB_FILE: testDbFile,
	},
	stdio: "inherit",
});

rmSync(copyDir, { force: true, recursive: true });

if (testResult.error) {
	throw testResult.error;
}

process.exit(testResult.status ?? 0);
