# Statcast 3D リプレイ（捕手視点）

Statcast 形式のCSVをブラウザ上で読み込み、投球を捕手視点の3Dシーンで順番に再生するビューワーです。追加のバックエンドは不要で、ローカルファイルをドラッグ＆ドロップするだけで使用できます。

## 主な機能

- CSVアップロード（ドラッグ＆ドロップ／クリック）で投球データを読み込み
- game_date / game_pk / at_bat_number / pitch_number で並び替えて自動再生
- リリースポイント・軌跡・ストライクゾーンの3D可視化（捕手視点がデフォルト）
- 球速、球種、カウント（B/S）、アウト、イニング、スコア、投手名、打者ID、結果のHUD表示
- Play/Pause・前後の球移動・再生速度（0.5x/1x/2x）・視点切替（捕手／主審／センター上空）
- オーバーレイ（軌跡／リリース／ゾーン）の表示切替
- 等加速度運動による軌道補間（1/240秒ステップ）
- カウント／アウト／スコアの自動更新ロジックを実装
- 異常系（必須列欠落や空ファイル）では日本語のエラーメッセージを表示

## 使い方

1. `npm install` で依存関係をインストールします。
2. `npm run dev` を実行するとローカルサーバーが起動します（デフォルト: http://localhost:5173）。
3. 画面左上のドロップゾーンに Statcast 形式の CSV（例: `fixtures/sample_statcast.csv`）をドラッグ＆ドロップするか、クリックしてファイルを選択します。
4. 読み込みが成功すると、投球が捕手視点で順番に再生されます。HUD とコントロールで情報を確認・操作してください。
5. 別のCSVを読み込みたい場合は同じ手順で新しいファイルを選択します。

## 必須列

以下の列はすべて必須です。欠けている場合はエラーになります。

```
game_date, game_pk, at_bat_number, pitch_number,
pitch_type, pitch_name (任意),
release_speed, release_pos_x, release_pos_y, release_pos_z,
vx0, vy0, vz0, ax, ay, az,
plate_x, plate_z, sz_top, sz_bot,
balls, strikes, outs_when_up,
inning, inning_topbot,
home_team, away_team,
home_score, away_score,
post_home_score (任意), post_away_score (任意),
type, description, events (任意),
player_name, batter, pitcher
```

## 技術スタック

- Vite + React + TypeScript
- three.js / @react-three/fiber / @react-three/drei
- Zustand（状態管理）
- Papa Parse（CSV解析）
- ESLint + Prettier + Vitest

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動します |
| `npm run build` | プロダクションビルドを生成します |
| `npm run preview` | ビルド済みアプリをプレビューします |
| `npm run lint` | ESLint を実行します |
| `npm run test` | Vitest で単体テストを実行します |

## 既知の制約

- CSVには Statcast と同等の列・単位（ft, ft/s, ft/s², mph）が必要です。
- 打者名の解決は行っていません（IDのみ表示）。
- 球場モデルは簡易的なフィールドのみを再現しています。
- events の種類が辞書に存在しない場合は原文を表示します。
- アプリはブラウザ上で完結するため、ファイルサイズが非常に大きいCSVでは読み込みに時間がかかる場合があります。

## ライセンス

MIT License
