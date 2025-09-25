import { useMemo } from 'react';
import { Canvas3D } from './components/Canvas3D';
import { Controls } from './components/Controls';
import { Dropzone } from './components/Dropzone';
import { Hud } from './components/Hud';
import { Timeline } from './components/Timeline';
import { useStore } from './state/useStore';
import styles from './App.module.css';

export const App = () => {
  const pitches = useStore((state) => state.pitches);
  const error = useStore((state) => state.error);
  const gameSummary = useMemo(() => {
    if (!pitches.length) return null;
    const first = pitches[0];
    return {
      home: first.home_team,
      away: first.away_team,
      pitcher: first.player_name
    };
  }, [pitches]);

  return (
    <div className={styles.app}>
      <div className={styles.leftPane}>
        <header className={styles.header}>
          <h1>Statcast 3D リプレイ（捕手視点）</h1>
          <p className={styles.subtitle}>
            CSVをドラッグ＆ドロップ、またはクリックして読み込みます。
          </p>
          <Dropzone />
          {error ? <p className={styles.error}>{error}</p> : null}
          {gameSummary ? (
            <div className={styles.summary}>
              <span>
                対戦: {gameSummary.away} @ {gameSummary.home}
              </span>
              <span>投手: {gameSummary.pitcher}</span>
            </div>
          ) : null}
        </header>
        <div className={styles.timelineWrapper}>
          <Timeline />
        </div>
        <Controls />
      </div>
      <main className={styles.mainPane}>
        <div className={styles.hudWrapper}>
          <Hud />
        </div>
        <div className={styles.canvasWrapper}>
          <Canvas3D />
        </div>
      </main>
    </div>
  );
};
