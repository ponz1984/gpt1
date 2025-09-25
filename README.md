# Statcast 3D ピッチリプレイ

Statcast 形式の CSV をブラウザで読み込み、捕手視点を中心とした 3D リプレイを再生する React + Three.js アプリケーションです。Vite でビルド可能な静的サイトとして構成しており、バックエンド不要でローカル CSV を解析できます。

## 特長

- CSV をドラッグ&ドロップするだけで投球順に自動再生
- 捕手視点をデフォルトに、主審・センター上空のサブ視点も切替可能
- 等加速度運動 (vx0/vy0/vz0, ax/ay/az) を用いた軌道サンプリング
- 球場の簡易 3D モデル、リリースポイント・軌跡・ストライクゾーンの可視化
- HUD で球速・球種・カウント・アウト・イニング・スコア・イベントを更新
- 再生/一時停止、前後ピッチ移動、速度変更 (0.5x/1x/2x)、オーバーレイ切替
- Zustand を用いた状態管理、Papa Parse によるクライアントサイド CSV パース
- Vitest による物理エンジンの単体テスト

## 使い方

1. `fixtures/sample_statcast.csv` をダウンロードしておくか、Statcast 相当の CSV を用意します。
2. `npm install` で依存関係を取得します。
3. 開発サーバーは `npm run dev` で起動します。ブラウザで表示されたページに CSV をドラッグ&ドロップすると 3D 再生が始まります。
4. ビルドは `npm run build`、静的配信のプレビューは `npm run preview` で確認できます。

> **サンプル確認**: `fixtures/sample_statcast.csv` をアップロードすると 1 打席分が投球順で再生されます。

## CSV 必須列

以下の列名が必須です (Statcast 出力と同等の想定)。欠損があるとエラーメッセージが表示されます。

```
game_date, game_pk, at_bat_number, pitch_number, pitch_type, pitch_name,
release_speed, release_pos_x, release_pos_y, release_pos_z,
vx0, vy0, vz0, ax, ay, az,
plate_x, plate_z,
sz_top, sz_bot,
stand, p_throws,
balls, strikes, outs_when_up,
inning, inning_topbot,
home_team, away_team,
home_score, away_score,
type, description, events,
player_name, batter, pitcher
```

任意列として `post_home_score`, `post_away_score` を参照します (存在しない場合は事前スコアを使用)。

## 既知の制約 / 今後の改善

- MLB StatsAPI などによる打者名の解決は未実装です (CSV 内の ID をそのまま表示)。
- 球場モデルは簡易的です。実際の球場寸法やフェンスは未再現です。
- 打球の飛距離やランナー進塁の再現は未対応です。`events` の文字列表示のみです。
- CSV の内容に依存するため、欠損値・異常値が多い場合は正しく描画できないことがあります。
- Three.js のライティングはベーシックで、実写的な質感には未対応です。

## 開発コマンド

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | Vite 開発サーバーの起動 |
| `npm run build` | TypeScript の型チェックと本番ビルド |
| `npm run preview` | ビルド成果物のローカルプレビュー |
| `npm run lint` | ESLint + Prettier チェック |
| `npm run test` | Vitest によるユニットテスト |

## ライセンス

MIT License
