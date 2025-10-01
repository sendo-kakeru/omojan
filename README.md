# ようこそOmojanへ

## コーディング規約
- ページはdefault export、それ以外はnamed export
- propsは分割代入し、引数で型定義
- tailwind mergeの使用はいとしないマージが起こるので使用禁止
- tailwind variantsのslotは複雑になるので基本使用しない
- ログは日本語で統一
- 関数の返り値はできるだけ型を明示する。コールバック関数は任意。
- forEachは使わず、for ofを使用