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
      <div className={styles.topRow}>
        <div>
          <span className={styles.label}>投手</span>
          <span className={styles.value}>{hud.pitcher}</span>
        </div>
        <div>
          <span className={styles.label}>打者</span>
          <span className={styles.value}>{hud.batter}</span>
        </div>
        <div>
          <span className={styles.label}>イニング</span>
          <span className={styles.value}>{hud.inning}</span>
        </div>
      </div>
      <div className={styles.scoreRow}>
        <span className={styles.label}>スコア</span>
        <span className={styles.score}>{hud.score}</span>
      </div>
      <div className={styles.middleRow}>
        <div>
          <span className={styles.label}>球種</span>
          <span className={styles.value}>{hud.pitchLabel}</span>
        </div>
        <div>
          <span className={styles.label}>球速</span>
          <span className={styles.value}>{hud.speed}</span>
        </div>
        <div>
          <span className={styles.label}>カウント</span>
          <span className={styles.value}>{hud.count}</span>
        </div>
        <div>
          <span className={styles.label}>アウト</span>
          <span className={styles.value}>{hud.outs}</span>
        </div>
      </div>
      <div className={styles.bottomRow}>
        <span className={styles.label}>結果</span>
        <span className={styles.result}>{hud.result}</span>
      </div>
    </div>
  );
};
