import type { PitchRow, TrajectorySample } from './statcast.types';

const EPS = 1e-6;

export function timeToPlate(y0: number, vy0: number, ay: number): number {
  const a = 0.5 * ay;
  const b = vy0;
  const c = y0;

  if (Math.abs(a) < EPS) {
    if (Math.abs(b) < EPS) {
      return 0;
    }
    return Math.max(0, -c / b);
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    const approx = -c / (b !== 0 ? b : -Math.sign(a) || -1);
    return Math.max(0, approx);
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);
  const candidates = [t1, t2].filter((t) => t > EPS);
  if (candidates.length === 0) {
    return Math.max(0, Math.min(t1, t2));
  }
  return Math.min(...candidates);
}

export function sampleTrajectory(row: PitchRow, dt = 1 / 240): TrajectorySample[] {
  const { release_pos_x: x0, release_pos_y: y0, release_pos_z: z0, vx0, vy0, vz0, ax, ay, az } = row;
  const totalTime = timeToPlate(y0, vy0, ay);
  const clampedTotal = Number.isFinite(totalTime) && totalTime > 0 ? totalTime : 0.7;
  const steps = Math.max(10, Math.ceil(clampedTotal / dt));
  const samples: TrajectorySample[] = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = Math.min(clampedTotal, i * dt);
    const tSq = t * t;
    const x = x0 + vx0 * t + 0.5 * ax * tSq;
    const y = y0 + vy0 * t + 0.5 * ay * tSq;
    const z = z0 + vz0 * t + 0.5 * az * tSq;
    samples.push({ t, x, y, z });
  }

  if (samples.length === 0 || samples[samples.length - 1].t < clampedTotal - EPS) {
    const t = clampedTotal;
    const tSq = t * t;
    samples.push({
      t,
      x: x0 + vx0 * t + 0.5 * ax * tSq,
      y: y0 + vy0 * t + 0.5 * ay * tSq,
      z: z0 + vz0 * t + 0.5 * az * tSq,
    });
  }

  return samples;
}

export function getPositionAtTime(samples: TrajectorySample[], time: number): TrajectorySample {
  if (samples.length === 0) {
    return { t: 0, x: 0, y: 0, z: 0 };
  }
  if (time <= samples[0].t) {
    return samples[0];
  }
  const last = samples[samples.length - 1];
  if (time >= last.t) {
    return last;
  }
  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1];
    const next = samples[i];
    if (time <= next.t + EPS) {
      const span = next.t - prev.t || EPS;
      const ratio = (time - prev.t) / span;
      return {
        t: time,
        x: prev.x + (next.x - prev.x) * ratio,
        y: prev.y + (next.y - prev.y) * ratio,
        z: prev.z + (next.z - prev.z) * ratio,
      };
    }
  }
  return last;
}
