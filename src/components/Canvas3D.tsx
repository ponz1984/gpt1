import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { PitchWithDerived, TrajectorySample } from '../engine/statcast.types';
import { useStore } from '../state/useStore';
import styles from './Canvas3D.module.css';

const pitchTypeColors: Record<string, string> = {
  FF: '#ff595e',
  FT: '#f9844a',
  SL: '#577590',
  CH: '#43aa8b',
  CU: '#277da1',
  KC: '#90be6d',
  SI: '#f94144'
};

function toThreePosition(sample: TrajectorySample): THREE.Vector3 {
  return new THREE.Vector3(sample.x, sample.z, -sample.y);
}

function interpolatePosition(samples: TrajectorySample[], t: number): THREE.Vector3 {
  if (!samples.length) return new THREE.Vector3();
  if (t <= samples[0].t) {
    return toThreePosition(samples[0]);
  }
  for (let i = 0; i < samples.length - 1; i += 1) {
    const current = samples[i];
    const next = samples[i + 1];
    if (t >= current.t && t <= next.t) {
      const ratio = (t - current.t) / Math.max(1e-6, next.t - current.t);
      const currentPos = toThreePosition(current);
      const nextPos = toThreePosition(next);
      return currentPos.lerp(nextPos, ratio);
    }
  }
  return toThreePosition(samples[samples.length - 1]);
}

const Field = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[140, 140]} />
      <meshStandardMaterial color="#0b3d3e" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
      <ringGeometry args={[4.25, 4.35, 64]} />
      <meshStandardMaterial color="#ffe066" emissive="#ffe066" emissiveIntensity={0.2} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <planeGeometry args={[9, 15]} />
      <meshStandardMaterial color="#fdfcdc" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 2.5]}>
      <planeGeometry args={[4.25, 6]} />
      <meshStandardMaterial color="#ced4da" />
    </mesh>
    <mesh position={[0, 0.4, -60]}>
      <cylinderGeometry args={[3, 3, 0.6, 32]} />
      <meshStandardMaterial color="#adb5bd" />
    </mesh>
    <mesh rotation={[0, 0, 0]} position={[0, 0.02, -2.5]}>
      <boxGeometry args={[17, 0.1, 0.5]} />
      <meshStandardMaterial color="#ffe8d6" emissive="#ffd6a5" emissiveIntensity={0.2} />
    </mesh>
  </group>
);

const StrikeZone = ({ top, bottom }: { top: number; bottom: number }) => {
  const halfWidth = 1.4167 / 2;
  const points = useMemo(() => {
    const corners: THREE.Vector3[] = [
      new THREE.Vector3(-halfWidth, top, 0),
      new THREE.Vector3(halfWidth, top, 0),
      new THREE.Vector3(halfWidth, bottom, 0),
      new THREE.Vector3(-halfWidth, bottom, 0),
      new THREE.Vector3(-halfWidth, top, 0)
    ];
    return corners.map((corner) => new THREE.Vector3(corner.x, corner.y, 0.01));
  }, [top, bottom]);

  return <Line points={points} color="#4cc9f0" lineWidth={2.4} />;
};

const ReleaseMarker = ({ pitch }: { pitch: PitchWithDerived }) => {
  const position = useMemo(() => new THREE.Vector3(pitch.release_pos_x, pitch.release_pos_z, -pitch.release_pos_y), [pitch]);
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#ff9f1c" emissive="#ff9f1c" emissiveIntensity={0.4} />
    </mesh>
  );
};

const Trajectory = ({ pitch }: { pitch: PitchWithDerived }) => {
  const points = useMemo(() => pitch.samples.map((sample) => toThreePosition(sample)), [pitch.samples]);
  const color = pitchTypeColors[pitch.pitch_type] ?? '#00b4d8';
  return <Line points={points} color={color} lineWidth={2.6} />;
};

const Ball = ({ pitch }: { pitch: PitchWithDerived }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const state = useStore.getState();
    const time = state.pitchTime;
    const position = interpolatePosition(pitch.samples, time);
    if (meshRef.current) {
      meshRef.current.position.copy(position);
    }
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.18, 32, 32]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={0.8}
        roughness={0.25}
        metalness={0.1}
      />
    </mesh>
  );
};

const CameraRig = () => {
  const view = useStore((state) => state.view);
  const { camera } = useThree();

  useEffect(() => {
    const configs: Record<string, { position: [number, number, number]; lookAt: [number, number, number] }>
      = {
        catcher: { position: [0, 5, 12], lookAt: [0, 3, -20] },
        umpire: { position: [0, 6, 6], lookAt: [0, 3, -15] },
        center: { position: [0, 35, -70], lookAt: [0, 3, 0] }
      };
    const config = configs[view] ?? configs.catcher;
    camera.position.set(...config.position);
    camera.lookAt(...config.lookAt);
  }, [camera, view]);

  return null;
};

const PlaybackController = ({ pitch }: { pitch?: PitchWithDerived }) => {
  useFrame((_, delta) => {
    const state = useStore.getState();
    if (!pitch || !state.isPlaying) {
      return;
    }
    const duration = pitch.duration;
    if (duration <= 0) return;
    const speedFactor = THREE.MathUtils.clamp(pitch.release_speed / 92, 0.6, 1.45);
    const nextTime = state.pitchTime + delta * state.playbackSpeed * speedFactor;
    if (nextTime >= duration) {
      state.setPitchTime(duration);
      state.handlePitchComplete();
    } else {
      state.setPitchTime(nextTime);
    }
  });
  return null;
};

export const Canvas3D = () => {
  const pitches = useStore((state) => state.pitches);
  const currentPitchIndex = useStore((state) => state.currentPitchIndex);
  const overlays = useStore((state) => state.overlays);
  const awaitingAdvance = useStore((state) => state.isAwaitingAdvance);
  const advanceMode = useStore((state) => state.advanceMode);
  const pitch = pitches[currentPitchIndex];

  return (
    <div className={styles.container}>
      <Canvas shadows camera={{ fov: 45, position: [0, 5, 12], near: 0.1, far: 200 }}>
        <color attach="background" args={['#011627']} />
        <fog attach="fog" args={["#011627", 60, 160]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[20, 30, 20]} intensity={1.35} castShadow color="#ffe066" />
        <spotLight
          position={[-10, 25, 30]}
          angle={0.5}
          penumbra={0.5}
          intensity={0.8}
          color="#4cc9f0"
        />
        <Field />
        {pitch && overlays.showZone ? <StrikeZone top={pitch.sz_top} bottom={pitch.sz_bot} /> : null}
        {pitch && overlays.showTrajectory ? <Trajectory pitch={pitch} /> : null}
        {pitch && overlays.showRelease ? <ReleaseMarker pitch={pitch} /> : null}
        {pitch ? <Ball pitch={pitch} /> : null}
        <CameraRig />
        <PlaybackController pitch={pitch} />
      </Canvas>
      {!pitch ? (
        <div className={styles.overlay}>3D表示はCSVを読み込むと開始します。</div>
      ) : null}
      {awaitingAdvance ? (
        <div className={styles.overlay} aria-live="polite">
          {advanceMode === 'manual'
            ? '次の投球を再生するには操作パネルから指示してください。'
            : '次の投球を準備中です。少々お待ちください…'}
        </div>
      ) : null}
    </div>
  );
};
