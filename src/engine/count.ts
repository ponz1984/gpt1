import type { PitchRow } from './statcast.types';

export type CountResult = {
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

/**
 * 単票（row）からピッチ後カウントを規則で算出
 * - row.balls/row.strikes は「ピッチ前」を前提
 */
function computeFromRule(row: PitchRow): CountResult {
  const prevBalls = row.balls;
  const prevStrikes = row.strikes;
  const description = row.description?.toLowerCase() ?? '';
  let balls = prevBalls;
  let strikes = prevStrikes;
  let isAtBatEnd = false;

  if (row.type === 'B' || includesKeyword(description, BALL_KEYWORDS)) {
    // 歩か死球の明確ケース
    if (description.includes('hit_by_pitch')) {
      balls = 4;
      isAtBatEnd = true;
    } else if (description.includes('intent_walk') || description.includes('walk')) {
      balls = 4;
      isAtBatEnd = true;
    } else {
      balls = Math.min(4, prevBalls + 1);
      if (balls === 4) isAtBatEnd = true;
    }
  } else if (row.type === 'S') {
    if (includesKeyword(description, FOUL_KEYWORDS)) {
      // ファウルは2ストライク以降は据え置き
      if (prevStrikes < 2) strikes = prevStrikes + 1;
    } else if (includesKeyword(description, STRIKE_KEYWORDS) || row.description === '') {
      strikes = Math.min(3, prevStrikes + 1);
      if (strikes === 3) isAtBatEnd = true;
    }
    if (description.includes('strikeout')) {
      strikes = 3;
      isAtBatEnd = true;
    }
  } else if (row.type === 'X') {
    // インプレーは打席終了
    isAtBatEnd = true;
  }

  // events が付いてくる場合は最終確定を優先
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

/**
 * 次行(nextRow)が同一打席ならそれを「正」として表示。
 * それ以外は規則で推定。
 */
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

/* ---------- Outs（アウト数）ロジック ---------- */

const SINGLE_OUT_RESULTS = [
  // 三振系
  'strikeout',
  'strikeout_double_play',
  'strikeout_other',
  // ゴロ/併殺系
  'groundout',
  'grounded_out',
  'ground_ball_out',
  'force_out',
  'fielders_choice_out',
  'field_out',
  // フライ/ライナー/ポップ
  'flyout',
  'fly_out',
  'lineout',
  'pop_out',
  'popout',
  // 犠牲系
  'sac_fly',
  'sacrifice_fly',
  'sac_bunt',
  'sacrifice_bunt',
  // ランナーアウト（打者アウトに直結しないこともあるが保守的に+1扱いは避ける）
];

function clampOuts(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(3, Math.max(0, value));
}

/**
 * events/description からアウト増分を推定
 * - triple_play → +3
 * - double_play / grounded_into_double_play → +2
 * - SINGLE_OUT_RESULTS / strikeout → +1
 * - それ以外 → +0
 */
export function outsIncrementFromResult(events?: string, description?: string): number {
  const source = `${events ?? ''} ${description ?? ''}`.toLowerCase();
  if (!source.trim()) return 0;

  if (source.includes('triple_play')) return 3;

  if (source.includes('grounded_into_double_play') || source.includes('double_play')) return 2;

  if (source.includes('strikeout')) return 1;

  if (SINGLE_OUT_RESULTS.some((keyword) => source.includes(keyword))) return 1;

  return 0;
}

/** 後方互換：旧関数名をエイリアスとして残す */
export const outsDeltaFromEvents = outsIncrementFromResult;

export type OutsOptions = {
  /** この行が打席のラストピッチか（type==='X' など） */
  isLastPitchOfAtBat: boolean;
  /** 次打席の最初の行（outs_when_up による整合補正に使用） */
  nextAtBatFirst?: PitchRow;
};

/**
 * ピッチ後のアウト数を算出
 * - 基本は outsBefore + イベント増分（打席終了時のみ加算）
 * - 次打席が存在し、その outs_when_up が取得できる場合は「次打席の値を優先」（整合補正）
 */
export function deriveOutsAfter(
  row: PitchRow,
  outsBefore: number,
  options: OutsOptions
): number {
  const { isLastPitchOfAtBat, nextAtBatFirst } = options;

  if (!isLastPitchOfAtBat) {
    return clampOuts(outsBefore);
  }

  const increment = outsIncrementFromResult(row.events, row.description);
  let computed = clampOuts(outsBefore + increment);

  // 次打席のアウトが明示されている場合はそれを優先（公式スコアに合わせる）
  if (nextAtBatFirst && Number.isFinite(nextAtBatFirst.outs_when_up)) {
    computed = clampOuts(nextAtBatFirst.outs_when_up);
  }

  return computed;
}

export { clampOuts };

