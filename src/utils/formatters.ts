import type { PitchWithDerived } from '../engine/statcast.types';
import { getTeamDisplayName } from './teamMaps';

export function formatSpeed(mph: number): string {
  return `${mph.toFixed(1)} mph`;
}

export function formatPitchLabel(pitch: PitchWithDerived): string {
  if (pitch.pitch_name) {
    return pitch.pitch_name;
  }
  return pitch.pitch_type;
}

export function formatCount(balls: number, strikes: number): string {
  return `${balls}-${strikes}`;
}

export function formatInning(inning: number, half: 'Top' | 'Bot'): string {
  const halfLabel = half === 'Top' ? '表' : '裏';
  return `${inning}回${halfLabel}`;
}

export function formatScore(home: number, away: number): string {
  return `${away} - ${home}`;
}

export function formatMatchup(home: string, away: string): string {
  return `${getTeamDisplayName(away)} @ ${getTeamDisplayName(home)}`;
}

export function formatEvent(pitch: PitchWithDerived): string {
  if (pitch.events) {
    return pitch.events;
  }
  return pitch.description;
}
