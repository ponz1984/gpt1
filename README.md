# Statcast 3D リプレイビューア

Statcast 形式の CSV をブラウザにドラッグ＆ドロップすると、投球を捕手視点で 3D リプレイするシングルページアプリです。three.js（@react-three/fiber）で球場とボール軌道を描画し、CSV の運動量データから等加速度運動を補間して再生します。

## 使い方

1. `npm install` で依存関係をインストールします。
2. `npm run dev` を実行してローカル開発サーバーを起動します。
3. ブラウザで `http://localhost:5173` を開き、画面上部のドロップゾーンに CSV をドラッグ＆ドロップするか、クリックしてファイルを選択します。
4. 付属のサンプル（`fixtures/sample_statcast.csv`）はヘッダー右の「サンプルCSVを読み込む」ボタンから読み込めます。
5. 再生/一時停止、前後の投球移動、再生速度、視点切り替え、オーバーレイ表示の ON/OFF などは操作パネルから制御できます。

> **ホスティング**: `npm run build` でビルドすると `dist/` に静的ファイルが生成され、GitHub Pages 等でホストできます。

## 必須列

以下の列が存在する CSV を前提としています（Statcast 公式のエクスポートに準拠）。

- `game_date`, `game_pk`, `at_bat_number`, `pitch_number`
- `pitch_type`, `pitch_name` (任意), `release_speed`
- `release_pos_x`, `release_pos_y`, `release_pos_z`
- `vx0`, `vy0`, `vz0`, `ax`, `ay`, `az`
- `plate_x`, `plate_z`, `sz_top`, `sz_bot`
- `balls`, `strikes`, `outs_when_up`
- `inning`, `inning_topbot`
- `home_team`, `away_team`, `home_score`, `away_score`, `post_home_score`, `post_away_score`
- `type`, `description`, `events`
- `player_name`, `batter`, `pitcher`

これらが欠けている場合はエラーメッセージを表示します。

## 機能概要

- CSV 読み込み後、自動で投球順に並び替え、捕手視点をデフォルトに 3D 再生します。
- リリース地点・軌道ライン・ストライクゾーンのオーバーレイを個別に ON/OFF 可能。
- 球速・球種・カウント（B/S）・アウトカウント・イニング・スコア・投手/打者ラベル・打席結果を HUD に表示。
- 最終投球はイベントをハイライト表示。
- 再生速度（0.5x/1x/2x）、視点（捕手/主審/センター上空）を切り替え可能。
- タイムラインで打席内の投球をドット表示し、任意の球へジャンプできます。

## 既知の制約 / 注意事項

- 現状ネットワーク制限がある環境では `npm install` が失敗する場合があります。CI や本番環境でのセットアップ時には npm レジストリへのアクセス権を確認してください。
- CSV に打者名が含まれていないため、HUD 上では `打者 <ID>` の形式で表示します（将来的に StatsAPI での名前解決に対応予定）。
- アウトカウント・スコアは `events` と `post_*` 列を元に推定しています。欠損が多いデータでは正確性が低下する可能性があります。
- ランチアングル等の打球データは未対応です（将来的な拡張項目）。

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動します。 |
| `npm run build` | TypeScript チェックと本番ビルドを実行します。 |
| `npm run preview` | ビルド済みアプリをプレビューします。 |
| `npm run lint` | ESLint を実行します。 |
| `npm run test` | Vitest によるユニットテストを実行します（`src/engine/physics.test.ts` を含む）。 |

## ライセンス

MIT License
