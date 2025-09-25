import { useMemo } from 'react';
import { useStore } from '../state/useStore';
import styles from './Timeline.module.css';

export const Timeline = () => {
  const pitches = useStore((state) => state.pitches);
  const currentIndex = useStore((state) => state.currentPitchIndex);
  const setCurrentPitch = useStore((state) => state.setCurrentPitch);
  const setIsPlaying = useStore((state) => state.setIsPlaying);

  const dots = useMemo(() => {
    return pitches.map((pitch, index) => ({
      label: `${pitch.inning}-${pitch.pitch_number}`,
      isAtBatEnd: pitch.isAtBatEnd,
      index
    }));
  }, [pitches]);

  if (!pitches.length) {
    return <div className={styles.placeholder}>タイムライン（投球順）がここに表示されます。</div>;
  }

  return (
    <div className={styles.timeline}>
      {dots.map((dot) => (
        <button
          key={dot.index}
          type="button"
          className={`${styles.dot} ${dot.index === currentIndex ? styles.active : ''} ${
            dot.isAtBatEnd ? styles.atBatEnd : ''
          }`}
          onClick={() => {
            setCurrentPitch(dot.index);
            setIsPlaying(false);
          }}
          aria-label={`ピッチ ${dot.index + 1}`}
        />
      ))}
    </div>
  );
};
