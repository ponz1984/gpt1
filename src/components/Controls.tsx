import { useMemo } from 'react';
import { useStore, ViewMode } from '../state/useStore';
import styles from './Controls.module.css';

const SPEED_OPTIONS = [0.5, 1, 2];
const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'catcher', label: '捕手視点' },
  { value: 'umpire', label: '主審視点' },
  { value: 'center', label: 'センター上空' }
];

export const Controls = () => {
  const isPlaying = useStore((state) => state.isPlaying);
  const setIsPlaying = useStore((state) => state.setIsPlaying);
  const nextPitch = useStore((state) => state.nextPitch);
  const prevPitch = useStore((state) => state.prevPitch);
  const playbackSpeed = useStore((state) => state.playbackSpeed);
  const setPlaybackSpeed = useStore((state) => state.setPlaybackSpeed);
  const view = useStore((state) => state.view);
  const setView = useStore((state) => state.setView);
  const overlays = useStore((state) => state.overlays);
  const toggleOverlay = useStore((state) => state.toggleOverlay);
  const pitchCount = useStore((state) => state.pitches.length);

  const hasData = useMemo(() => pitchCount > 0, [pitchCount]);

  return (
    <div className={styles.controls}>
      <div className={styles.section}>
        <button type="button" onClick={prevPitch} disabled={!hasData}>
          前の球
        </button>
        <button
          type="button"
          className={styles.primary}
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!hasData}
        >
          {isPlaying ? '一時停止' : '再生'}
        </button>
        <button type="button" onClick={nextPitch} disabled={!hasData}>
          次の球
        </button>
      </div>
      <div className={styles.section}>
        <span className={styles.label}>再生速度</span>
        <div className={styles.group}>
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.toggle} ${playbackSpeed === option ? styles.active : ''}`}
              onClick={() => setPlaybackSpeed(option)}
              disabled={!hasData}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <span className={styles.label}>視点</span>
        <div className={styles.group}>
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.toggle} ${view === option.value ? styles.active : ''}`}
              onClick={() => setView(option.value)}
              disabled={!hasData}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <span className={styles.label}>オーバーレイ</span>
        <div className={styles.group}>
          <button
            type="button"
            className={`${styles.toggle} ${overlays.showTrajectory ? styles.active : ''}`}
            onClick={() => toggleOverlay('showTrajectory')}
            disabled={!hasData}
          >
            軌跡
          </button>
          <button
            type="button"
            className={`${styles.toggle} ${overlays.showRelease ? styles.active : ''}`}
            onClick={() => toggleOverlay('showRelease')}
            disabled={!hasData}
          >
            リリース
          </button>
          <button
            type="button"
            className={`${styles.toggle} ${overlays.showZone ? styles.active : ''}`}
            onClick={() => toggleOverlay('showZone')}
            disabled={!hasData}
          >
            ゾーン
          </button>
        </div>
      </div>
    </div>
  );
};
