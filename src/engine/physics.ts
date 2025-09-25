import { PitchRow, TrajectorySample } from './statcast.types';

export function timeToPlate(y0: number, vy0: number, ay: number): number {
  const a = 0.5 * ay;
  const b = vy0;
  const c = y0;

  if (Math.abs(a) < 1e-8) {
    return Math.max(0, -c / b);
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return Math.max(0, -c / b);
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);
  const candidates = [t1, t2].filter((t) => t > 0);
  if (!candidates.length) {
    return Math.max(0, -c / b);
  }
  return Math.min(...candidates);
}

export function sampleTrajectory(row: PitchRow, dt = 1 / 240): TrajectorySample[] {
  const {
    release_pos_x: x0,
    release_pos_y: y0,
    release_pos_z: z0,
    vx0,
    vy0,
    vz0,
    ax,
    ay,
    az
  } = row;
  const tEnd = Math.max(dt, timeToPlate(y0, vy0, ay));
  const steps = Math.max(10, Math.ceil(tEnd / dt));
  const samples: TrajectorySample[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = Math.min(tEnd, i * dt);
    const x = x0 + vx0 * t + 0.5 * ax * t * t;
    const y = y0 + vy0 * t + 0.5 * ay * t * t;
    const z = z0 + vz0 * t + 0.5 * az * t * t;
    samples.push({ t, x, y, z });
  }
  return samples;
}
