import { useMemo } from 'react';
import { useViewerStore } from '../state/useStore';

export default function Timeline() {
  const { pitches, atBats, currentPitchIndex, setCurrentPitch } = useViewerStore((s) => ({
    pitches: s.pitches,
    atBats: s.atBats,
    currentPitchIndex: s.currentPitchIndex,
    setCurrentPitch: s.setCurrentPitch,
  }));

  const markers = useMemo(() => {
    const entries: { index: number; label: string }[] = [];
    atBats.forEach((atBat) => {
      if (atBat.pitches.length) {
        const firstIndex = pitches.findIndex((p) => p.id === atBat.pitches[0].id);
        if (firstIndex >= 0) {
          entries.push({
            index: firstIndex,
            label: `打席 ${atBat.pitches[0].at_bat_number}`,
          });
        }
      }
    });
    return entries;
  }, [atBats, pitches]);

  if (!pitches.length) return null;

  return (
    <section className="timeline">
      <div className="timeline__markers">
        {pitches.map((pitch, index) => (
          <button
            type="button"
            key={pitch.id}
            className={`timeline__dot ${index === currentPitchIndex ? 'timeline__dot--active' : ''}`}
            onClick={() => setCurrentPitch(index)}
            aria-label={`ピッチ ${index + 1}`}
          />
        ))}
      </div>
      <div className="timeline__labels">
        {markers.map((marker) => (
          <span
            key={marker.index}
            className="timeline__label"
            style={{ left: `${(marker.index / Math.max(pitches.length - 1, 1)) * 100}%` }}
          >
            {marker.label}
          </span>
        ))}
      </div>
    </section>
  );
}
