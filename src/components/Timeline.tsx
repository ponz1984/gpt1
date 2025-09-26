import { useMemo } from 'react';
import { useStore } from '../state/useStore';
import { getPitchColor } from '../utils/colors';

export default function Timeline() {
  const { atBat, currentAtBatIndex, currentPitchIndex, jumpTo } = useStore((state) => ({
    atBat: state.atBats[state.currentAtBatIndex],
    currentAtBatIndex: state.currentAtBatIndex,
    currentPitchIndex: state.currentPitchIndex,
    jumpTo: state.jumpTo,
  }));

  const pitches = atBat?.pitches ?? [];
  const dots = useMemo(
    () =>
      pitches.map((pitch) => ({
        key: pitch.id,
        label: `${pitch.pitch_number}`,
        color: getPitchColor(pitch.pitch_type),
        index: pitch.indexInAtBat,
        result: pitch.displayResult,
        pitchLabel: pitch.pitchLabel,
        highlight: pitch.highlightResult,
      })),
    [pitches]
  );

  if (!atBat || pitches.length === 0) return null;

  return (
    <div className="timeline-container">
      <div className="timeline-title">打席内ピッチ</div>
      <div className="timeline-dots">
        {dots.map((dot) => (
          <button
            key={dot.key}
            type="button"
            className={`timeline-dot${currentPitchIndex === dot.index ? ' active' : ''}${dot.highlight ? ' highlight' : ''}`}
            style={{ backgroundColor: dot.color }}
            onClick={() => jumpTo(currentAtBatIndex, dot.index)}
            title={`#${dot.label} ${dot.pitchLabel} / ${dot.result}`}
          >
            {dot.label}
          </button>
        ))}
      </div>
    </div>
  );
}
