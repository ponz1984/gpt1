import { useMemo } from 'react';
import { useStore, selectDisplayPitch, selectDisplayAtBat, selectCurrentPitch } from '../state/useStore';
import CountDots from './CountDots';
import { formatInning } from '../utils/formatters';
import { getTeamInfo } from '../utils/teamMaps';

function CountDisplay() {
  const { phase, displayPitch, lastVisibleCount } = useStore((state) => ({
    phase: state.phase,
    displayPitch: selectDisplayPitch(state),
    lastVisibleCount: state.lastVisibleCount,
  }));

  if (phase === 'preFirst' || phase === 'inningBreak') {
    return null;
  }

  const countSource = displayPitch
    ? {
        balls: displayPitch.postCount.balls,
        strikes: displayPitch.postCount.strikes,
        outs: displayPitch.outsAfter,
      }
    : lastVisibleCount;

  if (!countSource) {
    return null;
  }

  return (
    <div className="count-card">
      <div className="count-title">カウント</div>
      <CountDots balls={countSource.balls} strikes={countSource.strikes} outs={countSource.outs} />
    </div>
  );
}

function PitchInfo() {
  const { atBat, pitch, meta } = useStore((state) => ({
    atBat: selectDisplayAtBat(state),
    pitch: selectDisplayPitch(state),
    meta: state.meta,
  }));

  if (!pitch || !atBat || !meta) return null;

  return (
    <div className="pitch-card">
      <div className="pitch-type">{pitch.pitchLabel}</div>
      <div className="pitch-speed">{pitch.speedLabel}</div>
      <div className="pitch-extra">球種コード: {pitch.pitch_type}</div>
      <div className="pitch-batter">打者: {atBat.batterLabel}</div>
    </div>
  );
}

function ScoreBoard() {
  const { meta, pitch, atBat } = useStore((state) => {
    const displayPitch = selectDisplayPitch(state);
    const displayAtBat = selectDisplayAtBat(state);
    if (displayPitch && displayAtBat) {
      return { meta: state.meta, pitch: displayPitch, atBat: displayAtBat };
    }
    const currentAtBat = state.atBats[state.currentAtBatIndex];
    return {
      meta: state.meta,
      pitch: selectCurrentPitch(state),
      atBat: currentAtBat,
    };
  });

  const teams = useMemo(() => {
    if (!meta) return null;
    return {
      home: getTeamInfo(meta.homeTeam),
      away: getTeamInfo(meta.awayTeam),
    };
  }, [meta]);

  if (!meta || !pitch || !teams || !atBat || atBat.inning === undefined || !atBat.half) return null;

  // 投手名の解決優先順:
  // 1) pitch.pitcherLabel（各投球で直接持っている表示名）
  // 2) meta.pitcherNames[<id>]（CSVから構築したID→名前マップ）
  // 3) meta.pitcherName（互換用フィールド）
  // 4) フォールバック: "投手 <id>"
  const pitcherName =
    pitch.pitcherLabel ||
    (meta.pitcherNames ? meta.pitcherNames[pitch.pitcher] : undefined) ||
    meta.pitcherName ||
    `投手 ${pitch.pitcher}`;

  return (
    <div className="scoreboard" style={{ borderColor: teams.home.primary }}>
      <div className="scoreboard-header">
        <div className="team away">
          <span className="label">{teams.away.name}</span>
          <span className="score">{pitch.scoreAfter.away}</span>
        </div>
        <div className="vs">vs</div>
        <div className="team home">
          <span className="label">{teams.home.name}</span>
          <span className="score">{pitch.scoreAfter.home}</span>
        </div>
      </div>
      <div className="scoreboard-sub">
        <div className="game-info">
          <div>{meta.gameDate}</div>
          <div>{formatInning(atBat.inning, atBat.half)}</div>
        </div>
        <div className="pitcher">投手: {pitcherName}</div>
      </div>
    </div>
  );
}

function ResultBanner() {
  const pitch = useStore((state) => selectDisplayPitch(state));
  if (!pitch) return null;
  const resultText = pitch.displayResult;
  return (
    <div className={`result-banner${pitch.highlightResult ? ' highlight' : ''}`}>
      <span>結果: {resultText}</span>
      {pitch.highlightResult && pitch.events && (
        <span className="result-detail">（打席結果）</span>
      )}
    </div>
  );
}

function BasesDisplay() {
  const pitch = useStore((state) => selectDisplayPitch(state));
  if (!pitch) return null;

  const { first, second, third } = pitch.bases;
  const occupied = {
    first: Boolean(first),
    second: Boolean(second),
    third: Boolean(third),
  };
  const labels = [
    occupied.first ? '一塁' : null,
    occupied.second ? '二塁' : null,
    occupied.third ? '三塁' : null,
  ].filter(Boolean) as string[];
  const description = labels.length > 0 ? `${labels.join('・')}に走者` : '走者なし';
  const ariaLabel = labels.length > 0 ? `${labels.join('、')}に走者` : '走者なし';
  const baseFill = (isOccupied: boolean) => (isOccupied ? '#FACC15' : '#94a3b8');
  const baseStroke = (isOccupied: boolean) => (isOccupied ? '#facc15' : 'rgba(148, 163, 184, 0.65)');
  const baseOpacity = (isOccupied: boolean) => (isOccupied ? 0.95 : 0.35);

  const cx = 35;
  const cy = 35;
  const size = 30;
  const base = 6;
  const OFF = {
    first: { dx: 4, dy: 0 },
    second: { dx: 0, dy: -4 },
    third: { dx: -4, dy: 0 },
  } as const;

  const corners = {
    first: { x: cx + size, y: cy },
    second: { x: cx, y: cy - size },
    third: { x: cx - size, y: cy },
  } as const;

  return (
    <div className="bases-card">
      <div className="bases-title">走者状況</div>
      <svg className="bases-diamond" viewBox="0 0 70 70" role="img" aria-label={ariaLabel}>
        <polygon
          points={`${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`}
          fill="rgba(15,23,42,0.6)"
          stroke="rgba(148, 163, 184, 0.45)"
          strokeWidth="2"
        />
        <rect
          x={corners.first.x - base / 2 + OFF.first.dx}
          y={corners.first.y - base / 2 + OFF.first.dy}
          width={base}
          height={base}
          fill={baseFill(occupied.first)}
          stroke={baseStroke(occupied.first)}
          strokeWidth={occupied.first ? 2 : 1.5}
          opacity={baseOpacity(occupied.first)}
          rx={1}
        />
        <rect
          x={corners.second.x - base / 2 + OFF.second.dx}
          y={corners.second.y - base / 2 + OFF.second.dy}
          width={base}
          height={base}
          fill={baseFill(occupied.second)}
          stroke={baseStroke(occupied.second)}
          strokeWidth={occupied.second ? 2 : 1.5}
          opacity={baseOpacity(occupied.second)}
          rx={1}
        />
        <rect
          x={corners.third.x - base / 2 + OFF.third.dx}
          y={corners.third.y - base / 2 + OFF.third.dy}
          width={base}
          height={base}
          fill={baseFill(occupied.third)}
          stroke={baseStroke(occupied.third)}
          strokeWidth={occupied.third ? 2 : 1.5}
          opacity={baseOpacity(occupied.third)}
          rx={1}
        />
      </svg>
      <div className="bases-text">{description}</div>
    </div>
  );
}

export default function Hud() {
  return (
    <div className="hud-container">
      <ScoreBoard />
      <div className="hud-lower">
        <CountDisplay />
        <BasesDisplay />
        <PitchInfo />
      </div>
      <ResultBanner />
    </div>
  );
}

