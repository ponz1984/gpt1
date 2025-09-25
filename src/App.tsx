import { useEffect } from 'react';
import Canvas3D from './components/Canvas3D';
import Controls from './components/Controls';
import Dropzone from './components/Dropzone';
import Hud from './components/Hud';
import Timeline from './components/Timeline';
import { useViewerStore } from './state/useStore';

function ErrorBanner() {
  const error = useViewerStore((s) => s.error);
  if (!error) return null;
  return <div className="error">{error}</div>;
}

function AutoPauseOnBlur() {
  const pause = useViewerStore((s) => s.pause);
  useEffect(() => {
    const handler = () => pause();
    window.addEventListener('blur', handler);
    return () => window.removeEventListener('blur', handler);
  }, [pause]);
  return null;
}

export default function App() {
  const hasData = useViewerStore((s) => s.pitches.length > 0);
  return (
    <>
      <header className="app-header">
        <h1>Statcast形式CSV → 3Dピッチリプレイ</h1>
        <p className="app-header__lead">
          サンプルCSVを読み込んで捕手視点の3Dリプレイを体験してください。すべてブラウザ内で完結します。
        </p>
      </header>
      <main>
        <AutoPauseOnBlur />
        <Dropzone />
        <ErrorBanner />
        {hasData ? (
          <>
            <Hud />
            <Canvas3D />
            <Timeline />
            <Controls />
          </>
        ) : (
          <section className="placeholder">
            <p>画面上部のドロップゾーンに CSV をドラッグ&ドロップしてください。</p>
            <p>fixtures/sample_statcast.csv を使って動作確認済みです。</p>
          </section>
        )}
      </main>
      <footer className="app-footer">
        <small>Statcastデータをもとに等加速度運動で軌跡を再現します。β版。</small>
      </footer>
    </>
  );
}
