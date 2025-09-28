import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, PerspectiveCamera } from '@react-three/drei';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import * as THREE from 'three';
import { getPositionAtTime } from '../engine/physics';
import type { AtBat, Pitch } from '../engine/statcast.types';
import { useStore } from '../state/useStore';
import type { Phase } from '../state/useStore';
import { getPitchColor } from '../utils/colors';

const PARK = {
  dirt: '#D9C3A7',
  grass: '#A9D7B0',
  deep: '#5CA08B',
  line: '#FFFFFF',
  box: '#FFFFFF',
} as const;

const CAMERA_PRESETS = {
  catcher: {
    position: new THREE.Vector3(0, 6.5, 12),
    target: new THREE.Vector3(0, 3, -20),
  },
  umpire: {
    position: new THREE.Vector3(0, 6, 7.5),
    target: new THREE.Vector3(0, 3, -20),
  },
  center: {
    position: new THREE.Vector3(0, 28, -160),
    target: new THREE.Vector3(0, 4, 0),
  },
} satisfies Record<string, { position: THREE.Vector3; target: THREE.Vector3 }>;

const BASE_DISTANCE = 18;
const BASE_SIZE = 2.6;

const FIRST_PITCH_DELAY_SEC = 2.0;
const BETWEEN_PITCH_BLANK_SEC = Math.max(0.5, 5.0 - 1.5 - 1.0);
const INNING_CHANGE_BLANK_SEC = 8.0;
const AFTER_PITCH_HOLD_SEC = 0.7 + 1.5;
const TRAJECTORY_LEAD_SEC = 0.05;
const TRAIL_DELAY_S = 0.12;

function worldFromSample(sample: { x: number; y: number; z: number }): THREE.Vector3 {
  // Statcast: x(左右), y(捕手方向への距離), z(高さ)
  // World   : x(左右), y(高さ), z(奥行き) ・・・ y と z を入れ替え、z は符号反転
  return new THREE.Vector3(sample.x, sample.z, -sample.y);
}

function resolvePitchColor(pitch: Pitch | undefined): string {
  if (!pitch) return '#f8fafc';
  return getPitchColor(pitch.pitch_type);
}

function BatterBox({ x }: { x: number }) {
  const edges = useMemo(() => {
    const width = 4;
    const depth = 6;
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -depth / 2);
    shape.lineTo(width / 2, -depth / 2);
    shape.lineTo(width / 2, depth / 2);
    shape.lineTo(-width / 2, depth / 2);
    shape.lineTo(-width / 2, -depth / 2);
    const geometry2d = new THREE.ShapeGeometry(shape);
    const edgesGeometry = new THREE.EdgesGeometry(geometry2d);
    geometry2d.dispose();
    return edgesGeometry;
  }, []);

  return (
    <lineSegments position={[x, 0.02, 3]} rotation={[-Math.PI / 2, 0, 0]} geometry={edges}>
      <lineBasicMaterial color={PARK.box} transparent opacity={0.9} />
    </lineSegments>
  );
}

function FieldElements() {
  return null;
}

/**
 * StrikeZone（固定オーバーレイ）
 * - 横幅は常に 17 inch = 17/12 ft。半幅は 17/24 ft。
 * - 縦は当該 AtBat の「先頭ピッチ」の sz_top / sz_bot を採用し、打席中は不変。
 * - 横中心はホームプレート中心 x=0 に固定（投球ごとに動かない）。
 * - Plate通過面（y=0）に相当する world z=0 付近に配置。
 */
function StrikeZone({ atBat }: { atBat?: AtBat }) {
  const points = useMemo(() => {
    if (!atBat || atBat.pitches.length === 0) return [];
    const first = atBat.pitches[0];
    const halfWidth = 17 / 24; // (17 inches / 12) / 2 = 0.7083ft
    const centerX = 0; // plate center に固定
    const top = first.sz_top ?? 3.5;
    const bottom = first.sz_bot ?? 1.5;
    const z = 0;

    const corners = [
      [centerX - halfWidth, bottom, z],
      [centerX + halfWidth, bottom, z],
      [centerX + halfWidth, top, z],
      [centerX - halfWidth, top, z],
      [centerX - halfWidth, bottom, z],
    ] as const;

    return corners.map(([x, y, zPos]) => new THREE.Vector3(x, y, zPos));
  }, [atBat]);

  if (!atBat) return null;
  return (
    <Line
      points={points}
      color="#bfdbfe"
      lineWidth={2}
      transparent
      opacity={0.85}
      depthTest={false}
    />
  );
}

function Trajectory({ pitch }: { pitch?: Pitch }) {
  const playbackTime = useStore((state) => state.playbackTime);

  const samplePoints = useMemo(() => {
    if (!pitch) return [];
    return pitch.samples.map((sample) => ({ t: sample.t, position: worldFromSample(sample) }));
  }, [pitch]);

  const visiblePoints = useMemo(() => {
    if (!pitch) return [];
    const visibleT = Math.max(0, playbackTime - TRAIL_DELAY_S);
    if (visibleT <= 0) return [];

    const collected: THREE.Vector3[] = [];
    let lastIncludedT = -1;

    for (const sample of samplePoints) {
      if (sample.t <= visibleT) {
        collected.push(sample.position);
        lastIncludedT = sample.t;
      } else {
        break;
      }
    }

    const finalSampleT = samplePoints[samplePoints.length - 1]?.t ?? 0;
    if (visibleT < finalSampleT - 1e-4 && visibleT > lastIncludedT + 1e-4) {
      const interpolated = worldFromSample(getPositionAtTime(pitch.samples, visibleT));
      collected.push(interpolated);
    }

    return collected;
  }, [pitch, playbackTime, samplePoints]);

  if (!pitch || visiblePoints.length < 2) return null;
  return (
    <Line points={visiblePoints} color={resolvePitchColor(pitch)} lineWidth={3} transparent opacity={0.9} />
  );
}

function ReleaseMarker({ pitch }: { pitch?: Pitch }) {
  const position = useMemo(() => {
    if (!pitch) return new THREE.Vector3(0, 0, 0);
    return worldFromSample(pitch.samples[0]);
  }, [pitch]);

  if (!pitch) return null;
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.25, 16, 16]} />
      <meshStandardMaterial color="#facc15" emissive="#fbbf24" emissiveIntensity={0.3} />
    </mesh>
  );
}

function Ball({
  pitch,
  onTrajectoryPhaseChange,
}: {
  pitch?: Pitch;
  onTrajectoryPhaseChange: (on: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const {
    isPlaying,
    playbackSpeed,
    nextPitch,
    atBats,
    currentAtBatIndex,
    currentPitchIndex,
    setUiIdle,
    setPhase,
    setLastVisibleCount,
    setPlaybackTime,
  } = useStore((state) => ({
    isPlaying: state.isPlaying,
    playbackSpeed: state.playbackSpeed,
    nextPitch: state.nextPitch,
    atBats: state.atBats,
    currentAtBatIndex: state.currentAtBatIndex,
    currentPitchIndex: state.currentPitchIndex,
    setUiIdle: state.setUiIdle,
    setPhase: state.setPhase,
    setLastVisibleCount: state.setLastVisibleCount,
    setPlaybackTime: state.setPlaybackTime,
  }));
  const ensurePhase = useCallback(
    (target: Phase) => {
      if (useStore.getState().phase !== target) {
        setPhase(target);
      }
    },
    [setPhase]
  );
  const timeRef = useRef(0);
  const phaseRef = useRef<'idle' | 'trajectoryLead' | 'playing' | 'hold' | 'waitingNext' | 'done'>('idle');
  const phaseTimerRef = useRef(0);
  const phaseDurationRef = useRef(0);
  const pendingIdleRef = useRef<number | null>(null);
  const awaitingNextPitchRef = useRef(false);
  const firstPitchDelayHandledRef = useRef(false);

  // 効果音
  const ballSfxRef = useRef<HTMLAudioElement | null>(null);
  const batSfxRef = useRef<HTMLAudioElement | null>(null);
  const sfxArmedRef = useRef(false);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    const ballAudio = new Audio('/ball.mp3');
    const batAudio = new Audio('/bat.mp3');
    [ballAudio, batAudio].forEach((audio) => {
      if (!audio) return;
      audio.preload = 'auto';
      audio.volume = 0.6;
    });
    ballSfxRef.current = ballAudio;
    batSfxRef.current = batAudio;
    return () => {
      ballSfxRef.current = null;
      batSfxRef.current = null;
    };
  }, []);

  useEffect(() => {
    sfxArmedRef.current = Boolean(pitch);
  }, [pitch]);

  const isContact = useMemo(() => {
    if (!pitch) return false;
    const surface = `${pitch.events ?? ''} ${pitch.description ?? ''}`.toLowerCase();
    if (pitch.type === 'X') return true;
    return /foul|foul_tip|tip|in_play|single|double|triple|home_run|homer/.test(surface);
  }, [pitch]);

  const isFirstPitch = currentAtBatIndex === 0 && currentPitchIndex === 0;

  const upcomingPitchContext = useMemo(() => {
    const currentAtBat = atBats[currentAtBatIndex];
    const currentPitch = currentAtBat?.pitches[currentPitchIndex];

    let nextPitchData: Pitch | undefined;
    if (currentAtBat) {
      if (currentPitchIndex + 1 < currentAtBat.pitches.length) {
        nextPitchData = currentAtBat.pitches[currentPitchIndex + 1];
      } else {
        for (let i = currentAtBatIndex + 1; i < atBats.length; i += 1) {
          const candidate = atBats[i];
          if (candidate && candidate.pitches.length > 0) {
            nextPitchData = candidate.pitches[0];
            break;
          }
        }
      }
    }

    const changesInning = Boolean(
      currentPitch &&
        nextPitchData &&
        (nextPitchData.inning !== currentPitch.inning ||
          nextPitchData.inning_topbot !== currentPitch.inning_topbot)
    );

    return { nextPitchData, changesInning };
  }, [atBats, currentAtBatIndex, currentPitchIndex, pitch]);

  useEffect(() => {
    timeRef.current = 0;
    phaseTimerRef.current = 0;
    phaseDurationRef.current = 0;
    awaitingNextPitchRef.current = false;
    setPlaybackTime(0);

    if (!meshRef.current) return;

    if (!pitch) {
      meshRef.current.visible = false;
      setUiIdle(true);
      onTrajectoryPhaseChange(false);
      setPlaybackTime(0);
      return;
    }

    const first = pitch.samples[0];
    const pos = worldFromSample(first);
    meshRef.current.position.copy(pos);
    meshRef.current.visible = false;

    let idleDuration = pendingIdleRef.current ?? 0;
    pendingIdleRef.current = null;

    if (isFirstPitch && !firstPitchDelayHandledRef.current) {
      idleDuration = Math.max(idleDuration, FIRST_PITCH_DELAY_SEC);
      firstPitchDelayHandledRef.current = true;
    }

    if (idleDuration > 0) {
      phaseRef.current = 'idle';
      phaseDurationRef.current = idleDuration;
      phaseTimerRef.current = 0;
      setUiIdle(true);
      onTrajectoryPhaseChange(false);
    } else {
      phaseRef.current = 'trajectoryLead';
      phaseDurationRef.current = TRAJECTORY_LEAD_SEC;
      phaseTimerRef.current = 0;
      setUiIdle(false);
      onTrajectoryPhaseChange(false);
    }
  }, [pitch, isFirstPitch, onTrajectoryPhaseChange, setUiIdle, ensurePhase]);

  useFrame((_, delta) => {
    setPlaybackTime(timeRef.current);

    if (!pitch || !meshRef.current) return;

    if (phaseRef.current === 'idle') {
      if (isPlaying) {
        phaseTimerRef.current += delta;
        if (phaseTimerRef.current >= phaseDurationRef.current) {
          phaseRef.current = 'trajectoryLead';
          phaseTimerRef.current = 0;
          phaseDurationRef.current = TRAJECTORY_LEAD_SEC;
          setUiIdle(false);
          onTrajectoryPhaseChange(false);
        }
      }
      setPlaybackTime(timeRef.current);
      return;
    }

    if (phaseRef.current === 'trajectoryLead') {
      if (isPlaying) {
        phaseTimerRef.current += delta;
        if (phaseTimerRef.current >= TRAJECTORY_LEAD_SEC) {
          meshRef.current.visible = true;
          phaseRef.current = 'playing';
          phaseTimerRef.current = 0;
          onTrajectoryPhaseChange(true);
          ensurePhase('pitch');
        }
      }
      setPlaybackTime(timeRef.current);
      return;
    }

    if (phaseRef.current === 'waitingNext' || phaseRef.current === 'done') {
      return;
    }

    if (phaseRef.current === 'hold') {
      if (isPlaying) {
        phaseTimerRef.current += delta;
        if (phaseTimerRef.current >= AFTER_PITCH_HOLD_SEC) {
          meshRef.current.visible = false;
          onTrajectoryPhaseChange(false);
          setUiIdle(true);
          const nextPhase: Phase = upcomingPitchContext.changesInning ? 'inningBreak' : 'between';
          ensurePhase(nextPhase);
          if (nextPhase === 'inningBreak') {
            setLastVisibleCount(undefined);
          }
          if (!awaitingNextPitchRef.current) {
            awaitingNextPitchRef.current = true;
            const waitDuration = upcomingPitchContext.nextPitchData
              ? nextPhase === 'inningBreak'
                ? INNING_CHANGE_BLANK_SEC
                : BETWEEN_PITCH_BLANK_SEC
              : 0;
            pendingIdleRef.current = waitDuration;
            phaseRef.current = upcomingPitchContext.nextPitchData ? 'waitingNext' : 'done';
            nextPitch();
          }
        }
      }
      setPlaybackTime(timeRef.current);
      return;
    }

    if (!isPlaying && timeRef.current === 0) {
      const start = worldFromSample(pitch.samples[0]);
      meshRef.current.position.copy(start);
      return;
    }

    if (!isPlaying) {
      setPlaybackTime(timeRef.current);
      return;
    }

    const baseSpeedFactor = Math.max(0.4, pitch.release_speed / 90);
    const scaledDelta = delta * playbackSpeed * baseSpeedFactor;

    const nextTime = Math.min(pitch.duration, timeRef.current + scaledDelta);
    timeRef.current = nextTime;
    setPlaybackTime(timeRef.current);
    const sample = getPositionAtTime(pitch.samples, nextTime);
    const position = worldFromSample(sample);
    meshRef.current.position.copy(position);

    const soundLead = 0.03;
    const triggerTime = Math.max(0, (pitch.duration ?? 0) - soundLead);
    if (sfxArmedRef.current && timeRef.current >= triggerTime) {
      const target = isContact ? batSfxRef.current : ballSfxRef.current;
      sfxArmedRef.current = false;
      if (target) {
        try {
          target.currentTime = 0;
          void target.play();
        } catch {
          // ブラウザの自動再生制限などは握りつぶす
        }
      }
    }

    if (nextTime >= pitch.duration - 1e-3) {
      if (phaseRef.current !== 'hold') {
        phaseRef.current = 'hold';
        phaseTimerRef.current = 0;
        phaseDurationRef.current = AFTER_PITCH_HOLD_SEC;
        ensurePhase('hold');
        setUiIdle(false);
        setLastVisibleCount({
          balls: pitch.postCount.balls,
          strikes: pitch.postCount.strikes,
          outs: pitch.outsAfter,
        });
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.18, 32, 32]} />
      <meshStandardMaterial color="#fef3c7" emissive="#fde68a" emissiveIntensity={0.2} />
    </mesh>
  );
}

function CameraRig() {
  const cameraView = useStore((state) => state.cameraView);
  const { camera } = useThree();

  useFrame(() => {
    const preset = CAMERA_PRESETS[cameraView] ?? CAMERA_PRESETS.catcher;
    camera.position.lerp(preset.position, 0.08);
    camera.lookAt(preset.target);
  });

  return null;
}

function SceneContents() {
  const [trajectoryPhaseOn, setTrajectoryPhaseOn] = useState(false);
  const { atBat, pitch, showTrajectory, showReleasePoint, showStrikeZone, isUiIdle, setUiIdle, phase } = useStore(
    (state) => {
      const atBat = state.atBats[state.currentAtBatIndex];
      return {
        atBat,
        pitch: atBat?.pitches[state.currentPitchIndex],
        showTrajectory: state.showTrajectory,
        showReleasePoint: state.showReleasePoint,
        showStrikeZone: state.showStrikeZone,
        isUiIdle: state.isUiIdle,
        setUiIdle: state.setUiIdle,
        phase: state.phase,
      };
    }
  );

  useEffect(() => {
    setUiIdle(true);
  }, [setUiIdle]);

  const allowVisuals = phase === 'pitch' || phase === 'hold';

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 20]} intensity={0.7} />
      <directionalLight position={[-20, 30, -20]} intensity={0.45} />
      <FieldElements />
      {showStrikeZone && <StrikeZone atBat={atBat} />}
      {showTrajectory && trajectoryPhaseOn && !isUiIdle && allowVisuals && <Trajectory pitch={pitch} />}
      {showReleasePoint && !isUiIdle && allowVisuals && <ReleaseMarker pitch={pitch} />}
      <Ball pitch={pitch} onTrajectoryPhaseChange={setTrajectoryPhaseOn} />
    </group>
  );
}

export default function Canvas3D() {
  const bgStyle: React.CSSProperties = {
    backgroundImage: "url('/Stadium6.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
    backgroundColor: '#0b1c22',
  };

  return (
    <div className="canvas-wrapper" style={bgStyle}>
      <Canvas
        shadows
        gl={{ alpha: true }}
        style={{ background: 'transparent' }}
        camera={{ position: [0, 6, 12], fov: 45 }}
      >
        <PerspectiveCamera makeDefault position={[0, 6, 12]} fov={45} />
        <CameraRig />
        <SceneContents />
      </Canvas>
    </div>
  );
}




