import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import type { ChartDataPoint } from '../types';

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */

interface ProfitChartProps {
  history: ChartDataPoint[];
  totalCostSaved: number;
}

interface ProfitBucket {
  label: string;
  profit: number;
  peakSavings: number;
  scheduleSavings: number;
}

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  payload: ProfitBucket;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════ */

const BUCKET_COUNT = 8;
const MAX_GPU_WATTS = 300;
const KWH_INTERVAL = 2 / 3600;

function buildProfitBuckets(history: ChartDataPoint[]): ProfitBucket[] {
  if (history.length < 2) return [];

  const bucketSize = Math.max(1, Math.floor(history.length / BUCKET_COUNT));
  const buckets: ProfitBucket[] = [];

  for (let i = 0; i < BUCKET_COUNT; i++) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, history.length);
    if (start >= history.length) break;

    const slice = history.slice(start, end);
    let peakSavings = 0;
    let scheduleSavings = 0;

    for (const point of slice) {
      const pricePerKwh = point.electricity_price / 1000;
      const powerDelta = MAX_GPU_WATTS - point.gpu_power_watts;

      if (point.electricity_price > 45) {
        peakSavings += powerDelta * pricePerKwh * KWH_INTERVAL;
      }

      scheduleSavings += Math.max(0, powerDelta * pricePerKwh * KWH_INTERVAL * 0.3);
    }

    const startTime = slice[0].time.slice(0, 5);

    buckets.push({
      label: startTime,
      profit: Math.round((peakSavings + scheduleSavings) * 100) / 100,
      peakSavings: Math.round(peakSavings * 100) / 100,
      scheduleSavings: Math.round(scheduleSavings * 100) / 100,
    });
  }

  return buckets;
}

function getBarColor(profit: number, maxProfit: number): string {
  const ratio = maxProfit > 0 ? profit / maxProfit : 0;
  if (ratio > 0.75) return '#10b981';
  if (ratio > 0.45) return '#3b82f6';
  if (ratio > 0.2)  return '#6366f1';
  return '#8b5cf6';
}

/* ═══════════════════════════════════════════════════════════════════
   Custom Tooltip
   ═══════════════════════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 px-3 py-2 text-left">
      <p className="text-[12px] text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold font-mono text-emerald-600">
        +${data.profit.toFixed(2)}
      </p>
      <div className="mt-1 space-y-0.5">
        <p className="text-[11px] text-gray-500">
          Peak Avoidance:{' '}
          <span className="font-mono text-gray-700">${data.peakSavings.toFixed(2)}</span>
        </p>
        <p className="text-[11px] text-gray-500">
          Smart Scheduling:{' '}
          <span className="font-mono text-gray-700">${data.scheduleSavings.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════ */

export function ProfitChart({ history, totalCostSaved }: ProfitChartProps) {
  const buckets = useMemo(() => buildProfitBuckets(history), [history]);
  const maxProfit = useMemo(
    () => Math.max(...buckets.map((b) => b.profit), 0.01),
    [buckets],
  );
  const sessionProfit = useMemo(
    () => buckets.reduce((sum, b) => sum + b.profit, 0),
    [buckets],
  );

  const growthPercent =
    totalCostSaved > 0.01
      ? Math.round((sessionProfit / totalCostSaved) * 100)
      : 0;

  return (
    <div className="card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 font-heading tracking-wide">
              Company Profit
            </h3>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Real-time savings — efficiency that pays for itself
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums">
              ${totalCostSaved.toFixed(2)}
            </span>
            {growthPercent > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 text-[12px] font-bold text-emerald-600">
                <ArrowUpRight className="w-3 h-3" />
                {growthPercent}%
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Total Saved</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 sm:h-48">
        {buckets.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={buckets}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,0,0,0.04)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => `$${val.toFixed(2)}`}
              />

              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              />

              <Bar
                dataKey="profit"
                radius={[4, 4, 0, 0]}
                animationDuration={400}
                isAnimationActive
              >
                {buckets.map((bucket, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={getBarColor(bucket.profit, maxProfit)}
                    style={{
                      filter:
                        bucket.profit === maxProfit
                          ? 'drop-shadow(0 0 6px rgba(16,185,129,0.4))'
                          : undefined,
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-400">Collecting data…</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
            Peak Avoidance
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />
            Smart Scheduling
          </span>
        </div>
        <span className="text-[11px] text-gray-400 font-mono">
          {buckets.length} intervals
        </span>
      </div>
    </div>
  );
}
