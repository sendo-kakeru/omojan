# DBインデックス追加による Rows Read 削減

## 目的

Turso の Rows Read 課金を削減するため、全件スキャンが発生しているクエリにインデックスを追加する。
効果の小さいインデックスは追加せず、Write コストとのバランスを取る。

## 背景

- Turso は「返却した行数」ではなく「**スキャンした行数**」を Rows Read として課金する
- `round` / `submission` / `vote` / `round_theme` / `player_card` は検索に使う列にインデックスがなく、ゲーム進行・結果表示・履歴一覧の多くのクエリが**テーブル全件スキャン**になっている
  - `vote_player_round_unique (player_id, round_id)` は先頭列が `player_id` のため、`round_id` 単独検索には使われない
- 全件スキャンのコストは「累計ゲーム数 G」に比例するため、1ゲームあたりのコストが G に比例し、**月間コストは G × 月間ゲーム数 で増加し続ける**
- 本番は FK 制約が有効（親のない `round` / `player` が0件であることから判断）。親の行を削除するたびに子テーブルの FK 列で検索が走る

## アーキテクチャ

変更なし（スキーマへのインデックス追加と、クエリ1箇所の条件追加のみ）。

## 仕様

### 実装する仕様

#### 追加するインデックス（7本）

| #   | テーブル      | インデックス名                  | 列                    | 種別   | 主な利用場面                                                                                     |
| --- | ------------- | ------------------------------- | --------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| 1   | `round`       | `round_game_id_round_no_unique` | `(game_id, round_no)` | UNIQUE | ゲーム開始、各提出、各投票、ラウンド結果の発表、結果画面、終了済み一覧、ユーザー戦績             |
| 2   | `submission`  | `submission_round_id_idx`       | `(round_id)`          | INDEX  | ラウンド結果の発表、結果画面、終了済み一覧、ユーザー戦績                                         |
| 3   | `vote`        | `vote_round_id_idx`             | `(round_id)`          | INDEX  | 各投票（投票数の集計）、投票の時間切れ、ラウンド結果の発表、結果画面、終了済み一覧、ユーザー戦績 |
| 4   | `round_theme` | `round_theme_round_id_idx`      | `(round_id)`          | INDEX  | 結果画面、ゲーム開始の再実行                                                                     |
| 5   | `player_card` | `player_card_game_id_idx`       | `(game_id)`           | INDEX  | 結果画面（クエリ修正後）、ゲーム開始の再実行、ゲームの削除                                       |
| 6   | `submission`  | `submission_player_id_idx`      | `(player_id)`         | INDEX  | 各投票（投票先の提出の取得）、プレイヤーの削除（退出・切断・Cleanup）                            |
| 7   | `player_card` | `player_card_player_id_idx`     | `(player_id)`         | INDEX  | 各提出（使用したカードの紐付け）、プレイヤーの削除（退出・切断・Cleanup）                        |

- `round` は「1ゲーム内でラウンド番号は一意」という仕様上の制約があるため UNIQUE とする（`initializeGame` の重複初期化に対する保険にもなる）
  - 重複初期化が競合した場合、後続のトランザクションは既存データを返すのではなく UNIQUE 制約違反で失敗する。`initializeGame` は Durable Object から呼ばれるため競合は通常起きない想定
- `player_id` はゲームごとに発行される ID のため、`player_id` だけで1ゲーム内の1人に絞り込める（提出は最大4件、カードは7枚）。そのため `submission` / `player_card` は `(round_id, player_id)` / `(game_id, player_id)` のような複合にせず、単一列のインデックスを組み合わせる
  - `player_id` と他の列を同時に指定するクエリは `(player_id)` のインデックスで検索され、複合の場合との差は数行程度
- #6・#7 は FK チェックにも使う。player を削除すると、SQLite は参照している子がいないかを `submission.player_id` / `player_card.player_id` で検索するため、インデックスがないと提出・カードがない player でも両テーブルを全件スキャンする（1人あたり 16G + 28G ≈ 44G 行）
  - player の削除はマッチング中の退出（`MatchingDurableObject.handleExit`）・切断検出・部屋の削除（カスケード）、Cleanup で日常的に発生する
  - `vote.player_id` は既存の `vote_player_id_round_id_unique (player_id, round_id)`（下記の名前変更後）で検索できるため不要

#### クエリ修正（1箇所）

`GameService.getResult` のカード取得に `game_id` 条件を追加し、#5 のインデックスを使わせる。
`player_card.submission_id` 用インデックスを追加する代わりの対応。
`saveSubmission` はカードを `gameId` で絞って `submissionId` を紐付けているため、対象カードは必ず同一ゲームのものであり、条件追加で結果は変わらない。

```ts
.where(
	and(
		eq(playerCardTable.gameId, gameId),
		inArray(playerCardTable.submissionId, submissionIds),
	),
);
```

#### 既存インデックスの名前変更（1本）

既存のインデックス名は `{テーブル名}_{列名}_{idx|unique}`（列名は `_id` まで省略しない）で統一されており、drizzle の `.unique()` が自動で付ける名前も同じ形式である。`vote` の UNIQUE インデックスのみ列名の `_id` が省略されているため、本対応で揃える。

| テーブル | 変更前                     | 変更後                           | 列                      |
| -------- | -------------------------- | -------------------------------- | ----------------------- |
| `vote`   | `vote_player_round_unique` | `vote_player_id_round_id_unique` | `(player_id, round_id)` |

- SQLite にはインデックス名を変更する構文がないため、マイグレーションは `DROP INDEX` → `CREATE UNIQUE INDEX` になる
- 列と制約は変わらないため、アプリケーションへの影響はない（`saveVote` の `onConflictDoNothing` は列の組み合わせで判定し、インデックス名には依存しない）
- 既存データは同じ UNIQUE 制約のもとで登録されているため、作り直しで重複エラーになることはない

#### 見送るインデックス

| 候補                                              | 見送り理由                                                                                                                                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `player_card (submission_id)`                     | 読み取りクエリは上記「クエリ修正」で代替できる。FK チェックで使われるのは submission の削除時のみで、下記の理由で不要                                                                                          |
| `vote (submission_id)` / `player_card (round_id)` | FK チェック専用。submission / round を直接削除する処理はなく、削除されるのはラウンド作成済みのゲームの削除（中断・Cleanup）によるカスケードのみ。1件あたりは最大約 1,000G 行と重いが、発生頻度が低いため見送る |
| `vote (round_id, submission_id)`（カバリング）    | 課金上は `(round_id)` と同じ行数になるため利点なし                                                                                                                                                             |
| `game (status, created_at)`                       | 募集中一覧用。既存の `game_status_updated_at_idx (status, updated_at)` で waiting の行に絞り込めており、waiting の部屋は1時間で Cleanup され件数も少ないため、ソート用の追加効果が小さい                       |

### 既存のものとの相違点

- 既存インデックスは `vote_player_round_unique` の名前変更のみ（列・制約は同一）。削除はなし
- 通常のアプリケーションの挙動に変更なし（`getResult` は条件追加のみで結果は同一）
- 例外的に、`round` の `(game_id, round_no)` が重複する INSERT は UNIQUE 制約違反で失敗するようになる

### 関連する仕様

- DB スキーマ変更・マイグレーションの手順: `docs/db.md`
- 終了済みゲーム件数のカウンターテーブル化: `docs/design-docs/finished-game-counter.md`

## 実装

### 反映フロー

1. 現状の Rows Read の実績を記録する（「テスト計画、モニタープラン」の事前検証を参照）
2. `packages/db/src/schemas/` の各スキーマにインデックス定義を追加し、`vote` の既存 UNIQUE インデックスの名前を変更
3. `pnpm run db:changed --filter @repo/db` でマイグレーション生成・ローカル適用
4. `GameService.getResult` のカード取得に `game_id` 条件を追加
5. STG → 本番の順で通常フローで適用

### コスト試算

#### 前提

- 1ゲーム = 4人 × 4ラウンド
- 1ゲームあたりの行数: `round` 4 / `round_theme` 4 / `submission` 16 / `vote` 16 / `player_card` 28
- G = DB に残っている累計ゲーム数（finished は削除されないため増え続ける）
- 結果画面は1ゲームあたり4回（参加者全員）閲覧されると仮定
- `game` / `player` など既にインデックスで引けているテーブルの読み取りは、G に依存しないため省略する（追加後の値は概算）

#### 1回あたりの Rows Read（実測）

ローカルの SQLite に G = 10,000 相当のデータを投入し、`.scanstats on` で各クエリのスキャン行数を計測した。

| クエリ                                                         | 追加前         | 追加後             |
| -------------------------------------------------------------- | -------------- | ------------------ |
| `round WHERE game_id = ?`                                      | 40,000（4G）   | 4                  |
| `round WHERE game_id = ? AND round_no = ?`                     | 40,000（4G）   | 1                  |
| `submission WHERE player_id = ? AND round_id = ?`              | 160,000（16G） | 4                  |
| `submission WHERE round_id = ?`                                | 160,000（16G） | 4                  |
| `vote WHERE round_id = ?`（COUNT 含む）                        | 160,000（16G） | 4                  |
| `round_theme WHERE round_id IN (...)`                          | 40,000（4G）   | 4                  |
| `player_card WHERE game_id = ? AND player_id = ? AND text = ?` | 280,000（28G） | 7                  |
| `player_card WHERE game_id = ?`                                | 280,000（28G） | 28                 |
| `player_card WHERE submission_id IN (...)`                     | 280,000（28G） | 28（クエリ修正後） |

#### 1ゲームあたりの Rows Read

| 処理                                  | 回数/ゲーム | 追加前          | 追加後                           |
| ------------------------------------- | ----------- | --------------- | -------------------------------- |
| `initializeGame`                      | 1           | 4G              | 約 0（新規ゲームはラウンドなし） |
| `saveSubmission`                      | 16          | 16 × 32G = 512G | 16 × 8 = 128                     |
| `saveVote`                            | 16          | 16 × 36G = 576G | 16 × 9 = 144                     |
| `calculateRoundWinnersWithVoteCounts` | 4           | 4 × 36G = 144G  | 4 × 9 = 36                       |
| `getResult`                           | 4           | 4 × 68G = 272G  | 4 × 68 = 272                     |
| **合計**                              |             | **約 1,508G**   | **約 580（G に依存しない）**     |

※ `getVotedPlayerIds`（投票タイムアウト時のみ、最大 20G × 4）は除外

ゲーム外の処理:

| 処理                                 | 追加前 | 追加後              |
| ------------------------------------ | ------ | ------------------- |
| 終了済み一覧 1ページ（勝者計算部分） | 36G    | 約 720（20件 × 36） |
| ユーザー戦績 1回                     | 36G    | 36 × 参加ゲーム数   |
| player 削除 1人（FK チェック）       | 44G    | 約 0                |

#### 月間試算（例）

仮定: 累計 G = 10,000、月間 3,000 ゲーム（100/日）、終了済み一覧 3,000 PV/月、戦績 1,000 PV/月、player 削除 3,000 人/月

|              | 追加前                             | 追加後             |
| ------------ | ---------------------------------- | ------------------ |
| ゲーム進行   | 1,508 × 10,000 × 3,000 ≈ **45.2B** | 580 × 3,000 ≈ 1.7M |
| 終了済み一覧 | 36 × 10,000 × 3,000 ≈ 1.1B         | 720 × 3,000 ≈ 2.2M |
| ユーザー戦績 | 36 × 10,000 × 1,000 ≈ 0.4B         | 1M 未満            |
| player 削除  | 44 × 10,000 × 3,000 ≈ 1.3B         | 1M 未満            |
| **合計**     | **約 48.0B / 月**                  | **約 4M / 月**     |

料金換算（Developer プラン: 2.5B/月まで込み、超過 $1/1B）:

- 追加前: 約 45.5B 超過 → **約 $46 / 月**（G が増えるほど増加）
- 追加後: 無料枠内

実数値は Turso ダッシュボードの累計ゲーム数・月間ゲーム数で置き換えること。上記の式に代入すれば再計算できる。
料金体系は変更されうるため、適用前に参考文献の公式ページで再確認すること。

#### マイグレーション時の一時コスト

`CREATE INDEX` は対象テーブルを1回全件読むため、追加分の約 112G 行と `vote` の名前変更（作り直し）分の約 16G 行を合わせて約 128G 行（G = 10,000 で約 128 万行）の Rows Read が一度だけ発生する。月間の削減幅と比べて無視できる。

#### Write コストの増加

インデックスはテーブル本体とは別に保存されるため、行を書き込むとインデックス側の更新も発生する。

- INSERT: 1行追加するごとに、そのテーブルの各インデックスにエントリが1件追加される
- UPDATE: インデックス対象の列を変更した場合のみ、インデックス側も更新される

本対応で増えるインデックス側の書き込みは以下のとおり。

| テーブル      | 1ゲームあたりの INSERT | 追加するインデックス数 | インデックス側の書き込み |
| ------------- | ---------------------- | ---------------------- | ------------------------ |
| `round`       | 4                      | 1                      | 4                        |
| `submission`  | 16                     | 2                      | 32                       |
| `vote`        | 16                     | 1                      | 16                       |
| `round_theme` | 4                      | 1                      | 4                        |
| `player_card` | 28                     | 2                      | 56                       |
| **合計**      |                        |                        | **112**                  |

- 提出時の `player_card` の UPDATE は `round_id` / `submission_id` のみを変更し、インデックス対象の `game_id` / `player_id` は変更しないため、インデックス側の書き込みは増えない
- インデックス側の書き込みが Turso の Rows Written に計上されるかは未確認のため、計上される前提で見積もる。その場合でも月 3,000 ゲームで約 34 万行（Developer プランの無料枠 25M の約 1.3%）であり、無視できる

### 作成物の使用例

UNIQUE インデックス（`round`）:

```ts
export const roundTable = sqliteTable(
  "round",
  {
    ...tableBaseColumns,
    gameId: text("game_id")
      .notNull()
      .$type<GameId>()
      .references(() => gameTable.id, { onDelete: "cascade" }),
    id: idBaseColumn.$type<RoundId>(),
    roundNo: integer("round_no").notNull().$type<RoundNo>(),
  },
  (table) => [
    uniqueIndex("round_game_id_round_no_unique").on(
      table.gameId,
      table.roundNo,
    ),
  ],
);
```

通常インデックス（`vote`、既存の UNIQUE インデックスの名前変更とあわせて追加）:

```ts
	(table) => [
		uniqueIndex("vote_player_id_round_id_unique").on(
			table.playerId,
			table.roundId,
		),
		index("vote_round_id_idx").on(table.roundId),
	],
```

## セキュリティやプライバシーについての考察

なし。

## 既知でオープンな問題

なし。

## テスト計画、モニタープラン

### テスト

- 既存のユニットテスト・E2E が通ること（挙動の変更なし）
- `getResult` の結果が修正前と同一であること（既存テストで担保）
- ローカルで `EXPLAIN QUERY PLAN` を確認し、対象クエリが `SCAN` ではなく `SEARCH ... USING INDEX` になっていること

### モニタリング

- デプロイ後、Turso ダッシュボードで Rows Read を前後比較する
  - 日次の総量はゲーム数の増減に左右されるため、「Rows Read ÷ ゲーム数」で比較する

### ロールバック

- `round` の UNIQUE 追加でマイグレーションが失敗した場合は、重複行を確認・解消してから再適用する
- インデックスに起因する問題が発生した場合は、スキーマからインデックス定義を削除してマイグレーションを生成し、`DROP INDEX` で戻す
- `getResult` のクエリ修正は条件を外すだけで戻せる（インデックスとは独立して戻せる）

## 参考文献

- [Turso Pricing](https://turso.tech/pricing)
- [Turso introduces additional pricing flexibility with support for Overages](https://blog.turso.tech/turso-introduces-additional-pricing-flexibility-with-support-for-overages-1fbe7e33b704)
- [SQLite Foreign Key Support - Indices](https://www.sqlite.org/foreignkeys.html#fk_indexes)

## レポジトリ

- スキーマ: `packages/db/src/schemas/`
- 対象クエリ: `packages/api/src/application/game/GameService.ts`, `packages/api/src/application/room/RoomService.ts`, `packages/api/src/application/user/UserService.ts`
- 削除経路: `packages/api/src/application/cleanup/CleanupService.ts`

## Docの編集の履歴

| 編集日     | 編集者       | 内容     |
| ---------- | ------------ | -------- |
| 2026-10-08 | sendo-kakeru | 初版作成 |
