import { create } from 'zustand';
import { parseCsv } from '../engine/parseCsv';
import type { AtBat, GameMeta, ParsedGame, Pitch } from '../engine/statcast.types';

type CameraView = 'catcher' | 'umpire' | 'center';

type StoreState = {
  atBats: AtBat[];
  pitches: Pitch[];
  meta?: GameMeta;
  currentAtBatIndex: number;
  currentPitchIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  cameraView: CameraView;
  error?: string;
  showTrajectory: boolean;
  showReleasePoint: boolean;
  showStrikeZone: boolean;
  loadFromCsv: (text: string) => void;
  setError: (message?: string) => void;
  play: () => void;
  pause: () => void;
  nextPitch: () => void;
  previousPitch: () => void;
  jumpTo: (atBatIndex: number, pitchIndex: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setCameraView: (view: CameraView) => void;
  toggleOverlay: (overlay: 'trajectory' | 'release' | 'zone') => void;
  reset: () => void;
};

function flattenPitches(atBats: AtBat[]): Pitch[] {
  return atBats.flatMap((atBat) => atBat.pitches);
}

export const useStore = create<StoreState>((set, get) => ({
  atBats: [],
  pitches: [],
  meta: undefined,
  currentAtBatIndex: 0,
  currentPitchIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  cameraView: 'catcher',
  error: undefined,
  showTrajectory: true,
  showReleasePoint: true,
  showStrikeZone: true,
  loadFromCsv: (text: string) => {
    try {
      const parsed: ParsedGame = parseCsv(text);
      set({
        atBats: parsed.atBats,
        pitches: flattenPitches(parsed.atBats),
        meta: parsed.meta,
        currentAtBatIndex: 0,
        currentPitchIndex: 0,
        isPlaying: true,
        error: undefined,
        showTrajectory: true,
        showReleasePoint: true,
        showStrikeZone: true,
      });
    } catch (err) {
      set({
        atBats: [],
        pitches: [],
        meta: undefined,
        currentAtBatIndex: 0,
        currentPitchIndex: 0,
        isPlaying: false,
        error: err instanceof Error ? err.message : 'CSVの解析に失敗しました。',
        showTrajectory: true,
        showReleasePoint: true,
        showStrikeZone: true,
      });
    }
  },
  setError: (message) => set({ error: message }),
  play: () => {
    if (get().pitches.length === 0) return;
    set({ isPlaying: true });
  },
  pause: () => set({ isPlaying: false }),
  nextPitch: () => {
    const { atBats, currentAtBatIndex, currentPitchIndex } = get();
    const atBat = atBats[currentAtBatIndex];
    if (!atBat) {
      set({ isPlaying: false });
      return;
    }
    if (currentPitchIndex + 1 < atBat.pitches.length) {
      set({ currentPitchIndex: currentPitchIndex + 1 });
      return;
    }
    const nextAtBatIndex = currentAtBatIndex + 1;
    if (nextAtBatIndex < atBats.length) {
      set({ currentAtBatIndex: nextAtBatIndex, currentPitchIndex: 0 });
    } else {
      set({ isPlaying: false });
    }
  },
  previousPitch: () => {
    const { atBats, currentAtBatIndex, currentPitchIndex } = get();
    const atBat = atBats[currentAtBatIndex];
    if (!atBat) return;
    if (currentPitchIndex > 0) {
      set({ currentPitchIndex: currentPitchIndex - 1 });
      return;
    }
    const prevAtBatIndex = currentAtBatIndex - 1;
    if (prevAtBatIndex >= 0) {
      const prevAtBat = atBats[prevAtBatIndex];
      set({ currentAtBatIndex: prevAtBatIndex, currentPitchIndex: prevAtBat.pitches.length - 1 });
    }
  },
  jumpTo: (atBatIndex, pitchIndex) => {
    const { atBats } = get();
    const clampedAtBat = Math.max(0, Math.min(atBats.length - 1, atBatIndex));
    const atBat = atBats[clampedAtBat];
    if (!atBat) return;
    const clampedPitch = Math.max(0, Math.min(atBat.pitches.length - 1, pitchIndex));
    set({ currentAtBatIndex: clampedAtBat, currentPitchIndex: clampedPitch });
  },
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setCameraView: (view) => set({ cameraView: view }),
  toggleOverlay: (overlay) =>
    set((state) => {
      if (overlay === 'trajectory') {
        return { showTrajectory: !state.showTrajectory };
      }
      if (overlay === 'release') {
        return { showReleasePoint: !state.showReleasePoint };
      }
      return { showStrikeZone: !state.showStrikeZone };
    }),
  reset: () =>
    set({
      atBats: [],
      pitches: [],
      meta: undefined,
      currentAtBatIndex: 0,
      currentPitchIndex: 0,
      isPlaying: false,
      error: undefined,
      showTrajectory: true,
      showReleasePoint: true,
      showStrikeZone: true,
    }),
}));

export type { CameraView };
