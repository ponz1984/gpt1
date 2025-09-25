import { CountState, PitchRow } from './statcast.types';

const BALL_KEYWORDS = ['ball', 'intent_ball', 'pitchout', 'blocked_ball'];
const STRIKE_KEYWORDS = [
  'called_strike',
  'swinging_strike',
  'swinging_strike_blocked',
  'foul_tip',
  'foul_tip_strike',
  'missed_bunt',
  'bunt_foul_tip'
];
const FOUL_KEYWORDS = ['foul', 'foul_bunt', 'foul_pitchout'];

export type CountComputation = {
  count: CountState;
  isAtBatEnd: boolean;
};

export function computePostCount(row: PitchRow): CountComputation {
  let balls = row.balls;
  let strikes = row.strikes;
  let isAtBatEnd = false;
  const description = row.description.toLowerCase();

  if (description.includes('hit_by_pitch')) {
    balls = 4;
    isAtBatEnd = true;
  } else if (description.includes('intent_walk') || description === 'walk') {
    balls = 4;
    isAtBatEnd = true;
  } else if (row.type === 'B') {
    if (BALL_KEYWORDS.some((key) => description.includes(key))) {
      balls = Math.min(4, balls + 1);
      if (balls === 4) {
        isAtBatEnd = true;
      }
    }
  } else if (row.type === 'S') {
    if (STRIKE_KEYWORDS.some((key) => description.includes(key))) {
      strikes = Math.min(3, strikes + 1);
      if (strikes === 3) {
        isAtBatEnd = true;
      }
    } else if (FOUL_KEYWORDS.some((key) => description.includes(key))) {
      if (strikes < 2) {
        strikes += 1;
      }
    }
  } else if (row.type === 'X') {
    isAtBatEnd = true;
  }

  if (description.includes('strikeout')) {
    strikes = 3;
    isAtBatEnd = true;
  }

  if (description.includes('hit_into_play')) {
    isAtBatEnd = true;
  }

  return { count: { balls, strikes }, isAtBatEnd };
}

export function estimateOutsAdded(eventText?: string): number {
  if (!eventText) return 0;
  const text = eventText.toLowerCase();
  if (text.includes('triple_play')) return 3;
  if (text.includes('double_play')) {
    if (text.includes('strikeout')) {
      return 2;
    }
    return 2;
  }
  if (text.includes('strikeout')) return 1;
  if (text.includes('groundout')) return 1;
  if (text.includes('flyout')) return 1;
  if (text.includes('lineout')) return 1;
  if (text.includes('pop_out')) return 1;
  if (text.includes('force_out')) return 1;
  if (text.includes('fielders_choice_out')) return 1;
  if (text.includes('sac_fly')) return 1;
  if (text.includes('sac_bunt')) return 1;
  return 0;
}
