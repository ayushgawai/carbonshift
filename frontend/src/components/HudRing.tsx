import { useMemo } from 'react';

interface HudRingProps {
  electricityPrice: number;
  carbonIntensity: number;
  trainingStatus: string;
}

function getStatusLabel(status: string, price: number): { line1: string; line2: string } {
  if (price > 50) return { line1: 'GRID', line2: 'CRISIS' };
  switch (status) {
    case 'running':   return { line1: 'SYSTEM', line2: 'OPTIMAL' };
    case 'paused':    return { line1: 'ENERGY', line2: 'SAVING' };
    case 'completed': return { line1: 'MISSION', line2: 'COMPLETE' };
    default:          return { line1: 'STAND', line2: 'BY' };
  }
}

function getStatusColor(status: string, price: number): string {
  if (price > 50) return '#ef4444';
  switch (status) {
    case 'running':   return '#10b981';
    case 'paused':    return '#f59e0b';
    case 'completed': return '#3b82f6';
    default:          return '#6b7280';
  }
}

export function HudRing({ electricityPrice, carbonIntensity, trainingStatus }: HudRingProps) {
  const color = getStatusColor(trainingStatus, electricityPrice);
  const label = getStatusLabel(trainingStatus, electricityPrice);

  // Rotation speed: calm = 30s, stressed = 8s
  const stressFactor = Math.min(Math.max((electricityPrice - 30) / 40, 0), 1);
  const outerDuration = useMemo(() => Math.max(30 - stressFactor * 22, 8), [stressFactor]);
  const middleDuration = useMemo(() => Math.max(22 - stressFactor * 14, 6), [stressFactor]);

  // Health score: 100 when clean + cheap, 0 when dirty + expensive
  const priceScore = Math.max(0, 1 - electricityPrice / 80);
  const carbonScore = Math.max(0, 1 - carbonIntensity / 600);
  const healthScore = Math.round((priceScore * 0.6 + carbonScore * 0.4) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-20 hidden lg:flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-300">
      <svg
        viewBox="0 0 140 140"
        className="w-[130px] h-[130px]"
        aria-label="System status ring"
      >
        <defs>
          <filter id="hud-glow">
            <feGaussianBlur stdDeviation="2" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring — dashed, rotates clockwise */}
        <g filter="url(#hud-glow)">
          <circle
            cx="70"
            cy="70"
            r="65"
            fill="none"
            stroke={color}
            strokeWidth="1"
            strokeDasharray="6 4 2 4"
            opacity="0.5"
            style={{
              transformOrigin: '70px 70px',
              animation: `spin ${outerDuration}s linear infinite`,
            }}
          />
        </g>

        {/* Middle ring — dotted, rotates counter-clockwise */}
        <circle
          cx="70"
          cy="70"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeDasharray="2 6"
          opacity="0.4"
          style={{
            transformOrigin: '70px 70px',
            animation: `spin ${middleDuration}s linear infinite reverse`,
          }}
        />

        {/* Inner ring — solid */}
        <circle
          cx="70"
          cy="70"
          r="43"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Tick marks on outer ring */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 70 + Math.cos(angle) * 60;
          const y1 = 70 + Math.sin(angle) * 60;
          const x2 = 70 + Math.cos(angle) * 63;
          const y2 = 70 + Math.sin(angle) * 63;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="1"
              opacity="0.5"
            />
          );
        })}

        {/* Health score arc */}
        <circle
          cx="70"
          cy="70"
          r="48"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.7"
          strokeDasharray={`${healthScore * 3.01} ${301 - healthScore * 3.01}`}
          strokeDashoffset="75"
          style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.8s ease' }}
        />

        {/* Center text */}
        <text
          x="70"
          y="60"
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontFamily="Space Grotesk, Inter, sans-serif"
          fontWeight="700"
          letterSpacing="1.5"
          opacity="0.9"
        >
          {label.line1}
        </text>
        <text
          x="70"
          y="73"
          textAnchor="middle"
          fill={color}
          fontSize="9"
          fontFamily="Space Grotesk, Inter, sans-serif"
          fontWeight="600"
          letterSpacing="1"
          opacity="0.7"
        >
          {label.line2}
        </text>

        {/* Health score number */}
        <text
          x="70"
          y="92"
          textAnchor="middle"
          fill={color}
          fontSize="14"
          fontFamily="SF Mono, Fira Code, monospace"
          fontWeight="700"
          opacity="0.9"
        >
          {healthScore}
        </text>
        <text
          x="70"
          y="101"
          textAnchor="middle"
          fill={color}
          fontSize="7"
          fontFamily="Inter, sans-serif"
          fontWeight="500"
          letterSpacing="1.5"
          opacity="0.5"
        >
          HEALTH
        </text>
      </svg>
    </div>
  );
}
