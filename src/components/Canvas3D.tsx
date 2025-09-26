import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, PerspectiveCamera } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getPositionAtTime } from '../engine/physics';
import type { AtBat, Pitch } from '../engine/statcast.types';
import { useStore } from '../state/useStore';
import { getPitchColor } from '../utils/colors';

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

function worldFromSample(sample: { x: number; y: number; z: number }): THREE.Vector3 {
  // Statcast: x(左右), y(捕手方向への距離), z(高さ)
  // World   : x(左右), y(高さ), z(奥行き) ・・・ y と z を入れ替え、z は符号反転
  return new THREE.Vector3(sample.x, sample.z, -sample.y);
}

function resolvePitchColor(pitch: Pitch | undefined): string {
  if (!pitch) return '#f8fafc';
  return getPitchColor(pitch.pitch_type);
}

function FieldElements() {
  const plateShape = useMemo(() => {
    const shape = new THREE.Shape();
    // ホームベース（幅=17in=1.4167ftに合わせたおおよそ）
    shape.moveTo(-0.708, 0);
    shape.lineTo(0.708, 0);
    shape.lineTo(0.708, -0.708);
    shape.lineTo(0, -1.416);
    shape.lineTo(-0.708, -0.708);
    shape.closePath();
    return shape;
  }, []);

  const homePlate = useMemo(() => new THREE.ShapeGeometry(plateShape), [plateShape]);

  return (
    <group>
      {/* マウンド・外野・ホーム等の簡易モデル */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -90]}>
        <cylinderGeometry args={[9, 15, 0.5, 24]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[120, 140]} />
        <meshStandardMaterial color="#064e3b" roughness={1} />
      </mesh>
      <mesh rotation={[0, 0, 0]} position={[0, 0.01, 0]} geometry={homePlate}>
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
      <mesh position={[0, 0.25, -60]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[3, 5, 1.5, 32]} />
        <meshStandardMaterial color="#b45309" roughness={0.9} />
      </mesh>
      <mesh position={[-3, 0.02, 3]}>
        <boxGeometry args={[4, 0.05, 6]} />
        <meshStandardMaterial color="#f3f4f6" opacity={0.35} transparent />
      </mesh>
      <mesh position={[3, 0.02, 3]}>
        <boxGeometry args={[4, 0.05, 6]} />
        <meshStandardMaterial color="#f3f4f6" opacity={0.35} transparent />
      </mesh>
      <mesh position={[0, 0.02, -1]}>
        <boxGeometry args={[1.5, 0.05, 1.5]} />
        <meshStandardMaterial color="#f8fafc" opacity={0.65} transparent />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.1, 0.05, 8]} />
        <meshStandardMaterial color="#f9fafb" opacity={0.4} transparent />
      </mesh>
    </group>
  );
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
  const linePoints = useMemo(() => {
    if (!pitch) return [];
    return pitch.samples.map((sample) => worldFromSample(sample));
  }, [pitch]);

  if (!pitch) return null;
  return <Line points={linePoints} color={resolvePitchColor(pitch)} lineWidth={3} transparent opacity={0.9} />;
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

function Ball({ pitch }: { pitch?: Pitch }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { isPlaying, playbackSpeed, nextPitch } = useStore((state) => ({
    isPlaying: state.isPlaying,
    playbackSpeed: state.playbackSpeed,
    nextPitch: state.nextPitch,
  }));
  const timeRef = useRef(0);
  const waitRef = useRef(0);
  const waitingRef = useRef(false);

  useEffect(() => {
    timeRef.current = 0;
    waitRef.current = 0;
    waitingRef.current = false;
    if (pitch && meshRef.current) {
      const first = pitch.samples[0];
      const pos = worldFromSample(first);
      meshRef.current.position.copy(pos);
    }
  }, [pitch]);

  useFrame((_, delta) => {
    if (!pitch || !meshRef.current) return;
    if (waitingRef.current) {
      waitRef.current += delta;
      if (waitRef.current >= 0.9 && isPlaying) {
        waitingRef.current = false;
        waitRef.current = 0;
        nextPitch();
      }
      return;
    }

    const baseSpeedFactor = Math.max(0.4, pitch.release_speed / 90);
    const scaledDelta = delta * playbackSpeed * baseSpeedFactor;

    if (!isPlaying && timeRef.current === 0) {
      const start = worldFromSample(pitch.samples[0]);
      meshRef.current.position.copy(start);
      return;
    }

    if (!isPlaying) {
      return;
    }

    const nextTime = Math.min(pitch.duration, timeRef.current + scaledDelta);
    timeRef.current = nextTime;
    const sample = getPositionAtTime(pitch.samples, nextTime);
    const position = worldFromSample(sample);
    meshRef.current.position.copy(position);

    if (nextTime >= pitch.duration - 1e-3) {
      waitingRef.current = true;
      waitRef.current = 0;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.35, 32, 32]} />
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
  const { atBat, pitch, showTrajectory, showReleasePoint, showStrikeZone } = useStore((state) => {
    const atBat = state.atBats[state.currentAtBatIndex];
    return {
      atBat,
      pitch: atBat?.pitches[state.currentPitchIndex],
      showTrajectory: state.showTrajectory,
      showReleasePoint: state.showReleasePoint,
      showStrikeZone: state.showStrikeZone,
    };
  });

  return (
    <group>
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 20]} intensity={0.7} />
      <directionalLight position={[-20, 30, -20]} intensity={0.45} />
      <FieldElements />
      {showStrikeZone && <StrikeZone atBat={atBat} />}
      {showTrajectory && <Trajectory pitch={pitch} />}
      {showReleasePoint && <ReleaseMarker pitch={pitch} />}
      <Ball pitch={pitch} />
    </group>
  );
}

export default function Canvas3D() {
  return (
    <div className="canvas-wrapper">
      <Canvas shadows camera={{ position: [0, 6, 12], fov: 45 }}>
        <color attach="background" args={[0.03, 0.05, 0.1]} />
        <fog attach="fog" args={[0x050816, 40, 260]} />
        <PerspectiveCamera makeDefault position={[0, 6, 12]} fov={45} />
        <CameraRig />
        <SceneContents />
      </Canvas>
    </div>
  );
}
