import { useMemo } from 'react';
import { useViewerStore } from '../state/useStore';
import { getPitchDuration, getPlaybackInterval } from '../engine/playback';

const SPEED_OPTIONS: { label: string; value: 0.5 | 1 | 2 }[] = [
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
];

const VIEW_OPTIONS = [
  { value: 'catcher', label: '捕手視点' },
  { value: 'umpire', label: '主審視点' },
  { value: 'center', label: 'センター上空' },
] as const;

export default function Controls() {
  const {
    pitches,
    currentPitchIndex,
    isPlaying,
    playbackSpeed,
    cameraView,
    togglePlay,
    nextPitch,
    prevPitch,
    setPlaybackSpeed,
    setCameraView,
    toggleTrail,
    toggleRelease,
    toggleZone,
    showTrails,
    showRelease,
    showZone,
  } = useViewerStore((s) => ({
    pitches: s.pitches,
    currentPitchIndex: s.currentPitchIndex,
    isPlaying: s.isPlaying,
    playbackSpeed: s.playbackSpeed,
    cameraView: s.cameraView,
    togglePlay: s.togglePlay,
    nextPitch: s.nextPitch,
    prevPitch: s.prevPitch,
    setPlaybackSpeed: s.setPlaybackSpeed,
    setCameraView: s.setCameraView,
    toggleTrail: s.toggleTrail,
    toggleRelease: s.toggleRelease,
    toggleZone: s.toggleZone,
    showTrails: s.showTrails,
    showRelease: s.showRelease,
    showZone: s.showZone,
  }));

  const currentPitch = pitches[currentPitchIndex];
  const pitchDurationMs = useMemo(() => {
    if (!currentPitch) return 2000;
    const duration = getPitchDuration(currentPitch);
    return getPlaybackInterval(duration, playbackSpeed);
  }, [currentPitch, playbackSpeed]);

  return (
    <section className="controls">
      <div className="controls__left">
        <button type="button" onClick={prevPitch} disabled={currentPitchIndex === 0}>
          前の球
        </button>
        <button type="button" onClick={togglePlay} disabled={!pitches.length}>
          {isPlaying ? '一時停止' : '再生'}
        </button>
        <button
          type="button"
          onClick={nextPitch}
          disabled={currentPitchIndex >= pitches.length - 1}
        >
          次の球
        </button>
        <span className="controls__duration">再生目安: {(pitchDurationMs / 1000).toFixed(2)}秒</span>
      </div>
      <div className="controls__right">
        <div className="controls__group">
          <span className="controls__label">速度</span>
          <div className="controls__chips">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`controls__chip ${option.value === playbackSpeed ? 'controls__chip--active' : ''}`}
                onClick={() => setPlaybackSpeed(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="controls__group">
          <span className="controls__label">視点</span>
          <div className="controls__chips">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`controls__chip ${cameraView === option.value ? 'controls__chip--active' : ''}`}
                onClick={() => setCameraView(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="controls__group">
          <span className="controls__label">オーバーレイ</span>
          <div className="controls__chips">
            <button
              type="button"
              className={`controls__chip ${showZone ? 'controls__chip--active' : ''}`}
              onClick={toggleZone}
            >
              ゾーン
            </button>
            <button
              type="button"
              className={`controls__chip ${showRelease ? 'controls__chip--active' : ''}`}
              onClick={toggleRelease}
            >
              リリース
            </button>
            <button
              type="button"
              className={`controls__chip ${showTrails ? 'controls__chip--active' : ''}`}
              onClick={toggleTrail}
            >
              軌跡
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
