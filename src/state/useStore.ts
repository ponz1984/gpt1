import { create } from 'zustand';
import { preparePitches } from '../engine/playback';
import { PitchRow, PitchWithDerived } from '../engine/statcast.types';

export type ViewMode = 'catcher' | 'umpire' | 'center';

export type OverlayState = {
  showTrajectory: boolean;
  showRelease: boolean;
  showZone: boolean;
};

type StoreState = {
  pitches: PitchWithDerived[];
  currentPitchIndex: number;
  pitchTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  view: ViewMode;
  overlays: OverlayState;
  error?: string;
  loadFromRows: (rows: PitchRow[]) => void;
  setError: (message?: string) => void;
  setCurrentPitch: (index: number) => void;
  setIsPlaying: (value: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPitchTime: (time: number) => void;
  nextPitch: () => void;
  prevPitch: () => void;
  setView: (view: ViewMode) => void;
  toggleOverlay: (key: keyof OverlayState) => void;
};

export const useStore = create<StoreState>((set, get) => ({
  pitches: [],
  currentPitchIndex: 0,
  pitchTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  view: 'catcher',
  overlays: {
    showTrajectory: true,
    showRelease: true,
    showZone: true
  },
  error: undefined,
  loadFromRows(rows) {
    try {
      const prepared = preparePitches(rows);
      set({
        pitches: prepared,
        currentPitchIndex: 0,
        pitchTime: 0,
        isPlaying: prepared.length > 0,
        error: undefined
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '解析中にエラーが発生しました。' });
    }
  },
  setError(message) {
    set({ error: message });
  },
  setCurrentPitch(index) {
    const { pitches } = get();
    const clamped = Math.max(0, Math.min(index, pitches.length - 1));
    set({ currentPitchIndex: clamped, pitchTime: 0 });
  },
  setIsPlaying(value) {
    set({ isPlaying: value });
  },
  setPlaybackSpeed(speed) {
    set({ playbackSpeed: speed });
  },
  setPitchTime(time) {
    set({ pitchTime: time });
  },
  nextPitch() {
    const { currentPitchIndex, pitches } = get();
    if (currentPitchIndex < pitches.length - 1) {
      set({ currentPitchIndex: currentPitchIndex + 1, pitchTime: 0 });
    } else {
      set({ isPlaying: false, pitchTime: 0 });
    }
  },
  prevPitch() {
    const { currentPitchIndex } = get();
    const nextIndex = Math.max(0, currentPitchIndex - 1);
    set({ currentPitchIndex: nextIndex, pitchTime: 0 });
  },
  setView(view) {
    set({ view });
  },
  toggleOverlay(key) {
    const { overlays } = get();
    set({ overlays: { ...overlays, [key]: !overlays[key] } });
  }
}));
