import { useCallback } from 'react';
import { useStore } from '../state/useStore';

const SPEED_OPTIONS = [0.5, 1, 2];
const CAMERA_OPTIONS = [
  { key: 'catcher', label: '捕手視点' },
  { key: 'umpire', label: '主審視点' },
  { key: 'center', label: 'センター上空' },
] as const;

type OverlayKey = 'trajectory' | 'release' | 'zone';

const OVERLAY_OPTIONS: { key: OverlayKey; label: string }[] = [
  { key: 'trajectory', label: '軌跡' },
  { key: 'release', label: 'リリース点' },
  { key: 'zone', label: 'ストライクゾーン' },
];

export default function Controls() {
  const { isPlaying, play, pause, nextPitch, previousPitch, playbackSpeed, setPlaybackSpeed, cameraView, setCameraView, showTrajectory, showReleasePoint, showStrikeZone, toggleOverlay } = useStore((state) => ({
    isPlaying: state.isPlaying,
    play: state.play,
    pause: state.pause,
    nextPitch: state.nextPitch,
    previousPitch: state.previousPitch,
    playbackSpeed: state.playbackSpeed,
    setPlaybackSpeed: state.setPlaybackSpeed,
    cameraView: state.cameraView,
    setCameraView: state.setCameraView,
    showTrajectory: state.showTrajectory,
    showReleasePoint: state.showReleasePoint,
    showStrikeZone: state.showStrikeZone,
    toggleOverlay: state.toggleOverlay,
  }));

  const handlePlayPause = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const overlayState: Record<OverlayKey, boolean> = {
    trajectory: showTrajectory,
    release: showReleasePoint,
    zone: showStrikeZone,
  };

  return (
    <div className="controls-container">
      <div className="controls-row">
        <button type="button" onClick={previousPitch} className="control-button">
          ◀ 前の投球
        </button>
        <button type="button" onClick={handlePlayPause} className="control-button primary">
          {isPlaying ? '⏸ 一時停止' : '▶ 再生'}
        </button>
        <button type="button" onClick={nextPitch} className="control-button">
          次の投球 ▶
        </button>
      </div>
      <div className="controls-row">
        <div className="control-group">
          <span className="group-label">再生速度</span>
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              type="button"
              className={`chip${playbackSpeed === speed ? ' active' : ''}`}
              onClick={() => setPlaybackSpeed(speed)}
            >
              {speed.toFixed(1)}x
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="group-label">視点</span>
          {CAMERA_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`chip${cameraView === option.key ? ' active' : ''}`}
              onClick={() => setCameraView(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="control-group">
          <span className="group-label">オーバーレイ</span>
          {OVERLAY_OPTIONS.map((overlay) => (
            <button
              key={overlay.key}
              type="button"
              className={`chip${overlayState[overlay.key] ? ' active' : ''}`}
              onClick={() => toggleOverlay(overlay.key)}
            >
              {overlay.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
