import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls, Html } from '@react-three/drei';
import type { Line, Mesh } from 'three';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { useViewerStore } from '../state/useStore';
import { getPitchDuration } from '../engine/playback';
import type { PitchWithDerived, TrajectorySample } from '../engine/statcast.types';
import { toThreeCoordinates } from '../engine/physics';

const CAMERA_POSES = {
  catcher: { position: [0, 5, -10] as [number, number, number], lookAt: [0, 3, 50] as [number, number, number] },
  umpire: { position: [0, 6, -7] as [number, number, number], lookAt: [0, 3, 50] as [number, number, number] },
  center: { position: [0, 45, -30] as [number, number, number], lookAt: [0, 3, 50] as [number, number, number] },
};

function usePlaybackProgress(pitch?: PitchWithDerived) {
  const isPlaying = useViewerStore((s) => s.isPlaying);
  const playbackSpeed = useViewerStore((s) => s.playbackSpeed);
  const nextPitch = useViewerStore((s) => s.nextPitch);
  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = 0;
  }, [pitch?.id, playbackSpeed]);

  useFrame((_, delta) => {
    if (!pitch) return;
    if (!isPlaying) return;
    const duration = getPitchDuration(pitch);
    const normalizedIncrement = (delta * playbackSpeed) / duration;
    progressRef.current += normalizedIncrement;
    if (progressRef.current >= 1) {
      progressRef.current = 1;
      nextPitch();
    }
  });

  return progressRef;
}

function interpolateSamples(samples: TrajectorySample[], progress: number) {
  if (!samples.length) return { x: 0, y: 0, z: 0 };
  const totalTime = samples[samples.length - 1].t;
  const targetTime = Math.min(totalTime, Math.max(0, totalTime * progress));
  for (let i = 0; i < samples.length - 1; i += 1) {
    const current = samples[i];
    const next = samples[i + 1];
    if (targetTime >= current.t && targetTime <= next.t) {
      const ratio = (targetTime - current.t) / (next.t - current.t || 1);
      return {
        x: current.x + (next.x - current.x) * ratio,
        y: current.y + (next.y - current.y) * ratio,
        z: current.z + (next.z - current.z) * ratio,
      };
    }
  }
  const last = samples[samples.length - 1];
  return { x: last.x, y: last.y, z: last.z };
}

function TrajectoryTrail({ pitch }: { pitch: PitchWithDerived }) {
  const showTrails = useViewerStore((s) => s.showTrails);
  const geometryRef = useRef<BufferGeometry>(new BufferGeometry());
  const lineRef = useRef<Line | null>(null);

  const positions = useMemo(() => {
    const verts: number[] = [];
    pitch.samples.forEach((sample) => {
      const point = toThreeCoordinates(sample);
      verts.push(point.x, point.y, point.z);
    });
    return new Float32BufferAttribute(verts, 3);
  }, [pitch.samples]);

  useEffect(() => {
    const geometry = geometryRef.current;
    const previous = geometry.getAttribute('position');
    if (previous) {
      previous.dispose();
    }
    geometry.setAttribute('position', positions);
    geometry.computeBoundingSphere();
    return () => {
      positions.dispose();
    };
  }, [positions]);

  if (!showTrails) return null;

  return (
    <line ref={lineRef} geometry={geometryRef.current}>
      <lineBasicMaterial attach="material" color="#4cc9f0" linewidth={2} />
    </line>
  );
}

function StrikeZone({ pitch }: { pitch: PitchWithDerived }) {
  const showZone = useViewerStore((s) => s.showZone);
  if (!showZone) return null;
  const halfWidth = 17 / 12 / 2;
  const top = pitch.sz_top;
  const bottom = pitch.sz_bot;
  const vertices = [
    [-halfWidth, top, 0],
    [halfWidth, top, 0],
    [halfWidth, bottom, 0],
    [-halfWidth, bottom, 0],
    [-halfWidth, top, 0],
  ];
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={new Float32Array(vertices.flat())} count={vertices.length} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color="white" linewidth={1} />
    </line>
  );
}

function ReleaseMarker({ pitch }: { pitch: PitchWithDerived }) {
  const showRelease = useViewerStore((s) => s.showRelease);
  if (!showRelease) return null;
  const { x, y, z } = toThreeCoordinates({ t: 0, x: pitch.release_pos_x, y: pitch.release_pos_y, z: pitch.release_pos_z });
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial color="#f72585" emissive="#f72585" emissiveIntensity={0.5} />
    </mesh>
  );
}

function Ball({ pitch, progressRef }: { pitch: PitchWithDerived; progressRef: React.MutableRefObject<number> }) {
  const meshRef = useRef<Mesh>(null);
  useFrame(() => {
    const interpolated = interpolateSamples(pitch.samples, progressRef.current);
    const coords = toThreeCoordinates(interpolated);
    if (meshRef.current) {
      meshRef.current.position.set(coords.x, coords.y, coords.z);
    }
  });
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.18, 32, 32]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.2} />
    </mesh>
  );
}

function Field() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0b3d0b" />
      </mesh>
      <mesh position={[0, 0.05, 60]}>
        <cylinderGeometry args={[9, 9, 0.1, 64]} />
        <meshStandardMaterial color="#c2b280" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 10]} />
        <meshStandardMaterial color="#1d1d1d" />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.4, 32, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#ffffff" side={2} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.5, 0.2, 1.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.1, 43]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
        <meshStandardMaterial color="#d9c7a0" />
      </mesh>
    </group>
  );
}

function CameraRig() {
  const view = useViewerStore((s) => s.cameraView);
  const { position, lookAt } = CAMERA_POSES[view];
  const cameraRef = useRef<any>(null);

  useFrame(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(...lookAt);
    }
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault position={position} fov={50} />;
}

function SceneContent() {
  const pitch = useViewerStore((s) => s.pitches[s.currentPitchIndex]);
  const progressRef = usePlaybackProgress(pitch);

  if (!pitch) {
    return (
      <Html center>
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.6)', borderRadius: '12px' }}>
          CSVを読み込むと3D再生が始まります
        </div>
      </Html>
    );
  }

  return (
    <group>
      <ambientLight intensity={0.4} />
      <directionalLight position={[20, 30, -20]} intensity={1.1} castShadow />
      <Field />
      <StrikeZone pitch={pitch} />
      <ReleaseMarker pitch={pitch} />
      <TrajectoryTrail pitch={pitch} />
      <Ball pitch={pitch} progressRef={progressRef} />
    </group>
  );
}

export default function Canvas3D() {
  return (
    <div className="canvas-container">
      <Canvas shadows>
        <Suspense fallback={null}>
          <CameraRig />
          <SceneContent />
          <OrbitControls enablePan={false} enableZoom enableRotate maxDistance={120} minDistance={4} />
        </Suspense>
      </Canvas>
    </div>
  );
}
