## コーディング規約

- ページはdefault export、それ以外はnamed export
- ログ、エラーは日本語で統一
- 関数の返り値はできるだけ型を明示する。コールバック関数は任意。
- 関数の引数は分割代入し、引数内で型定義
- forEachは使わず、for ofを使用
- any、as、Non-Null Assertion Operatorによる型の誤魔化しは最小にし、できるだけ適切に型付けする。as constの使用は問題ない。
- 関数の引数が複数あるものは基本的にオブジェクトで渡す。
- 型定義はinterfaceではなくtype
- 型定義はなるべくモデルのフィールドを参照する。（特にid）

### api
- コンテキスト変数の参照は`c.var.*`を使う。`c.get("*")`は使わない
- DDDには準拠しない。規模に対して過剰で複雑性が増すため。
- レスポンスは必要なフィールドがあればそれを返し、なければidの見返す。レスポンスボリュームを減らすため。
- WebSocketのCloseEvent Code4000番台は3桁以下をHTTP Status Codeと対応する形とする。
  - 4400
    - HTTP: 400
  - 4404
    - HTTP: 404
  - 退出: 4204
  - 部屋削除: 4410

### フロント
- tailwind mergeの使用はいとしないマージが起こるので使用禁止
- tailwind variantsのslotは複雑になるので基本使用しない
- memo化はなるべくReact Compilerに任せる

#### tailwind css
- `space-*`は使用せず、`gap-*`を使う
