# gyosei-yosou.jp（WordPress / AFFINGER7）カスタマイズ

- `affinger-child/` … 有効化している子テーマ。`functions.php` に以下を実装
  - AFFINGER 管理の初期値ブートストラップ（構造化データ・広告明記・関連記事カード）
  - `[gy_ad slot=".."]` AdSense ユニット（`wp_options` の `gy_adsense_client` 未設定時は何も出力しない）
  - `[gy_pr]` アフィリエイト PR 表記、`[gy_countdown]` 本試験カウントダウン
  - `[gy_faq][gy_q q=".."]..[/gy_q][/gy_faq]` FAQ＋FAQPage JSON-LD
- `tools/` … サイト構築スクリプト（管理者資格情報は環境変数 `WPU` / `WPP` で渡す。ファイルには保存しない）
  - `upload_child.py` 子テーマを zip 化してアップロード（上書き）
  - `publish_content.py` カテゴリ・固定ページ・投稿を slug キーで作成/更新
  - `setup_menus.py` / `setup_widgets.py` メニューとサイドバー

## AdSense を有効にする手順
1. 審査用コードの `ca-pub-XXXX` を `wp_options` の `gy_adsense_client` に保存（WP-CLI: `wp option update gy_adsense_client ca-pub-XXXX`）
2. AFFINGER 管理 → Google・広告/AMP の各ウィジェット（PC/スマホ/インフィード）にユニットコードを貼る、または記事内に `[gy_ad slot="..."]`
