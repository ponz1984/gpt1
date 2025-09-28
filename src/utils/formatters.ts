import type { CountState } from '../engine/statcast.types';

const EVENT_TRANSLATIONS: Record<string, string> = {
  strikeout: '三振',
  strikeout_double_play: '三振併殺',
  single: 'シングルヒット',
  double: 'ツーベースヒット',
  triple: 'スリーベースヒット',
  home_run: 'ホームラン',
  walk: 'フォアボール',
  intent_walk: '敬遠',
  hit_by_pitch: '死球',
  field_out: '野手正面',
  groundout: 'ゴロアウト',
  flyout: 'フライアウト',
  pop_out: 'ポップアウト',
  sac_fly: '犠牲フライ',
  sac_bunt: '犠牲バント',
  force_out: 'フォースアウト',
  grounded_into_double_play: 'ダブルプレー',
  double_play: 'ダブルプレー',
  triple_play: 'トリプルプレー',
};

export function formatEvents(events?: string, description?: string): string {
  if (events && events.trim() !== '') {
    const lower = events.toLowerCase();
    if (lower.includes('strikeout')) return '三振';
    const translated = EVENT_TRANSLATIONS[lower];
    if (translated) return translated;
    return events;
  }
  if (description && description.trim() !== '') {
    const lower = description.toLowerCase();
    if (lower.includes('strikeout')) return '三振';
    if (lower.includes('called_strike')) return '見逃しストライク';
    if (lower.includes('swinging_strike')) return '空振りストライク';
    if (lower.includes('foul')) return 'ファウル';
    if (lower.includes('ball')) return 'ボール';
    return description;
  }
  return '結果不明';
}

export function formatCount(count: CountState): string {
  return `B${count.balls} / S${count.strikes}`;
}

export function formatInning(inning: number, half: 'Top' | 'Bot'): string {
  const halfLabel = half === 'Top' ? '表' : '裏';
  return `${inning}回${halfLabel}`;
}

export function formatScore(home: number, away: number, homeTeam: string, awayTeam: string): string {
  return `${awayTeam} ${away} - ${home} ${homeTeam}`;
}

export function toFixed(value: number, digits: number = 1): string {
  if (!Number.isFinite(value)) return '-';
  const d = Math.max(0, Math.floor(digits));
  return value.toFixed(d);
}

