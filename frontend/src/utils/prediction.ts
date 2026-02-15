/**
 * Simple EMA-based price prediction engine.
 *
 * Uses exponential smoothing + trend extraction to forecast the next N
 * steps, and optionally identifies the most likely "spike" in the
 * prediction window.
 */

/* ── Public types ─────────────────────────────────────────────────── */

export interface PredictedPoint {
  time: string;             // formatted "HH:MM:SS"
  predicted_price: number;
}

export interface PredictionResult {
  points: PredictedPoint[];
  spikeIndex: number | null;   // index into `points` with highest predicted price
  spikeTime: string | null;
  spikePrice: number | null;
  trend: 'rising' | 'falling' | 'stable';
  confidence: number;          // 0 → 1
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function exponentialSmooth(data: number[], alpha: number): number[] {
  if (data.length === 0) return [];
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Deterministic-ish "noise" so the curve doesn't look like a ruler.
 * Uses a simple sine-mix rather than Math.random() (keeps chart
 * stable between renders with the same data length).
 */
function pseudoNoise(step: number, seed: number): number {
  return (
    Math.sin(step * 1.7 + seed * 0.3) * 0.7 +
    Math.sin(step * 0.9 + seed * 1.1) * 0.5
  );
}

/* ── Main prediction function ─────────────────────────────────────── */

const PREDICTION_STEPS = 15;    // ~30 s into the future (2 s intervals)
const ALPHA = 0.35;             // EMA smoothing factor

/**
 * Predicts future electricity prices based on historical data.
 *
 * @param prices  Array of recent raw electricity prices (chronological)
 * @param lastTimestamp  ISO or HH:MM:SS timestamp of the last real point
 * @param steps  Number of steps to predict (default 15)
 */
export function predictPrices(
  prices: number[],
  lastTimestamp: string,
  steps: number = PREDICTION_STEPS,
): PredictionResult {
  const empty: PredictionResult = {
    points: [],
    spikeIndex: null,
    spikeTime: null,
    spikePrice: null,
    trend: 'stable',
    confidence: 0,
  };

  if (prices.length < 5) return empty;

  // ── 1. Smooth history ────────────────────────────────────────────
  const smoothed = exponentialSmooth(prices, ALPHA);
  const last = smoothed[smoothed.length - 1];

  // ── 2. Extract trend (avg of last 10 deltas) ────────────────────
  const windowSize = Math.min(10, smoothed.length - 1);
  let trendSum = 0;
  for (let i = smoothed.length - windowSize; i < smoothed.length; i++) {
    trendSum += smoothed[i] - smoothed[i - 1];
  }
  const avgTrend = trendSum / windowSize;

  // ── 3. Detect volatility for noise scaling ──────────────────────
  const recentPrices = prices.slice(-20);
  const vol = stddev(recentPrices);
  const noiseScale = Math.min(vol * 0.25, 3);

  // ── 4. Generate future points ───────────────────────────────────
  const predicted: PredictedPoint[] = [];
  let current = last;
  const seed = prices.length; // stable seed based on data length

  for (let i = 1; i <= steps; i++) {
    // Dampened trend
    const dampening = Math.exp(-i * 0.06);
    current += avgTrend * dampening;

    // Cyclical pattern (market oscillation feel)
    current += Math.sin(i * 0.35) * 1.0;

    // Deterministic noise
    current += pseudoNoise(i, seed) * noiseScale;

    // Clamp to reasonable bounds
    current = Math.max(8, Math.min(120, current));

    // Time label: increment from last timestamp by 2s per step
    const timeLabel = offsetTime(lastTimestamp, i * 2);

    predicted.push({
      time: timeLabel,
      predicted_price: Math.round(current * 100) / 100,
    });
  }

  // ── 5. Find spike ──────────────────────────────────────────────
  let spikeIdx: number | null = null;
  let spikeVal = -Infinity;
  for (let i = 0; i < predicted.length; i++) {
    if (predicted[i].predicted_price > spikeVal) {
      spikeVal = predicted[i].predicted_price;
      spikeIdx = i;
    }
  }

  // Only flag spike if it actually exceeds a meaningful threshold
  const maxHistory = Math.max(...prices.slice(-20));
  if (spikeVal < maxHistory * 1.05) {
    spikeIdx = null;
  }

  // ── 6. Trend classification ─────────────────────────────────────
  const trendThreshold = 0.15;
  const trend: PredictionResult['trend'] =
    avgTrend > trendThreshold ? 'rising' : avgTrend < -trendThreshold ? 'falling' : 'stable';

  // ── 7. Confidence — higher with more data, lower with high vol ─
  const dataFactor = Math.min(prices.length / 30, 1);
  const volPenalty = Math.max(0, 1 - vol / 20);
  const confidence = Math.round(dataFactor * volPenalty * 100) / 100;

  return {
    points: predicted,
    spikeIndex: spikeIdx,
    spikeTime: spikeIdx !== null ? predicted[spikeIdx].time : null,
    spikePrice: spikeIdx !== null ? predicted[spikeIdx].predicted_price : null,
    trend,
    confidence,
  };
}

/* ── Time offset helper ───────────────────────────────────────────── */

function offsetTime(timeStr: string, addSeconds: number): string {
  // Parse HH:MM:SS (the "time" field from chart data points)
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  let hours = parseInt(parts[0], 10) || 0;
  let minutes = parseInt(parts[1], 10) || 0;
  let seconds = parseInt(parts[2] || '0', 10) || 0;

  seconds += addSeconds;

  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60);
    seconds %= 60;
  }
  if (minutes >= 60) {
    hours += Math.floor(minutes / 60);
    minutes %= 60;
  }
  hours %= 24;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

/* ── Market insight derivations ───────────────────────────────────── */

export interface MarketInsight {
  gridStability: number;          // 0-100 %
  agentMode: string;              // label
  agentModeColor: string;         // tailwind color key
  nextRenewablePeak: string;      // e.g. "~4 h"
  predictedSavings24h: number;    // $
  riskLevel: 'low' | 'moderate' | 'high';
}

export function deriveMarketInsights(
  prices: number[],
  carbonIntensity: number,
  costSaved: number,
  prediction: PredictionResult,
): MarketInsight {
  // Grid stability — inverse of volatility scaled 0-100
  const vol = stddev(prices.slice(-30));
  const gridStability = Math.round(Math.max(0, Math.min(100, 100 - vol * 4)));

  // Agent mode
  let agentMode = 'Balanced';
  let agentModeColor = 'blue';
  if (prediction.trend === 'rising' && prediction.spikePrice && prediction.spikePrice > 50) {
    agentMode = 'Safe Throttle';
    agentModeColor = 'amber';
  } else if (prediction.trend === 'falling') {
    agentMode = 'Max Performance';
    agentModeColor = 'emerald';
  } else if (prices.length > 0 && prices[prices.length - 1] > 50) {
    agentMode = 'Crisis Pause';
    agentModeColor = 'red';
  }

  // Next renewable peak — simulated from carbon intensity trend
  const hoursUntilRenewable = carbonIntensity < 300 ? 0 : Math.round(2 + (carbonIntensity - 300) / 80);
  const nextRenewablePeak =
    hoursUntilRenewable === 0
      ? 'Now'
      : hoursUntilRenewable === 1
      ? '~1 h'
      : `~${hoursUntilRenewable} h`;

  // 24h predicted savings — extrapolate from current rate
  const dataSeconds = prices.length * 2; // 2s per data point
  const rate = dataSeconds > 0 ? costSaved / dataSeconds : 0;
  const predictedSavings24h = Math.round(rate * 86400 * 100) / 100;

  // Risk level
  const maxPredicted = prediction.spikePrice ?? 0;
  const riskLevel: MarketInsight['riskLevel'] =
    maxPredicted > 60 ? 'high' : maxPredicted > 45 ? 'moderate' : 'low';

  return {
    gridStability,
    agentMode,
    agentModeColor,
    nextRenewablePeak,
    predictedSavings24h,
    riskLevel,
  };
}
