# アーキテクチャ

- サーバー: Cloudflare Workers / Hono
  - Websocket状態保持: Durable Objects
- クライアント: Cloudflare Workers / React Router
- DB: Cloudflare D1 (SQLite)
  - 本番: Cloudflare D1
  - STG: Cloudflare D1
  - Local: Wrangler D1 （ローカルSQLite）
- 認証: AWS Cognito(Google OAuth)
- オブジェクトストレージ: Cloudflare R2

```mermaid
flowchart LR
  %% ===== Clients =====
  subgraph CLIENT["クライアント"]
    Browser["ブラウザ - RR"]
  end

  %% ===== Edge / App Layer =====
  subgraph EDGE["Cloudflare Workers（Edge）"]
    FE["フロントエンド Worker - RR"]
    API["API Worker - Hono"]
    DO["WS State - Durable Objects"]
  end

  %% ===== Auth =====
  subgraph AUTH["認証"]
    Cognito["AWS Cognito"]
  end

  %% ===== Data Stores =====
  subgraph DATA["データストア"]
    D1[(Cloudflare D1)]
    R2[(Cloudflare R2)]
  end

  %% ===== Flows =====
  FE --> API
  API <--> DO

  Browser --> FE
  Browser -->|HTTP| API
  Browser <-->|WebSocket| API

  Browser --> Cognito

  API --> Cognito

  API <--> D1
  API <--> R2

  %% ===== Styles =====
  classDef dim fill:#f6f7f9,stroke:#c6cbd1,color:#24292e;
  classDef edge fill:#fff7e6,stroke:#f5c26b,color:#222;
  classDef store fill:#eef5ff,stroke:#8ab6ff,color:#1f2a44;
  classDef auth fill:#eafaf1,stroke:#8dd3b6,color:#113f2e;
  class CLIENT dim;
  class EDGE edge;
  class AUTH auth;
  class D1,R2 store;
```
