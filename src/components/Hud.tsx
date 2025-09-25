import { useMemo } from 'react';
import { buildResultLabel, formatInning, formatSpeed } from '../utils/formatters';
import { useStore } from '../state/useStore';
import styles from './Hud.module.css';

export const Hud = () => {
  const pitches = useStore((state) => state.pitches);
  const currentPitchIndex = useStore((state) => state.currentPitchIndex);
  const pitch = pitches[currentPitchIndex];

  const hud = useMemo(() => {
    if (!pitch) return null;
    return {
      pitcher: pitch.player_name,
      batter: `打者ID: ${pitch.batter}`,
      inning: formatInning(pitch.inning, pitch.inning_topbot),
      score: `${pitch.away_team} ${pitch.awayScoreAfter} - ${pitch.homeScoreAfter} ${pitch.home_team}`,
      pitchLabel: pitch.pitch_name ?? pitch.pitch_type,
      speed: formatSpeed(pitch.release_speed),
      count: `B ${pitch.countAfter.balls} / S ${pitch.countAfter.strikes}`,
      outs: `${pitch.outsAfter} アウト`,
      result: buildResultLabel(pitch)
    };
  }, [pitch]);

  if (!hud) {
    return (
      <div className={styles.placeholder}>
        CSVを読み込むとHUDがここに表示されます。
      </div>
    );
  }

  return (
    <div className={styles.hud}>
      <div className={styles.cluster}>
        <div className={styles.card}>
          <span className={styles.label}>投手</span>
          <span className={styles.value}>{hud.pitcher}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>打者</span>
          <span className={styles.value}>{hud.batter}</span>
        </div>
        <div className={styles.card}>
          <span className={styles.label}>イニング</span>
          <span className={styles.value}>{hud.inning}</span>
        </div>
        <div className={`${styles.card} ${styles.scoreCard}`}>
          <span className={styles.label}>スコア</span>
          <span className={styles.score}>{hud.score}</span>
        </div>
      </div>
      <div className={styles.pillRow}>
        <span className={styles.pill}>球種 {hud.pitchLabel}</span>
        <span className={styles.pill}>球速 {hud.speed}</span>
        <span className={styles.pill}>カウント {hud.count}</span>
        <span className={styles.pill}>アウト {hud.outs}</span>
      </div>
      <div className={styles.resultEmphasis}>
        <span className={styles.label}>結果</span>
        <span className={styles.result}>{hud.result}</span>
      </div>
    </div>
  );
};
