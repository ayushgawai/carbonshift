import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Sun, Wind, Flame } from 'lucide-react';

interface EnergySourceMixProps {
  carbonIntensity: number; // gCO2/kWh
}

interface SourceData {
  name: string;
  value: number;
  color: string;
  icon: typeof Sun;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { color: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

/**
 * Simulate an energy source mix based on carbon_intensity.
 * Low intensity → high renewable share.
 * High intensity → high fossil share.
 *
 *  Carbon intensity ranges:
 *    < 100 gCO2/kWh  →  ~80% renewables
 *    100-300          →  ~50% renewables
 *    > 400            →  ~20% renewables
 */
function simulateMix(intensity: number): SourceData[] {
  // Normalize intensity to 0-1 where 0 = clean, 1 = dirty
  const t = Math.min(Math.max((intensity - 50) / 500, 0), 1);

  const fossil = Math.round(15 + t * 65);            // 15-80%
  const remaining = 100 - fossil;
  const solar  = Math.round(remaining * 0.55);        // slightly more solar than wind
  const wind   = remaining - solar;

  return [
    { name: 'Solar',  value: solar,  color: '#facc15', icon: Sun },
    { name: 'Wind',   value: wind,   color: '#38bdf8', icon: Wind },
    { name: 'Fossil', value: fossil, color: '#6b7280', icon: Flame },
  ];
}

function CustomMixTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-3 py-1.5">
      <p className="text-xs font-semibold" style={{ color: d.payload.color }}>
        {d.name}: {d.value}%
      </p>
    </div>
  );
}

export function EnergySourceMix({ carbonIntensity }: EnergySourceMixProps) {
  const sources = useMemo(() => simulateMix(carbonIntensity), [carbonIntensity]);
  const renewablePercent = sources[0].value + sources[1].value;

  return (
    <div className="card flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100/80 backdrop-blur-sm text-amber-600">
          <Sun className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Energy Source Mix</h3>
          <p className="text-xs text-gray-400">Simulated from grid carbon data</p>
        </div>
      </div>

      {/* Donut */}
      <div className="relative w-36 h-36 sm:w-40 sm:h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sources}
              cx="50%"
              cy="50%"
              innerRadius="62%"
              outerRadius="88%"
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              animationDuration={400}
            >
              {sources.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomMixTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-gray-900 tabular-nums">{renewablePercent}%</span>
          <span className="text-[12px] font-medium text-gray-400 uppercase tracking-wider">Renewable</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        {sources.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.name} className="flex items-center gap-1">
              <Icon className="w-3 h-3" style={{ color: s.color }} />
              <span className="text-[12px] font-medium text-gray-500">
                {s.name} {s.value}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
