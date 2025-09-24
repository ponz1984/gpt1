# Baseball Slot Demo

GitHub Pages などの静的ホスティングでそのまま公開できる、野球モチーフのスロットマシンデモです。`/game/baseball-slot/` 配下に実装されています。

## クイックスタート（GitHub Pages ユーザーサイト）
1. このリポジトリを `username.github.io` という名前で GitHub に作成します。
2. `main` ブランチをデフォルトに設定し、Settings → Pages で **Deploy from Branch** を選び `main` を公開対象にします。
3. 数十秒後に `https://username.github.io/` へアクセスすると、自動で `/game/baseball-slot/` にリダイレクトされゲームが起動します。

## ローカル開発
```bash
npm install   # 依存はありませんが、Node 18+ での開発を推奨
node --test   # ユニットテスト
```

ブラウザで `game/baseball-slot/index.html` を開くとローカルで動作確認できます。

## ディレクトリ構成
- `index.html`: GitHub Pages でゲームへ即時遷移するトップレベルランディング
- `game/baseball-slot/`: ゲーム本体
  - `index.html`, `styles.css`, `main.js`: UI / ロジック
  - `assets/`: SVG アイコン
  - `tests/`: Node `node:test` を使ったユニットテスト

## ライセンス
このデモはサンプル目的で提供されています。現金や景品などの換金性は一切ありません。
