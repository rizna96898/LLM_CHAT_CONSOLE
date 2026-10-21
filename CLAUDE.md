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

検証用のスキルは、サーバー側のリポジトリ（`z:\LocalFlaskServer\.claude\skills\`）に置いてある。実行もそちらのルートから行う。

- `verify-ui`: JSの構文と未宣言の変数の検査（`js_check.py --base main`）と、Edge を画面なしで起動してのスクリーンショット（`screenshot.py`）。HTML・CSS・JS を変更したら、PRの前に通す。見た目を作った・直したときは、スクリーンショットを撮って目で確かめる。
- `verify-api`: サーバー側のAPIを、本物のデータに触れずに実際に呼ぶ。

スキルで確かめられないこと（ドラッグなどの連続した操作、iframe の子画面どうしの連携、実際のサーバーとつないだ流れ）は、PRの説明に「未確認」と書いて、ユーザーに実機での確認を頼む。

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

メイン画面とiframe内の子画面は、`localStorage` を介して状態を共有する。キーは `js/constant.js` の `STORAGE_KEYS` に定義する（遊ぶ世界・セッション、世界カードで編集中の世界、世界／キャラクター／プレイヤーの一覧、接続設定）。一覧はフォルダの中身の写しで、画面を開いたときに `refreshSettingsList(kind)`（`js/common.js`、`/settings/list_settings` を呼ぶ）で取り直す。一覧を足す・消す処理は、ブラウザだけを書き換えず、サーバー（ファイル）側を変えてから取り直す。キーを文字列で直接書かない。

子画面で保存した内容をメイン画面に反映するときは、iframeの `src` に `?reload=` を付けて読み直す（`reloadCharacterFrame`、`reloadWorldFrame`）。世界カードで保存・削除したときは、`notifyMainPage`（`js/common.js`）でメイン画面に知らせ（`world_saved` / `world_deleted`）、メイン画面は遊んでいる世界なら表示を合わせる。世界カードで選んだ世界（`edit_world_id`）と、メイン画面で遊ぶ世界（`selected_world_id`）は別に持つ。

### サーバー呼び出し

- 接続先は `getFlaskBaseUrl()` で取る（設定画面の入力欄 → `localStorage` → 既定値の順）。URLを直接書かない。
- サーバーの呼び出しは `js/common.js` の `postJson(path, payload, fallbackMessage)` を使う。GETや `FormData` の送信は `requestJson(path, options, fallbackMessage)` を使う。どちらもHTTPエラーか `ok` が `true` でないときに例外を投げ、例外の `message` にサーバーの `message`、`response` に返却JSONが入る。各画面で `fetch` を直接呼ばない。
- 画像の保存（`/settings/save_image`）だけは `FormData` を `requestJson` に渡して送る（`FormData` のときは `Content-Type` を付けない）。フォームの項目は `base_chat_path`、`owner_type`（`character` / `player`）、`owner_id`、`image_type`（`icon` / `standing`）、`file`。画像の表示は `/settings/load_image/{icon|standing}/{id}?base_chat_path=...` をそのまま `<img>` のURLにする（プレイヤーは `&owner_type=player` を付ける）。
- 通知は `showToast` を使う。

### チャットの流れ（メイン画面）

1. 世界を選ぶ → `/world_start`、`/load_session_list` でその世界のセッション一覧を出す
2. 新規チャット → `/chat_startup`（サーバーがセッションを作り、このフォルダから設定をコピー）→ 返ってきた `session_id` で `/new_chat`（開始メッセージを受け取る）
3. 発言 → `/chat`。失敗したら、自分の吹き出しを消して文章を入力欄に戻す（再送のボタンは無い）
4. 既存セッションを選ぶ → `/selected_session` で履歴を読み込む。メッセージをクリック → `/selected_message`

チャットの吹き出しは `js/constant.js` の `BASE_CHAT_OBJECT` / `BASE_CHAT_OBJECT_USER` をひな形にして組み立てる。チャット画面のアイコンと立ち絵は、`characters/` を直接読まず、`buildSessionImageUrl` で `/session_image/{セッションID}/{icon|standing}/{キャラクターID}` から読む。新規チャット時にサーバーがセッションフォルダへ退避した画像なので、後からキャラクター画面で画像を変えても進行中のチャットには影響しない。画像がない場合（プレイヤー、システムを含む）は名前の頭文字を表示する。

### データフォルダ

- `characters/settings/{id}_setting.yaml`、`characters/icon/{id}/{id}.png`、`characters/standing/{id}/{id}_standing.png`
- `players/settings/{id}_setting.yaml`、`players/icon/{id}/{id}.png`、`players/standing/{id}/{id}_standing.png`
- `worlds/settings/{世界ID}_world.yaml`
- 各 `template/` はフォームの初期値になるテンプレートYAML。サーバーの `/settings/get_template_*` 経由で読む

ファイル名の規則（`_setting.yaml`、`_world.yaml`、`_standing.png`）はサーバー側のコードが前提にしている。

YAMLを入力する欄の検証は `js/common.js` の `validateSimpleYamlText` で、1行に `:` は1つまで、タブ不可という簡易ルール。

## 作業の進め方

サーバー側の `CLAUDE.md` の「作業の進め方」と同じ（区切りごとにPR、範囲は先に確認、マージはユーザーの動作確認のあと）。Web側で特に注意する点:

- **コミットに入れるファイルは名前で指定する**: `characters/`、`players/`、`worlds/` は画面から保存される実データで、ユーザーの動作確認で書き換わっていることがある。`git add -A` でまとめて入れない。
- サーバーとまたがる変更は、同名のブランチでPRを2本作る。
- 仕様や構成を変えたら、同じPRでこのファイルの該当箇所を更新する。

## 仕様と現状の文書

このファイルは入口で、仕様の詳細と現状は別の文書に分けてある。自動では読み込まれないので、当てはまる作業の前に読むこと。

- `docs/spec/screens.md`: 画面の構成、ブラウザに保存するもの、各画面の操作とキー操作。画面を触る前に読む。

APIやデータの仕様と、作りかけ・未実装・既知の不具合の一覧は、サーバー側のリポジトリにまとめてある（画面側の分も含む）。

- `z:\LocalFlaskServer\docs\spec\api.md`: APIの一覧、リクエストの項目、レスポンスの形。サーバーの呼び出しを足す・変える前に読む。
- `z:\LocalFlaskServer\docs\spec\data.md`: 設定YAMLの形、ファイルの置き場所。
- `z:\LocalFlaskServer\docs\spec\chat-flow.md`: 世界の選択から発言までの流れ。
- `z:\LocalFlaskServer\docs\status.md`: 仮の実装、未実装、既知の不具合。見た目だけで処理がつながっていないボタンや入力欄もここに書いてある。

仕様書の【要確認】は、ユーザーの意図がまだ確かめられていない所。そこを前提に作り込む前に、意図を聞く。

`docs/` の文書を直したら、サーバー側のリポジトリで `py -3 docs/tools/add_toc.py` を実行して、目次を作り直す（先頭の目次と、見出しの下の「▲ 目次へ」は、このスクリプトが付けている。手では書き換えない）。

サーバーのレスポンスは、成功 `{"ok": true, ...}`、失敗 `{"ok": false, "message": "..."}` ＋HTTPステータス。画面側は `ok` で判定し、失敗時は `message` を表示する（`requestJson` / `postJson` がこの判定をしている）。
