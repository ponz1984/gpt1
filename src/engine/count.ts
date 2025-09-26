import type { PitchRow } from './statcast.types';

type CountResult = {
  balls: number;
  strikes: number;
  isAtBatEnd: boolean;
};

const FOUL_KEYWORDS = ['foul', 'foul_bunt'];
const BALL_KEYWORDS = ['ball', 'intent_ball', 'pitchout', 'blocked_ball', 'automatic_ball'];
const STRIKE_KEYWORDS = [
  'called_strike',
  'swinging_strike',
  'swinging_strike_blocked',
  'swinging_pitchout',
  'missed_bunt',
  'foul_tip',
  'foul_tip_strike',
  'bunt_foul_tip',
];

function includesKeyword(value: string | undefined, keywords: string[]): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function computeFromRule(row: PitchRow): CountResult {
  const prevBalls = row.balls;
  const prevStrikes = row.strikes;
  const description = row.description?.toLowerCase() ?? '';
  let balls = prevBalls;
  let strikes = prevStrikes;
  let isAtBatEnd = false;

  if (row.type === 'B' || includesKeyword(description, BALL_KEYWORDS)) {
    if (description.includes('hit_by_pitch')) {
      balls = 4;
      isAtBatEnd = true;
    } else if (description.includes('intent_walk') || description.includes('walk')) {
      balls = 4;
      isAtBatEnd = true;
    } else {
      balls = Math.min(4, prevBalls + 1);
      if (balls === 4) {
        isAtBatEnd = true;
      }
    }
  } else if (row.type === 'S') {
    if (includesKeyword(description, FOUL_KEYWORDS)) {
      if (prevStrikes < 2) {
        strikes = prevStrikes + 1;
      }
    } else if (includesKeyword(description, STRIKE_KEYWORDS) || row.description === '') {
      strikes = Math.min(3, prevStrikes + 1);
      if (strikes === 3) {
        isAtBatEnd = true;
      }
    }
    if (description.includes('strikeout')) {
      strikes = 3;
      isAtBatEnd = true;
    }
  } else if (row.type === 'X') {
    isAtBatEnd = true;
  }

  if (row.events) {
    const evLower = row.events.toLowerCase();
    if (evLower.includes('walk')) {
      balls = 4;
      isAtBatEnd = true;
    }
    if (evLower.includes('strikeout')) {
      strikes = 3;
      isAtBatEnd = true;
    }
  }

  return { balls, strikes, isAtBatEnd };
}

export function derivePostCount(row: PitchRow, nextRow?: PitchRow): CountResult {
  if (nextRow && nextRow.at_bat_number === row.at_bat_number) {
    return {
      balls: nextRow.balls,
      strikes: nextRow.strikes,
      isAtBatEnd: false,
    };
  }

  return computeFromRule(row);
}

export function outsDeltaFromEvents(events?: string, description?: string): number {
  if (!events && !description) return 0;
  const combined = `${events ?? ''} ${description ?? ''}`.toLowerCase();
  if (combined.includes('triple_play')) return 3;
  if (combined.includes('double_play')) return 2;
  if (combined.includes('strikeout')) return 1;
  const singleOutKeywords = [
    'groundout',
    'grounded_out',
    'flyout',
    'fly_out',
    'lineout',
    'pop out',
    'popup',
    'field_out',
    'forceout',
    'force_out',
    'sacrifice fly',
    'sac fly',
    'caught stealing',
  ];
  if (singleOutKeywords.some((k) => combined.includes(k))) {
    return 1;
  }
  return 0;
}
