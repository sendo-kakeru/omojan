---
paths: ["**/*.{ts,tsx}"]
---

## コーディング規約

- ページは default export、それ以外は named export
- ログ、エラーは日本語で統一
- 関数の返り値はできるだけ型を明示する。コールバック関数は任意。
- 関数の引数は分割代入し、引数内で型定義
- forEach は使わず、for of を使用
- any、as、Non-Null Assertion Operator による型の誤魔化しは最小にし、できるだけ適切に型付けする。as const の使用は問題ない。
- 関数の引数が複数あるものは基本的にオブジェクトで渡す。
- 型定義は interface ではなく type
- 型定義はなるべくモデルのフィールドを参照する。（特に id）
- 要素の props 型は `React.ComponentProps` に統一する。React 19 では `ComponentPropsWithRef` と同一のため使い分けない。ref を受け取らせない場合のみ `ComponentPropsWithoutRef` を使う

## ディレクトリ命名規約

- 小文字で統一し、2 語以上は kebab-case（`room-card`）。camelCase・PascalCase は使わない
- ディレクトリ名が「子要素そのものの種類」を指す場合は複数形
  - `components`、`hooks`、`routes`、`contexts`、`libs`、`constants`、`workers`、`models`、`schemas`、`migrations`
  - 判定方法: 子に対して「これは◯◯です」と言えるか（`Button.tsx` は component、`user.ts` は schema）
- ディレクトリ名が「そのディレクトリ自身の役割・層・分類」を指す場合は単数形
  - `application`、`presentation`（子は `game` などのドメインであって application ではない）
  - `components/button`、`components/form`、`components/icon`（子は分類の構成要素）
- 例外: 不可算名詞は上記に関わらず単数（`middleware`）
