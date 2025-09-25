export type TeamInfo = {
  name: string;
  colors: string[];
  ballpark?: string;
};

const TEAM_MAP: Record<string, TeamInfo> = {
  ARI: { name: 'アリゾナ・ダイヤモンドバックス', colors: ['#a71930', '#000000'] },
  ATL: { name: 'アトランタ・ブレーブス', colors: ['#13274f', '#ce1141'] },
  BAL: { name: 'ボルチモア・オリオールズ', colors: ['#df4601', '#000000'] },
  BOS: { name: 'ボストン・レッドソックス', colors: ['#bd3039', '#0c2340'] },
  CHC: { name: 'シカゴ・カブス', colors: ['#cc3433', '#0e3386'] },
  CWS: { name: 'シカゴ・ホワイトソックス', colors: ['#27251f', '#c4ced4'] },
  CIN: { name: 'シンシナティ・レッズ', colors: ['#c6011f', '#000000'] },
  CLE: { name: 'クリーブランド・ガーディアンズ', colors: ['#00385d', '#e50022'] },
  COL: { name: 'コロラド・ロッキーズ', colors: ['#33006f', '#c4ced4'] },
  DET: { name: 'デトロイト・タイガース', colors: ['#0c2340', '#fa4616'] },
  HOU: { name: 'ヒューストン・アストロズ', colors: ['#002d62', '#eb6e1f'] },
  KC: { name: 'カンザスシティ・ロイヤルズ', colors: ['#004687', '#c09a5b'] },
  LAA: { name: 'ロサンゼルス・エンゼルス', colors: ['#ba0021', '#003263'] },
  LAD: { name: 'ロサンゼルス・ドジャース', colors: ['#005a9c', '#ef3e42'] },
  MIA: { name: 'マイアミ・マーリンズ', colors: ['#00a3e0', '#ef3340'] },
  MIL: { name: 'ミルウォーキー・ブルワーズ', colors: ['#0a2351', '#b6922e'] },
  MIN: { name: 'ミネソタ・ツインズ', colors: ['#002b5c', '#d31145'] },
  NYM: { name: 'ニューヨーク・メッツ', colors: ['#002d72', '#ff5910'] },
  NYY: { name: 'ニューヨーク・ヤンキース', colors: ['#003087', '#e4002b'] },
  OAK: { name: 'オークランド・アスレチックス', colors: ['#003831', '#efb21e'] },
  PHI: { name: 'フィラデルフィア・フィリーズ', colors: ['#e81828', '#002d72'] },
  PIT: { name: 'ピッツバーグ・パイレーツ', colors: ['#000000', '#fdb827'] },
  SD: { name: 'サンディエゴ・パドレス', colors: ['#2f241d', '#ffc425'] },
  SEA: { name: 'シアトル・マリナーズ', colors: ['#005c5c', '#0c2c56'] },
  SF: { name: 'サンフランシスコ・ジャイアンツ', colors: ['#fd5a1e', '#000000'] },
  STL: { name: 'セントルイス・カージナルス', colors: ['#c41e3a', '#0b4a99'] },
  TB: { name: 'タンパベイ・レイズ', colors: ['#092c5c', '#8fbce6'] },
  TEX: { name: 'テキサス・レンジャーズ', colors: ['#003278', '#c0111f'] },
  TOR: { name: 'トロント・ブルージェイズ', colors: ['#134a8e', '#1d2d5c'] },
  WSH: { name: 'ワシントン・ナショナルズ', colors: ['#ab0003', '#11225b'] },
};

export function getTeamInfo(code: string): TeamInfo | undefined {
  return TEAM_MAP[code];
}

export function getTeamDisplayName(code: string): string {
  return TEAM_MAP[code]?.name ?? code;
}
