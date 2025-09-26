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

const SINGLE_OUT_RESULTS = [
  'strikeout',
  'strikeout_double_play',
  'strikeout_other',
  'groundout',
  'grounded_out',
  'ground_ball_out',
  'force_out',
  'fielders_choice_out',
  'field_out',
  'flyout',
  'fly_out',
  'lineout',
  'pop_out',
  'popout',
  'sac_fly',
  'sacrifice_fly',
  'sac_bunt',
  'sacrifice_bunt',
];

function clampOuts(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(3, Math.max(0, value));
}

function outsIncrementFromResult(events?: string, description?: string): number {
  const source = `${events ?? ''} ${description ?? ''}`.toLowerCase();
  if (!source.trim()) {
    return 0;
  }
  if (source.includes('triple_play')) {
    return 3;
  }
  if (source.includes('grounded_into_double_play') || source.includes('double_play')) {
    return 2;
  }
  if (SINGLE_OUT_RESULTS.some((keyword) => source.includes(keyword))) {
    return 1;
  }
  return 0;
}

type OutsOptions = {
  isLastPitchOfAtBat: boolean;
  nextAtBatFirst?: PitchRow;
};

export function deriveOutsAfter(row: PitchRow, outsBefore: number, options: OutsOptions): number {
  const { isLastPitchOfAtBat, nextAtBatFirst } = options;
  if (!isLastPitchOfAtBat) {
    return clampOuts(outsBefore);
  }

  const increment = outsIncrementFromResult(row.events, row.description);
  let computed = clampOuts(outsBefore + increment);

  if (nextAtBatFirst) {
    computed = clampOuts(nextAtBatFirst.outs_when_up);
  }

  return computed;
}

export { clampOuts };
