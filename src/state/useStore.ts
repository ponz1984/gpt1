import { create } from 'zustand';
import { parseCsv } from '../engine/parseCsv';
import type { AtBat, GameMeta, ParsedGame, Pitch } from '../engine/statcast.types';

export type Phase = 'preFirst' | 'arming' | 'pitch' | 'hold' | 'between' | 'inningBreak';

type FrozenCount = { balls: number; strikes: number; outs: number };

type CameraView = 'catcher' | 'umpire' | 'center';

type StoreState = {
  atBats: AtBat[];
  pitches: Pitch[];
  meta?: GameMeta;
  currentAtBatIndex: number;
  currentPitchIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  playbackTime: number;
  cameraView: CameraView;
  error?: string;
  showTrajectory: boolean;
  showReleasePoint: boolean;
  showStrikeZone: boolean;
  isUiIdle: boolean;
  phase: Phase;
  lastVisibleCount?: FrozenCount;
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
  setUiIdle: (v: boolean) => void;
  startFirstPitch: () => void;
  setPhase: (phase: Phase) => void;
  setLastVisibleCount: (count?: FrozenCount) => void;
  setPlaybackTime: (t: number) => void;
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
  playbackTime: 0,
  cameraView: 'catcher',
  error: undefined,
  showTrajectory: true,
  showReleasePoint: true,
  showStrikeZone: true,
  isUiIdle: false,
  phase: 'preFirst',
  lastVisibleCount: undefined,
  loadFromCsv: (text: string) => {
    try {
      const parsed: ParsedGame = parseCsv(text);
      set({
        atBats: parsed.atBats,
        pitches: flattenPitches(parsed.atBats),
        meta: parsed.meta,
        currentAtBatIndex: 0,
        currentPitchIndex: 0,
        isPlaying: false,
        error: undefined,
        showTrajectory: true,
        showReleasePoint: true,
        showStrikeZone: true,
        isUiIdle: false,
        phase: 'preFirst',
        lastVisibleCount: undefined,
        playbackTime: 0,
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
        isUiIdle: false,
        phase: 'preFirst',
        lastVisibleCount: undefined,
        playbackTime: 0,
      });
    }
  },
  setError: (message) => set({ error: message }),
  play: () => {
    if (get().pitches.length === 0) return;
    const { phase, startFirstPitch } = get();
    if (phase === 'preFirst') {
      startFirstPitch();
      return;
    }
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
      set({ currentPitchIndex: currentPitchIndex + 1, playbackTime: 0 });
      return;
    }
    const nextAtBatIndex = currentAtBatIndex + 1;
    if (nextAtBatIndex < atBats.length) {
      set({ currentAtBatIndex: nextAtBatIndex, currentPitchIndex: 0, playbackTime: 0 });
    } else {
      set({ isPlaying: false });
    }
  },
  previousPitch: () => {
    const { atBats, currentAtBatIndex, currentPitchIndex } = get();
    const atBat = atBats[currentAtBatIndex];
    if (!atBat) return;
    if (currentPitchIndex > 0) {
      set({ currentPitchIndex: currentPitchIndex - 1, playbackTime: 0 });
      return;
    }
    const prevAtBatIndex = currentAtBatIndex - 1;
    if (prevAtBatIndex >= 0) {
      const prevAtBat = atBats[prevAtBatIndex];
      set({
        currentAtBatIndex: prevAtBatIndex,
        currentPitchIndex: prevAtBat.pitches.length - 1,
        playbackTime: 0,
      });
    }
  },
  jumpTo: (atBatIndex, pitchIndex) => {
    const { atBats } = get();
    const clampedAtBat = Math.max(0, Math.min(atBats.length - 1, atBatIndex));
    const atBat = atBats[clampedAtBat];
    if (!atBat) return;
    const clampedPitch = Math.max(0, Math.min(atBat.pitches.length - 1, pitchIndex));
    set({ currentAtBatIndex: clampedAtBat, currentPitchIndex: clampedPitch, playbackTime: 0 });
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
  setUiIdle: (v: boolean) => set({ isUiIdle: v }),
  startFirstPitch: () => {
    const { phase, pitches } = get();
    if (phase !== 'preFirst' || pitches.length === 0) return;
    set({ isPlaying: true, phase: 'arming' });
  },
  setPhase: (phase) => set({ phase }),
  setLastVisibleCount: (count) => set({ lastVisibleCount: count }),
  setPlaybackTime: (t) => set({ playbackTime: t }),
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
      isUiIdle: false,
      phase: 'preFirst',
      lastVisibleCount: undefined,
      playbackTime: 0,
    }),
}));

export type { CameraView };

function getAtBat(state: StoreState, atBatIndex: number): AtBat | undefined {
  if (atBatIndex < 0 || atBatIndex >= state.atBats.length) return undefined;
  return state.atBats[atBatIndex];
}

function getPitchInAtBat(state: StoreState, atBatIndex: number, pitchIndex: number): Pitch | undefined {
  const atBat = getAtBat(state, atBatIndex);
  if (!atBat) return undefined;
  if (pitchIndex < 0 || pitchIndex >= atBat.pitches.length) return undefined;
  return atBat.pitches[pitchIndex];
}

function findPreviousPitch(state: StoreState, atBatIndex: number, pitchIndex: number): Pitch | undefined {
  let a = atBatIndex;
  let p = pitchIndex - 1;
  if (p >= 0) {
    return getPitchInAtBat(state, a, p);
  }
  for (let i = a - 1; i >= 0; i -= 1) {
    const atBat = getAtBat(state, i);
    if (atBat && atBat.pitches.length > 0) {
      return atBat.pitches[atBat.pitches.length - 1];
    }
  }
  return undefined;
}

export const selectCurrentPitch = (state: StoreState): Pitch | undefined =>
  getPitchInAtBat(state, state.currentAtBatIndex, state.currentPitchIndex);

export const selectPreviousPitch = (state: StoreState): Pitch | undefined =>
  findPreviousPitch(state, state.currentAtBatIndex, state.currentPitchIndex);

export const selectDisplayPitch = (state: StoreState): Pitch | undefined => {
  if (state.phase === 'pitch' || state.phase === 'hold') {
    return selectCurrentPitch(state) ?? selectPreviousPitch(state);
  }
  return selectPreviousPitch(state) ?? selectCurrentPitch(state);
};

export const selectDisplayAtBat = (state: StoreState): AtBat | undefined => {
  const pitch = selectDisplayPitch(state);
  if (!pitch) return undefined;
  return getAtBat(state, pitch.atBatIndex);
};

