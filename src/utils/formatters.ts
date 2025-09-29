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
  const rawEvents = events ?? '';
  const rawDescription = description ?? '';
  const ev = rawEvents.trim();
  const desc = rawDescription.trim();
  const evLower = ev.toLowerCase();
  const descLower = desc.toLowerCase();

  const resolveStrikeout = (): string => {
    if (descLower.includes('called_strike') || descLower.includes('looking')) return '見逃し三振';
    if (descLower.includes('swinging_strike') || descLower.includes('swinging')) return '空振り三振';
    return '三振';
  };

  if (ev) {
    if (evLower.includes('strikeout')) {
      const translated = EVENT_TRANSLATIONS[evLower];
      if (translated && evLower !== 'strikeout') return translated;
      return resolveStrikeout();
    }
    const translated = EVENT_TRANSLATIONS[evLower];
    if (translated) return translated;
    return rawEvents;
  }

  if (desc) {
    if (descLower.includes('strikeout')) {
      return resolveStrikeout();
    }
    if (descLower.includes('called_strike')) return '見逃しストライク';
    if (descLower.includes('swinging_strike')) return '空振りストライク';
    if (descLower.includes('foul')) return 'ファウル';
    if (descLower.includes('ball')) return 'ボール';
    return rawDescription;
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

export function toFixed(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '--';
}
