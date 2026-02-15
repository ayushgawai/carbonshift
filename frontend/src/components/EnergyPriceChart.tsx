import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Brain } from 'lucide-react';
import type { ChartDataPoint } from '../types';
import { predictPrices } from '../utils/prediction';

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */

interface EnergyPriceChartProps {
  data: ChartDataPoint[];
}

interface CombinedPoint {
  time: string;
  electricity_price?: number;
  predicted_price?: number;
}

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

interface StressZone {
  x1: string;
  x2: string;
}

/* ═══════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════ */

const PAUSE_THRESHOLD = 50;

const TIME_RANGES = [
  { label: '1D', active: true },
  { label: '5D', active: false },
  { label: '1M', active: false },
  { label: '3M', active: false },
  { label: '1Y', active: false },
] as const;

/* ═══════════════════════════════════════════════════════════════════
   Stress zone computation
   ═══════════════════════════════════════════════════════════════════ */

function computeStressZones(data: ChartDataPoint[]): StressZone[] {
  const zones: StressZone[] = [];
  let start: string | null = null;

  for (let idx = 0; idx < data.length; idx++) {
    const point = data[idx];
    if (point.electricity_price > PAUSE_THRESHOLD) {
      if (!start) start = point.time;
    } else {
      if (start) {
        const prev = idx - 1;
        zones.push({ x1: start, x2: data[prev >= 0 ? prev : 0].time });
        start = null;
      }
    }
  }

  if (start && data.length > 0) {
    zones.push({ x1: start, x2: data[data.length - 1].time });
  }

  return zones;
}

/* ═══════════════════════════════════════════════════════════════════
   Custom Tooltip
   ═══════════════════════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const realEntry = payload.find((p) => p.dataKey === 'electricity_price');
  const predEntry = payload.find((p) => p.dataKey === 'predicted_price');

  const price = realEntry?.value ?? predEntry?.value;
  if (price === undefined) return null;

  const isPredicted = !realEntry && !!predEntry;
  const isStressed = price > PAUSE_THRESHOLD;

  return (
    <div
      className={`backdrop-blur-md rounded-lg shadow-lg border px-3 py-2 text-left ${
        isPredicted
          ? 'bg-violet-50/95 border-violet-200'
          : isStressed
          ? 'bg-red-50/95 border-red-200'
          : 'bg-white/95 border-gray-200'
      }`}
    >
      <p className="text-[12px] text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-bold font-mono ${
        isPredicted ? 'text-violet-600' : isStressed ? 'text-red-500' : 'text-gray-900'
      }`}>
        ${price.toFixed(2)}
        <span className="text-gray-400 font-normal text-xs ml-1">/MWh</span>
      </p>
      {isPredicted && (
        <p className="text-[11px] font-medium text-violet-500 mt-0.5 flex items-center gap-1">
          <Brain className="w-3 h-3" /> AI Prediction
        </p>
      )}
      {isStressed && !isPredicted && (
        <p className="text-[11px] font-semibold text-red-500 mt-0.5 uppercase tracking-wide">
          Grid Stress
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Spike Label
   ═══════════════════════════════════════════════════════════════════ */

interface SpikeLabelProps {
  viewBox?: { x: number; y: number };
  spikeTime: string;
}

function SpikeLabel({ viewBox, spikeTime }: SpikeLabelProps) {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g>
      <rect
        x={x - 62}
        y={y - 30}
        width={124}
        height={20}
        rx={6}
        fill="rgba(139,92,246,0.85)"
        stroke="rgba(139,92,246,0.5)"
        strokeWidth={1}
      />
      <text
        x={x}
        y={y - 17}
        textAnchor="middle"
        fill="#fff"
        fontSize={9}
        fontWeight={700}
        fontFamily="'Space Grotesk', sans-serif"
      >
        {`⚡ Predicted Spike at ${spikeTime.slice(0, 5)}`}
      </text>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════ */

export function EnergyPriceChart({ data }: EnergyPriceChartProps) {
  const [activeRange] = useState(0);

  const currentPrice = data.length > 0 ? data[data.length - 1].electricity_price : 0;
  const openPrice = data.length > 1 ? data[0].electricity_price : currentPrice;
  const change = currentPrice - openPrice;
  const changePercent = openPrice !== 0 ? (change / openPrice) * 100 : 0;
  const isPositive = change >= 0;

  const prediction = useMemo(() => {
    if (data.length < 5) return null;
    const prices = data.map((d) => d.electricity_price);
    const lastTime = data[data.length - 1].time;
    return predictPrices(prices, lastTime, 15);
  }, [data]);

  const { combined, predZoneStart, predZoneEnd } = useMemo(() => {
    const realPoints: CombinedPoint[] = data.map((d) => ({
      time: d.time,
      electricity_price: d.electricity_price,
    }));

    if (!prediction || prediction.points.length === 0) {
      return { combined: realPoints, predZoneStart: null, predZoneEnd: null };
    }

    const lastReal = realPoints[realPoints.length - 1];
    if (lastReal) {
      lastReal.predicted_price = lastReal.electricity_price;
    }

    const predPoints: CombinedPoint[] = prediction.points.map((p) => ({
      time: p.time,
      predicted_price: p.predicted_price,
    }));

    return {
      combined: [...realPoints, ...predPoints],
      predZoneStart: prediction.points[0].time,
      predZoneEnd: prediction.points[prediction.points.length - 1].time,
    };
  }, [data, prediction]);

  const stressZones = useMemo(() => computeStressZones(data), [data]);

  const spikePoint = prediction?.spikeIndex !== null && prediction?.spikeIndex !== undefined
    ? prediction.points[prediction.spikeIndex]
    : null;

  return (
    <div className="card flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-gray-900 tracking-tight">
                ${currentPrice.toFixed(2)}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-sm font-bold font-mono ${
                  isPositive ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {isPositive ? '+' : ''}
                {changePercent.toFixed(2)}%
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
              Energy Price &middot; $/MWh &middot; Real-time
            </p>
          </div>
        </div>

        {/* Time range pills */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-200/60">
          {TIME_RANGES.map((r, i) => (
            <button
              key={r.label}
              disabled={!r.active}
              className={`px-2.5 py-1 rounded-md text-[12px] font-bold tracking-wide transition-all ${
                i === activeRange
                  ? 'bg-blue-500 text-white shadow-sm'
                  : r.active
                  ? 'text-gray-500 hover:text-gray-700 hover:bg-white'
                  : 'text-gray-300 cursor-not-allowed opacity-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI prediction badge */}
      {prediction && (
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200">
            <Brain className="w-3 h-3 text-violet-500" />
            <span className="text-[12px] font-semibold text-violet-600">
              AI Prediction Active
            </span>
            <span className="text-[11px] text-violet-400 font-mono">
              ({Math.round(prediction.confidence * 100)}% conf)
            </span>
          </div>
          {prediction.trend !== 'stable' && (
            <div className={`flex items-center gap-1 text-[12px] font-semibold ${
              prediction.trend === 'rising' ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {prediction.trend === 'rising' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              Trend: {prediction.trend === 'rising' ? 'Rising' : 'Falling'}
            </div>
          )}
        </div>
      )}

      {/* ── Chart ───────────────────────────────────────────────── */}
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combined} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="realPriceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,0,0,0.04)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={50}
            />

            <YAxis
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(val: number) => `$${val}`}
            />

            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                stroke: 'rgba(0,0,0,0.1)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />

            {predZoneStart && predZoneEnd && (
              <ReferenceArea
                x1={predZoneStart}
                x2={predZoneEnd}
                fill="url(#predictionGradient)"
                stroke="rgba(139,92,246,0.2)"
                strokeDasharray="4 4"
                label={{
                  value: '🔮 AI FORECAST',
                  position: 'insideTopRight',
                  fill: '#7c3aed',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              />
            )}

            {stressZones.map((zone, i) => (
              <ReferenceArea
                key={`stress-${i}`}
                x1={zone.x1}
                x2={zone.x2}
                fill="#ef4444"
                fillOpacity={0.06}
                stroke="#ef4444"
                strokeOpacity={0.15}
                strokeDasharray="3 3"
                label={
                  i === stressZones.length - 1
                    ? {
                        value: 'GRID STRESS — PAUSED',
                        position: 'insideTop',
                        fill: '#dc2626',
                        fontSize: 8,
                        fontWeight: 700,
                      }
                    : undefined
                }
              />
            ))}

            <ReferenceLine
              y={PAUSE_THRESHOLD}
              stroke="#ef4444"
              strokeDasharray="8 4"
              strokeWidth={1}
              strokeOpacity={0.5}
              label={{
                value: `$${PAUSE_THRESHOLD} Threshold`,
                position: 'insideTopRight',
                fill: '#dc2626',
                fontSize: 9,
                fontWeight: 600,
              }}
            />

            <Area
              type="monotone"
              dataKey="electricity_price"
              stroke="transparent"
              fill="url(#realPriceGradient)"
              animationDuration={300}
              isAnimationActive
              connectNulls={false}
            />

            <Line
              type="monotone"
              dataKey="electricity_price"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: '#3b82f6',
                stroke: '#fff',
                strokeWidth: 2,
              }}
              animationDuration={300}
              isAnimationActive
              connectNulls={false}
            />

            <Line
              type="monotone"
              dataKey="predicted_price"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#8b5cf6',
                stroke: '#fff',
                strokeWidth: 2,
              }}
              animationDuration={300}
              isAnimationActive
              connectNulls={false}
            />

            {spikePoint && (
              <ReferenceDot
                x={spikePoint.time}
                y={spikePoint.predicted_price}
                r={5}
                fill="#8b5cf6"
                stroke="#c4b5fd"
                strokeWidth={2}
                label={<SpikeLabel spikeTime={spikePoint.time} />}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-[12px] text-gray-500">
          <span>
            Open <span className="font-mono text-gray-700">${openPrice.toFixed(2)}</span>
          </span>
          <span>
            High{' '}
            <span className="font-mono text-gray-700">
              ${data.length > 0 ? Math.max(...data.map((d) => d.electricity_price)).toFixed(2) : '0.00'}
            </span>
          </span>
          <span>
            Low{' '}
            <span className="font-mono text-gray-700">
              ${data.length > 0 ? Math.min(...data.map((d) => d.electricity_price)).toFixed(2) : '0.00'}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-blue-500 rounded-full inline-block" />
            <span className="text-gray-500">Real</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-violet-500 rounded-full inline-block"
              style={{ borderTop: '2px dashed #8b5cf6', height: 0, backgroundColor: 'transparent' }}
            />
            <span className="text-gray-500">Predicted</span>
          </span>
        </div>
      </div>
    </div>
  );
}
