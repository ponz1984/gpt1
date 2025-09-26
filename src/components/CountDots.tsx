import React from 'react';

type Props = { balls: number; strikes: number; outs: number };

function Row({ filled, total, color }: { filled: number; total: number; color: string }) {
  const items = Array.from({ length: total }, (_, i) => i < filled);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {items.map((on, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: on ? color : 'transparent',
            border: `1.5px solid ${color}`,
            opacity: on ? 1 : 0.4,
          }}
          aria-hidden
        />
      ))}
    </div>
  );
}

export default function CountDots({ balls, strikes, outs }: Props) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {/* Balls: max 3 (green) */}
      <Row filled={Math.min(3, Math.max(0, balls))} total={3} color="#22c55e" />
      {/* Strikes: max 2 (yellow) */}
      <Row filled={Math.min(2, Math.max(0, strikes))} total={2} color="#eab308" />
      {/* Outs: max 2 (red) */}
      <Row filled={Math.min(2, Math.max(0, outs))} total={2} color="#ef4444" />
    </div>
  );
}
