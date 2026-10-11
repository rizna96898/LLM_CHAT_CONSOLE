# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このリポジトリの位置づけ

ローカルLLMを使ったロールプレイチャットのWeb側AP（画面）。サーバー側APは別リポジトリ `LocalFlaskServer`（`z:\LocalFlaskServer`、Flask）で、すべての処理をHTTPでそこへ依頼する。

2つのリポジトリは次の点で結合しているので、片方を変えるときはもう片方も確認する。

- **APIパス**: `js/constant.js` の `API_PATHS` と、サーバー側 `src/app.py` のルートが1対1で対応する。追加・改名は両方に入れる。
- **このフォルダがデータ置き場を兼ねる**: `worlds/`、`characters/`、`players/` のYAMLと画像は、ブラウザではなくサーバーがこのフォルダへ直接読み書きする。そのため画面はリクエストごとに、このフォルダの場所（`base_chat_path`）を送る。新規チャット開始時には、サーバーがここからセッションフォルダへ必要なファイルをコピーする。
- **YAMLのキーは日本語**: `世界ID`、`世界名`、`登場人物` → `世界の登場人物`、`参照ID`、`参照種別`、`開始メッセージ` など。`*/template/` のテンプレートYAMLでキーを変えたら、サーバー側の読み取りコードも直す。

## 実行

ビルド、パッケージ管理、テスト、リンターはない。素のHTML/CSS/JSで、`index_3column_session.html` をブラウザで開いて使う。`jsconfig.json` はエディタ用の設定のみ。

動作確認にはサーバー側の起動が必要（`LocalFlaskServer` の `CLAUDE.md` を参照）。初回は画面の「接続環境設定」で次の3つを入力して「適用」する。値は `localStorage` に保存される。

- FlaskサーバーURL（未設定時は `http://127.0.0.1:5000`。サブPCで動かす場合はそのIP）
- ベースチャットパス: このリポジトリの置き場所。**サーバーから見たパス**で指定する（サーバーがサブPCで動くなら `E:\LLM_CHAT_CONSOLE`）
- ベースパス: `LocalFlaskServer` の置き場所。同じくサーバーから見たパス

## 構成

### 画面

- `index_3column_session.html` / `.js` / `.css` が現行のメイン画面（チャット、セッション一覧、世界選択）。
- `world.html`、`character.html`、`player.html`、`settings.html` は単独でも開ける子画面で、メイン画面にはiframeのオーバーレイとして埋め込まれている。「別窓」ボタンで別ウィンドウにも開ける。

各HTMLは `js/constant.js` → `js/common.js` → 画面ごとのJS の順に `<script>` で読み込む。モジュールではなく全部グローバルなので、共通の定数・関数はこの2ファイルに置き、読み込み順を保つ。

### 画面間の状態共有

メイン画面とiframe内の子画面は、`localStorage` を介して状態を共有する。キーは `js/constant.js` の `STORAGE_KEYS` に定義する（選択中の世界・セッション、世界／キャラクター／プレイヤーの一覧、接続設定）。`session_list` と `selected_session_name` は `STORAGE_KEYS` を通さず文字列で直接使われている。

子画面で保存した内容をメイン画面に反映するときは、iframeの `src` に `?reload=` を付けて読み直す（`reloadCharacterFrame`、`reloadWorldFrame`）。

### サーバー呼び出し

- 接続先は `getFlaskBaseUrl()` で取る（設定画面の入力欄 → `localStorage` → 既定値の順）。URLを直接書かない。
- サーバーの呼び出しは `js/common.js` の `postJson(path, payload, fallbackMessage)` を使う。GETや `FormData` の送信は `requestJson(path, options, fallbackMessage)` を使う。どちらもHTTPエラーか `ok` が `true` でないときに例外を投げ、例外の `message` にサーバーの `message`、`response` に返却JSONが入る。各画面で `fetch` を直接呼ばない。
- 画像の保存（`/settings/save_image`）だけは `FormData` を `requestJson` に渡して送る（`FormData` のときは `Content-Type` を付けない）。画像の表示は `/settings/load_image/{icon|standing}/{id}?base_chat_path=...` をそのまま `<img>` のURLにする。
- 通知は `showToast` を使う。

### チャットの流れ（メイン画面）

1. 世界を選ぶ → `/world_start`、`/load_session_list` でその世界のセッション一覧を出す
2. 新規チャット → `/chat_startup`（サーバーがセッションを作り、このフォルダから設定をコピー）→ 返ってきた `session_id` で `/new_chat`（開始メッセージを受け取る）
3. 発言 → `/chat`、再送 → `/re_chat`
4. 既存セッションを選ぶ → `/selected_session` で履歴を読み込む。メッセージをクリック → `/selected_message`

チャットの吹き出しは `js/constant.js` の `BASE_CHAT_OBJECT` / `BASE_CHAT_OBJECT_USER` をひな形にして組み立てる。アイコン画像は `characters/icon/{id}/{id}.png` を相対パスで直接参照する。

### データフォルダ

- `characters/settings/{id}_setting.yaml`、`characters/icon/{id}/{id}.png`、`characters/standing/{id}/{id}_standing.png`
- `players/settings/{id}_setting.yaml`
- `worlds/settings/{世界ID}_world.yaml`
- 各 `template/` はフォームの初期値になるテンプレートYAML。サーバーの `/settings/get_template_*` 経由で読む

ファイル名の規則（`_setting.yaml`、`_world.yaml`、`_standing.png`）はサーバー側のコードが前提にしている。

YAMLを入力する欄の検証は `js/common.js` の `validateSimpleYamlText` で、1行に `:` は1つまで、タブ不可という簡易ルール。

## 現状の注意点

- `README.txt` は設定画面を追加したときのメモで、`flask_settings_api.py` は存在しない。該当のAPIは `LocalFlaskServer` に実装されている。
- サーバーのレスポンスは、成功 `{"ok": true, ...}`、失敗 `{"ok": false, "message": "..."}` ＋HTTPステータスに統一している。画面側は `ok` で判定し、失敗時は `message` を表示する。
- `/chat` と `/re_chat` はサーバー側が作りかけで、話者は `shirai_yui` 固定、`/re_chat` は固定文を返す。
