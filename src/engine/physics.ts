import type { PitchRow, TrajectorySample } from './statcast.types';

const DEFAULT_DT = 1 / 240;

export function timeToPlate(y0: number, vy0: number, ay: number): number {
  const a = 0.5 * ay;
  const b = vy0;
  const c = y0;

  if (Math.abs(a) < 1e-8) {
    if (Math.abs(b) < 1e-8) {
      return 0;
    }
    return Math.max(0, -c / b);
  }

  const disc = b * b - 4 * a * c;
  if (disc < 0) {
    if (Math.abs(b) < 1e-8) {
      return 0;
    }
    return Math.max(0, -c / b);
  }

  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);
  const candidates = [t1, t2].filter((t) => t > 0);

  if (!candidates.length) {
    return Math.max(0, -c / b);
  }

  return Math.min(...candidates);
}

export function sampleTrajectory(row: PitchRow, dt = DEFAULT_DT): TrajectorySample[] {
  const {
    release_pos_x: x0,
    release_pos_y: y0,
    release_pos_z: z0,
    vx0,
    vy0,
    vz0,
    ax,
    ay,
    az,
  } = row;

  const tEnd = Math.max(timeToPlate(y0, vy0, ay), dt * 10);
  const sampleCount = Math.max(12, Math.ceil(tEnd / dt));
  const samples: TrajectorySample[] = [];

  for (let i = 0; i <= sampleCount; i += 1) {
    const t = Math.min(tEnd, i * dt);
    const x = x0 + vx0 * t + 0.5 * ax * t * t;
    const y = y0 + vy0 * t + 0.5 * ay * t * t;
    const z = z0 + vz0 * t + 0.5 * az * t * t;
    samples.push({ t, x, y, z });
  }

  if (samples[samples.length - 1]?.y > 0) {
    const t = tEnd;
    const x = x0 + vx0 * t + 0.5 * ax * t * t;
    const y = 0;
    const ratio = y / samples[samples.length - 1].y;
    const last = samples[samples.length - 1];
    samples.push({ t, x, y, z: last.z + (z0 - last.z) * ratio });
  }

  return samples;
}

export function toThreeCoordinates(sample: TrajectorySample) {
  return {
    x: sample.x,
    y: sample.z,
    z: -sample.y,
  } as const;
}

export function computeReleaseDirection(pitcherThrows: string): 'L' | 'R' {
  return pitcherThrows === 'L' ? 'L' : 'R';
}
