import Canvas3D from './components/Canvas3D';
import Controls from './components/Controls';
import Dropzone from './components/Dropzone';
import Hud from './components/Hud';
import Timeline from './components/Timeline';
import { useStore } from './state/useStore';

export default function App() {
  const hasData = useStore((state) => state.pitches.length > 0);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Statcast 3D リプレイビューア</h1>
        <p className="subtitle">CSVをアップロードして、捕手目線で投球を体感しましょう。</p>
      </header>
      <Dropzone />
      {hasData ? (
        <main className="main-layout">
          <section className="scene-section">
            <Canvas3D />
          </section>
          <aside className="hud-section">
            <Hud />
            <Timeline />
            <Controls />
          </aside>
        </main>
      ) : (
        <div className="empty-state">
          <p>サンプルCSVを読み込むか、お手持ちのStatcast形式データをアップロードしてください。</p>
          <p>読み込み後は自動で投球順に再生されます。操作パネルから再生速度や視点も切り替え可能です。</p>
        </div>
      )}
      <footer className="app-footer">
        <p>⚾️ 指定フォーマットのCSVをクライアントサイドのみで解析し、three.js で再生します。</p>
      </footer>
    </div>
  );
}
