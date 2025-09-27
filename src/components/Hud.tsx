import { useMemo } from 'react';
import { useStore } from '../state/useStore';
import CountDots from './CountDots';
import { formatInning } from '../utils/formatters';
import { getTeamInfo } from '../utils/teamMaps';

function CountDisplay() {
  const pitch = useStore(
    (state) => state.atBats[state.currentAtBatIndex]?.pitches[state.currentPitchIndex]
  );
  if (!pitch) return null;
  return (
    <div className="count-card">
      <div className="count-title">カウント</div>
      <CountDots
        balls={pitch.postCount.balls}
        strikes={pitch.postCount.strikes}
        outs={pitch.outsAfter}
      />
    </div>
  );
}

function PitchInfo() {
  const { atBat, pitch, meta } = useStore((state) => {
    const atBat = state.atBats[state.currentAtBatIndex];
    const pitch = atBat?.pitches[state.currentPitchIndex];
    return { atBat, pitch, meta: state.meta };
  });

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
  const meta = useStore((state) => state.meta);
  const pitch = useStore(
    (state) => state.atBats[state.currentAtBatIndex]?.pitches[state.currentPitchIndex]
  );
  const inning = useStore((state) => state.atBats[state.currentAtBatIndex]?.inning);
  const half = useStore((state) => state.atBats[state.currentAtBatIndex]?.half);

  const teams = useMemo(() => {
    if (!meta) return null;
    return {
      home: getTeamInfo(meta.homeTeam),
      away: getTeamInfo(meta.awayTeam),
    };
  }, [meta]);

  if (!meta || !pitch || !teams || inning === undefined || !half) return null;

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
          <div>{formatInning(inning, half)}</div>
        </div>
        <div className="pitcher">投手: {pitcherName}</div>
      </div>
    </div>
  );
}

function ResultBanner() {
  const pitch = useStore(
    (state) => state.atBats[state.currentAtBatIndex]?.pitches[state.currentPitchIndex]
  );
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
  const pitch = useStore(
    (state) => state.atBats[state.currentAtBatIndex]?.pitches[state.currentPitchIndex]
  );
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
  const baseFill = (isOccupied: boolean) => (isOccupied ? '#fde68a' : 'rgba(148, 163, 184, 0.15)');
  const baseStroke = (isOccupied: boolean) => (isOccupied ? '#facc15' : 'rgba(226, 232, 240, 0.35)');

  return (
    <div className="bases-card">
      <div className="bases-title">走者状況</div>
      <svg className="bases-diamond" viewBox="0 0 70 70" role="img" aria-label={ariaLabel}>
        <polygon
          points="35,5 65,35 35,65 5,35"
          fill="rgba(15,23,42,0.6)"
          stroke="rgba(148, 163, 184, 0.45)"
          strokeWidth="2"
        />
        <rect
          x={42}
          y={42}
          width={12}
          height={12}
          transform="rotate(45 48 48)"
          fill={baseFill(occupied.first)}
          stroke={baseStroke(occupied.first)}
          strokeWidth={occupied.first ? 2 : 1.5}
          opacity={occupied.first ? 0.95 : 0.5}
          rx={1}
        />
        <rect
          x={29}
          y={16}
          width={12}
          height={12}
          transform="rotate(45 35 22)"
          fill={baseFill(occupied.second)}
          stroke={baseStroke(occupied.second)}
          strokeWidth={occupied.second ? 2 : 1.5}
          opacity={occupied.second ? 0.95 : 0.5}
          rx={1}
        />
        <rect
          x={16}
          y={42}
          width={12}
          height={12}
          transform="rotate(45 22 48)"
          fill={baseFill(occupied.third)}
          stroke={baseStroke(occupied.third)}
          strokeWidth={occupied.third ? 2 : 1.5}
          opacity={occupied.third ? 0.95 : 0.5}
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


