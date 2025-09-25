Baseball Slot Demo

GitHub Pages などの静的ホスティングでそのまま公開できる、野球モチーフのスロットマシンデモです。/game/baseball-slot/ 配下に実装されています。

クイックスタート（GitHub Pages ユーザーサイト）

このリポジトリを username.github.io という名前で GitHub に作成します。

main ブランチをデフォルトに設定し、Settings → Pages で Deploy from Branch を選び main を公開対象にします。

https://username.github.io/game/baseball-slot/ にアクセスするとゲームが起動します。トップページ（https://username.github.io/）はこのリポジトリ直下の index.html が表示されます。

ローカル開発
npm install   # 依存はありませんが、Node 18+ での開発を推奨
node --test   # ユニットテスト


ブラウザで game/baseball-slot/index.html を開くとローカルで動作確認できます。

ディレクトリ構成

index.html: ルートページ（リンク集や紹介ページとして利用可能）

game/baseball-slot/: ゲーム本体

index.html, styles.css, main.js: UI / ロジック

assets/: SVG アイコン

tests/: Node node:test を使ったユニットテスト

ライセンス

このデモはサンプル目的で提供されています。現金や景品などの換金性は一切ありません。