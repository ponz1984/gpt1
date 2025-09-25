import { CountState, PitchWithDerived } from '../engine/statcast.types';

const DESCRIPTION_MAP: Record<string, string> = {
  called_strike: '見逃しストライク',
  swinging_strike: '空振りストライク',
  swinging_strike_blocked: '空振り（三振振り逃げ）',
  foul: 'ファウル',
  foul_tip: 'ファウルチップ',
  foul_bunt: 'バントファウル',
  hit_into_play: 'インプレー',
  ball: 'ボール',
  intent_ball: '敬遠気味のボール',
  blocked_ball: '暴投/捕逸',
  hit_by_pitch: '死球',
  pickoff: '牽制'
};

const EVENT_MAP: Record<string, string> = {
  strikeout: '三振',
  strikeout_double_play: '三振併殺',
  single: 'シングルヒット',
  double: '二塁打',
  triple: '三塁打',
  home_run: '本塁打',
  walk: '四球',
  intent_walk: '敬遠四球',
  hit_by_pitch: '死球',
  groundout: 'ゴロアウト',
  flyout: 'フライアウト',
  lineout: 'ライナーアウト',
  pop_out: 'ポップアウト',
  sac_fly: '犠牲フライ',
  sac_bunt: '犠牲バント',
  double_play: '併殺打',
  grounded_into_double_play: '併殺打',
  triple_play: 'トリプルプレー',
  fielders_choice_out: '野選アウト',
  field_error: '失策'
};

export function formatCount({ balls, strikes }: CountState): string {
  return `${balls} - ${strikes}`;
}

export function formatInning(inning: number, topbot: PitchWithDerived['inning_topbot']): string {
  return `${inning}回${topbot === 'Top' ? '表' : '裏'}`;
}

export function translateDescription(description: string): string {
  const normalized = description.toLowerCase();
  if (DESCRIPTION_MAP[normalized]) {
    return DESCRIPTION_MAP[normalized];
  }
  return description;
}

export function translateEvent(event?: string): string {
  if (!event) return '';
  const normalized = event.toLowerCase();
  return EVENT_MAP[normalized] ?? event;
}

export function buildResultLabel(pitch: PitchWithDerived): string {
  if (pitch.isAtBatEnd && pitch.events) {
    return translateEvent(pitch.events);
  }
  return translateDescription(pitch.description);
}

export function formatSpeed(mph: number): string {
  return `${mph.toFixed(1)} mph`;
}
