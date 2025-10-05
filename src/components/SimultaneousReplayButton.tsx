import { useCallback } from 'react';
import { useStore } from '../state/useStore';

export default function SimultaneousReplayButton() {
  const { hasData, startMultiReplay, multiReplayActive } = useStore((state) => ({
    hasData: state.pitches.length > 0,
    startMultiReplay: state.startMultiReplay,
    multiReplayActive: state.multiReplayActive,
  }));

  const handleClick = useCallback(() => {
    startMultiReplay();
  }, [startMultiReplay]);

  if (!hasData) return null;

  return (
    <button
      type="button"
      className={`floating-sim-button${multiReplayActive ? ' active' : ''}`}
      onClick={handleClick}
    >
      軌道を同時に再現する
    </button>
  );
}
