import { useMemo } from 'react';
import { ShieldCheck, Zap, TrendingDown } from 'lucide-react';
import type { ChartDataPoint } from '../types';

/* ═══════════════════════════════════════════════════════════════════
   Peaks Timeline — vertical timeline of price spikes dodged
   ═══════════════════════════════════════════════════════════════════ */

interface PeaksTimelineProps {
  history: ChartDataPoint[];
  peaksAvoided: number;
}

interface TimelineEvent {
  id: string;
  time: string;
  price: number;
  type: 'spike_dodged' | 'throttle' | 'resume';
  label: string;
}

export function PeaksTimeline({ history, peaksAvoided }: PeaksTimelineProps) {
  const events = useMemo<TimelineEvent[]>(() => {
    const result: TimelineEvent[] = [];
    const threshold = 50;

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];

      if (prev.electricity_price <= threshold && curr.electricity_price > threshold) {
        result.push({
          id: `spike-${i}`,
          time: curr.time,
          price: curr.electricity_price,
          type: 'spike_dodged',
          label: `Spike dodged — $${curr.electricity_price.toFixed(1)}/MWh`,
        });
      } else if (prev.electricity_price > threshold && curr.electricity_price <= threshold) {
        result.push({
          id: `resume-${i}`,
          time: curr.time,
          price: curr.electricity_price,
          type: 'resume',
          label: `Grid stable — $${curr.electricity_price.toFixed(1)}/MWh`,
        });
      }

      if (
        curr.electricity_price > threshold &&
        curr.gpu_power_watts < prev.gpu_power_watts - 20
      ) {
        result.push({
          id: `throttle-${i}`,
          time: curr.time,
          price: curr.electricity_price,
          type: 'throttle',
          label: `GPU throttled to ${Math.round(curr.gpu_power_watts)}W`,
        });
      }
    }

    return result.slice(-8).reverse();
  }, [history]);

  const iconMap = {
    spike_dodged: <ShieldCheck className="w-3 h-3" />,
    throttle: <TrendingDown className="w-3 h-3" />,
    resume: <Zap className="w-3 h-3" />,
  };

  const colorMap = {
    spike_dodged: 'text-red-500 bg-red-50 border-red-200',
    throttle: 'text-amber-500 bg-amber-50 border-amber-200',
    resume: 'text-emerald-500 bg-emerald-50 border-emerald-200',
  };

  const lineColor = {
    spike_dodged: 'bg-red-200',
    throttle: 'bg-amber-200',
    resume: 'bg-emerald-200',
  };

  return (
    <div className="card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
          <h3 className="text-[12px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
            Peak Events
          </h3>
        </div>
        <span className="text-xs font-bold font-mono text-emerald-600 tabular-nums">
          {peaksAvoided} dodged
        </span>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <p className="text-[11px] text-gray-400 italic">
            No peak events yet — monitoring grid...
          </p>
        </div>
      ) : (
        <div className="relative flex-1">
          {events.map((evt, idx) => (
            <div key={evt.id} className="flex gap-3 mb-3 last:mb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full border ${colorMap[evt.type]}`}
                >
                  {iconMap[evt.type]}
                </div>
                {idx < events.length - 1 && (
                  <div className={`w-px flex-1 min-h-[16px] ${lineColor[evt.type]}`} />
                )}
              </div>

              <div className="flex-1 pb-1">
                <p className="text-[11px] text-gray-600 leading-snug">
                  {evt.label}
                </p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {evt.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
