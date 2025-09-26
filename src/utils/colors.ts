const PITCH_COLORS: Record<string, string> = {
  FF: '#f87171',
  FT: '#fb7185',
  SI: '#f97316',
  SL: '#60a5fa',
  CU: '#c084fc',
  KC: '#a855f7',
  CH: '#34d399',
  CS: '#2dd4bf',
  SC: '#22d3ee',
  ST: '#facc15',
  SV: '#f59e0b',
  KN: '#f472b6',
  EP: '#f9a8d4',
  FO: '#93c5fd',
};

export function getPitchColor(code: string | undefined): string {
  if (!code) return '#fbbf24';
  return PITCH_COLORS[code as keyof typeof PITCH_COLORS] ?? '#fbbf24';
}
