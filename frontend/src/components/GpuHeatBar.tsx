interface GpuHeatBarProps {
  watts: number;
  maxWatts?: number;
}

function getHeatColor(ratio: number): string {
  if (ratio < 0.25) return '#3b82f6';
  if (ratio < 0.45) return '#06b6d4';
  if (ratio < 0.65) return '#10b981';
  if (ratio < 0.80) return '#f59e0b';
  return '#ef4444';
}

export function GpuHeatBar({ watts, maxWatts = 300 }: GpuHeatBarProps) {
  const ratio = Math.min(watts / maxWatts, 1);
  const isHot = watts > 200;
  const color = getHeatColor(ratio);

  return (
    <div className="mt-3 space-y-1">
      {/* Labels */}
      <div className="flex justify-between">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Load</span>
        <span className="text-[11px] font-mono font-bold" style={{ color }}>
          {Math.round(ratio * 100)}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isHot ? 'gpu-fire-flicker' : ''
          }`}
          style={{
            width: `${ratio * 100}%`,
            background: `linear-gradient(90deg, #3b82f6 0%, ${color} 100%)`,
          }}
        />
      </div>

      {/* Spectrum ticks */}
      <div className="flex justify-between px-0.5">
        {[0, 100, 200, 300].map((tick) => (
          <span
            key={tick}
            className="text-[10px] font-mono text-gray-300"
          >
            {tick}W
          </span>
        ))}
      </div>
    </div>
  );
}
