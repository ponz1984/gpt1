import { useMemo } from 'react';
import { useViewerStore } from '../state/useStore';
import {
  formatCount,
  formatEvent,
  formatInning,
  formatMatchup,
  formatPitchLabel,
  formatScore,
  formatSpeed,
} from '../utils/formatters';

export default function Hud() {
  const { pitches, currentPitchIndex, showZone, showTrails, showRelease } = useViewerStore((s) => ({
    pitches: s.pitches,
    currentPitchIndex: s.currentPitchIndex,
    showZone: s.showZone,
    showTrails: s.showTrails,
    showRelease: s.showRelease,
  }));

  const pitch = pitches[currentPitchIndex];

  const headline = useMemo(() => {
    if (!pitch) return null;
    return formatMatchup(pitch.home_team, pitch.away_team);
  }, [pitch]);

  if (!pitch) {
    return null;
  }

  const countLabel = formatCount(pitch.postCount.balls, pitch.postCount.strikes);
  const inningLabel = formatInning(pitch.inning, pitch.inning_topbot);
  const homeScore = pitch.post_home_score ?? pitch.home_score;
  const awayScore = pitch.post_away_score ?? pitch.away_score;
  const score = formatScore(homeScore, awayScore);
  const eventLabel = formatEvent(pitch);

  return (
    <section className="hud">
      <div className="hud__top">
        <div>
          <p className="hud__matchup">{headline}</p>
          <p className="hud__pitcher">
            投手: <strong>{pitch.player_name}</strong>
          </p>
        </div>
        <div className="hud__score">
          <div>
            <span className="hud__label">イニング</span>
            <span className="hud__value">{inningLabel}</span>
          </div>
          <div>
            <span className="hud__label">スコア</span>
            <span className="hud__value">{score}</span>
          </div>
          <div>
            <span className="hud__label">アウト</span>
            <span className="hud__value">{pitch.outsAfter}</span>
          </div>
        </div>
      </div>
      <div className="hud__bottom">
        <div className="hud__stat">
          <span className="hud__label">球速</span>
          <span className="hud__value">{formatSpeed(pitch.release_speed)}</span>
        </div>
        <div className="hud__stat">
          <span className="hud__label">球種</span>
          <span className="hud__value">{formatPitchLabel(pitch)}</span>
        </div>
        <div className="hud__stat">
          <span className="hud__label">カウント</span>
          <span className="hud__value">{countLabel}</span>
        </div>
        <div className="hud__stat hud__stat--event">
          <span className="hud__label">結果</span>
          <span className="hud__value">{eventLabel}</span>
        </div>
        <div className="hud__toggles">
          <span>表示:</span>
          <span className={`hud__badge ${showZone ? 'hud__badge--on' : ''}`}>ゾーン</span>
          <span className={`hud__badge ${showRelease ? 'hud__badge--on' : ''}`}>リリース</span>
          <span className={`hud__badge ${showTrails ? 'hud__badge--on' : ''}`}>軌跡</span>
        </div>
      </div>
    </section>
  );
}
