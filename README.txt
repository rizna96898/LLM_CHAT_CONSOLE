# settings API update

## 追加/置換するファイル

- settings.html
- settings.css
- settings.js

## Flask側の参考API

- flask_settings_api.py

既存のFlaskサーバーがある場合は、`flask_settings_api.py` のエンドポイントだけ移植してください。

## エンドポイント

- GET  /health
- POST /settings/select_base_path
- POST /settings/open_system_yaml
- POST /settings/load_model

## 注意

ブラウザ単体ではエクスプローラー起動や外部エディタ起動はできないため、Flask経由でOS操作します。
