export const TEAM_COLOR_MAP: Record<string, string> = {
  NYY: '#132448',
  NYM: '#002d72',
  BOS: '#bd3039',
  LAD: '#005a9c',
  LAA: '#ba0021',
  ATL: '#13274f',
  CHC: '#0e3386',
  SF: '#fd5a1e',
  SEA: '#005c5c',
  TEX: '#003278'
};

export function getTeamColor(code: string): string {
  return TEAM_COLOR_MAP[code] ?? '#1b263b';
}

export function getTeamLabel(home: string, away: string): string {
  return `${away} @ ${home}`;
}
