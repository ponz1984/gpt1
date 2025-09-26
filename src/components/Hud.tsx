import { useMemo } from 'react';
import { useStore } from '../state/useStore';
import { formatCount, formatInning } from '../utils/formatters';
import { getTeamInfo } from '../utils/teamMaps';

function CountDisplay() {
  const pitch = useStore(
    (state) => state.atBats[state.currentAtBatIndex]?.pitches[state.currentPitchIndex]
  );
  if (!pitch) return null;
  return (
    <div className="count-card">
      <div className="count-title">カウント</div>
      <div className="count-value">{formatCount(pitch.postCount)}</div>
      <div className="count-outs">アウト {pitch.outsAfter}</div>
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

  // 投手名の解決優先順
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

export default function Hud() {
  return (
    <div className="hud-container">
      <ScoreBoard />
      <div className="hud-lower">
        <CountDisplay />
        <PitchInfo />
      </div>
      <ResultBanner />
    </div>
  );
}

