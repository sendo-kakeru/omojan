# 部屋参加用token

> 2025-11-08 更新 / 旧: Cookie方式 → 新: **WS のクエリで送信**（サードパーティクッキー非依存）

---

## 0. TL;DR
- **同一の秘密トークン（game_token）**でマッチング部屋／ゲーム部屋へ参加・再接続を可能にする。
- トークンは **DB にハッシュ保存**（平文は保持しない）。クライアントは **localStorage** に保持。
- **WebSocket はハンドシェイク時にクエリの tokenで認証し、OK のときのみ upgrade**。

---

## 1. Goals
- 同一トークンでマッチング部屋／ゲーム部屋どちらにも入室可能。
- 回線断・リロード時の再接続を同トークンで可能にする（新接続優先、旧接続は排他）。
- 管理サーバ側で `hash(game_token)` → player 一意突合（DB 漏洩時の悪用リスク低減）。
- **未認証の WS を成立させない**（HTTP レベルで 401/403、upgrade しない）。

---

## 2. 用語
- game_token: クライアントが保持する入室token。
- game_token_hash: `SHA-256(game_token)` （DB 保存用）。
- DO: Durable Objects（`playerId -> connection` と排他制御を管理）。

---

## 3. アーキテクチャ概要
- Server
  - HTTP: Cloudflare Workers + Hono
  - WS: ハンドシェイクで `?token=...`（または `?ticket=...`）を検証 → OK なら upgrade、NG は 401/403
- State
  - DO で `playerId -> connection` を保持し、重複接続は新規優先（旧接続を 4001 で close）
- DB
  - SQLite（Drizzle）
  - `player.gameTokenHash` を UNIQUE で保存（平文は保存しない）
- Client
  - SPA（`localStorage` に `game_token` を保存）

---

## 4. データモデル（Drizzle）
```ts
export const playerTable = sqliteTable("player", {
	...tableBaseColumns,
	gameId: text("game_id")
		.notNull()
		.references(() => gameTable.id, { onDelete: "cascade" }),
	gameTokenHash: text("game_token_hash").notNull().unique(),
	isHost: integer("is_host", { mode: "boolean" }).notNull().default(false),
	playerName: text("player_name").notNull(),
	seat: integer("seat").notNull().$type<1 | 2 | 3 | 4>(),
	userId: text("user_id").references(() => userTable.id, {
		onDelete: "set null",
	}),
});
```

---

## 5. トークン仕様
- 生成
  - 32B CSPRNG → Base64URL（約 43 文字）。
  - 返却は平文 `game_token`（HTTP レスポンス）。
  - DB には `SHA-256(game_token)` を保存。
- 保持（クライアント）
  - `localStorage` 
- ライフサイクル
  - 募集中退室時に該当 `player` を失効（以降同トークンは使用不可）。
  - ゲーム中断線は再接続可（同トークンで WS ハンドシェイク → 旧接続は DO 側で 4001）。

---

## 6. セキュリティ（クエリ方式のハードニング必須チェック）
- WSS 強制と Origin 検証
  - `wss://` のみ許可。`Origin` はフロントの許可オリジン限定で厳格にチェック。
- ハンドシェイクで認証完了させる
  - 認証に失敗したら **HTTP 401/403** を返し、**upgrade しない**（未認証 WS を作らない）。
- リプレイ・多重接続制御
  - DO で `playerId -> connection` を持ち、重複時は旧接続を **4001 replaced** で close。

---

## 7. 発行タイミングと API
- ホスト作成: `POST /v1/rooms` → `game_token` を返却。
- 参加: `POST /v1/rooms/{roomId}/join` → `game_token` を返却。
- 退室（募集中のみ）: WebSocket で `{ type: "EXIT" }` メッセージ送信 → `player` 失効。

### 7.1 レスポンス例

    {
      "data": { "gameId": "gm_xxx", "gameToken": "bQ0Jw4..._pQ" },
      "message": "OK"
    }

---

## 8. WebSocket 認証
- Client: `new WebSocket("wss://api.example.com/v1/ws/<gameId>?token=<game_token>")`
- Server: ハンドシェイク要求の `URLSearchParams.get("token")` を検証し、OK のときのみ upgrade。
  - 失敗は **HTTP 401/403**（upgrade しない）。

### 8.1 状態遷移
- `HTTP request` → 認証 OK → `101 Switching Protocols` → `authenticated` WS
- 認証 NG → `401/403`（upgrade しない）

---

## 9. 代表的フロー
- ホスト作成 → `game_token` 受領 → `wss://.../v1/ws/<gameId>?token=...` で接続。
- 参加 → `game_token` 受領 → 同上。
- 再接続 → 同トークンで接続、DO が旧接続を **4001 replaced** で排他。
- 募集中退室 → 該当 `player` 失効 → そのトークンでは以後接続不可。

---

## 10. エラーハンドリング / Close Code
- 4001 replaced: 同一 `player` の重複接続が発生し、旧接続を閉じた。
- 401/403（HTTP）: ハンドシェイク認証に失敗（upgrade しない）。
- 1002 protocol_error: JSON 破損や型エラー（WS 以降の通常メッセージ時）。
