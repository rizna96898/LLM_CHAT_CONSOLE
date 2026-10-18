# LLM_CHAT_CONSOLE

ローカルLLMを使ったロールプレイチャットの画面（ビルドなしの静的HTML/JS）。
処理はすべて、サーバー側の LocalFlaskServer（Flask）にHTTPで頼む。

## 資料の置き場所

- 画面の決まりごと（構成、JSの読み込み順、localStorage、コミット時の注意）: このフォルダの CLAUDE.md
- 画面の仕様（各画面の操作、ブラウザに保存するもの）: docs/spec/screens.md
- サーバーの起動方法・設定: LocalFlaskServer の CLAUDE.md
- APIの一覧: LocalFlaskServer の docs/spec/api.md

## 使い方（短く）

1. サブPCで LocalFlaskServer の APサーバー（src/app.py）とモデルサーバー（src/server.py）を起動する
2. index_3column_session.html をブラウザで開く
3. 初回は「接続環境設定」で、サーバーのURL・このフォルダの場所・LocalFlaskServer の場所を入れて「適用」する

ブラウザ単体ではエクスプローラーや外部エディタを開けないので、そうした操作は LocalFlaskServer 経由で行う。
