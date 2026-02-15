import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import type { MetricCardProps } from '../types';

const colorMap: Record<string, { accent: string; icon: string }> = {
  blue:   { accent: 'text-blue-600',    icon: 'text-blue-500/60' },
  green:  { accent: 'text-emerald-600', icon: 'text-emerald-500/60' },
  orange: { accent: 'text-orange-600',  icon: 'text-orange-500/60' },
  red:    { accent: 'text-red-600',     icon: 'text-red-500/60' },
  yellow: { accent: 'text-amber-600',   icon: 'text-amber-500/60' },
};

interface ExtendedMetricCardProps extends MetricCardProps {
  danger?: boolean;
  children?: ReactNode;
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  color,
  pulse,
  danger,
  children,
}: ExtendedMetricCardProps) {
  const [isPulsing, setIsPulsing] = useState(false);
  const [isValueFlashing, setIsValueFlashing] = useState(false);
  const prevValueRef = useRef(value);
  const cardRef = useRef<HTMLDivElement>(null);
  const style = colorMap[color] || colorMap.blue;

  useEffect(() => {
    if (pulse && prevValueRef.current !== value) {
      setIsPulsing(true);
      setIsValueFlashing(true);
      const t1 = setTimeout(() => setIsPulsing(false), 500);
      const t2 = setTimeout(() => setIsValueFlashing(false), 500);
      prevValueRef.current = value;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [value, pulse]);

  // 3D tilt on mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.01)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.transform = '';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`card group relative ${
        isPulsing ? 'metric-pulse' : ''
      } ${danger ? 'neon-breathe-red' : ''}`}
    >
      {/* Border beam */}
      <div className="card-gradient-border" />

      {/* Hover glow accent */}
      <div
        className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-[1]"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08), transparent 70%)',
        }}
      />

      <div className="relative z-[1]">
        {/* Label row */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-[0.15em]">{title}</p>
          <div className={`${style.icon} opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110`}>
            {icon}
          </div>
        </div>

        {/* Value — large monospace */}
        <div className="flex items-baseline gap-2">
          <span
            className={`text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-gray-900 ${
              isValueFlashing ? 'value-flash' : ''
            }`}
          >
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-gray-400">{unit}</span>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
