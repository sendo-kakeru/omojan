## コーディング規約

- ページはdefault export、それ以外はnamed export
- ログ、エラーは日本語で統一
- 関数の返り値はできるだけ型を明示する。コールバック関数は任意。
- forEachは使わず、for ofを使用
- any、as、Non-Null Assertion Operatorによる型の誤魔化しは最小にし、できるだけ適切に型付けする。as constの使用は問題ない。

### api
- コンテキスト変数の参照は`c.var.*`を使う。`c.get("*")`は使わない
- DDDには準拠しない。規模に対して過剰で複雑性が増すため。
- レスポンスは必要なフィールドがあればそれを返し、なければidの見返す。レスポンスボリュームを減らすため。

### フロント
- propsは分割代入し、引数で型定義
- tailwind mergeの使用はいとしないマージが起こるので使用禁止
- tailwind variantsのslotは複雑になるので基本使用しない

#### tailwind css
- `space-*`は使用せず、`gap-*`を使う
