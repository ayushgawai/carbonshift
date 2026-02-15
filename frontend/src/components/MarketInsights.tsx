import {
  Shield,
  Zap,
  Sun,
  TrendingUp,
  AlertTriangle,
  Brain,
} from 'lucide-react';
import type { MarketInsight } from '../utils/prediction';

/* ═══════════════════════════════════════════════════════════════════
   Market Insights — borsa-style side panel (light bento style)
   ═══════════════════════════════════════════════════════════════════ */

interface MarketInsightsProps {
  insight: MarketInsight;
  currentPrice: number;
}

/* ── Risk badge ───────────────────────────────────────────────────── */

function RiskBadge({ level }: { level: MarketInsight['riskLevel'] }) {
  const cfg = {
    low:      { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Low Risk' },
    moderate: { bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Moderate' },
    high:     { bg: 'bg-red-50',     text: 'text-red-600',     label: 'High Risk' },
  }[level];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      {level === 'high' && <AlertTriangle className="w-2.5 h-2.5" />}
      {cfg.label}
    </span>
  );
}

/* ── Row component ────────────────────────────────────────────────── */

interface InsightRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}

function InsightRow({ icon, label, value, sub }: InsightRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 group">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-50 text-gray-400 group-hover:text-gray-600 transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-[13px] text-gray-500 leading-tight">{label}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="text-right">{value}</div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────── */

export function MarketInsights({ insight, currentPrice }: MarketInsightsProps) {
  const agentColorMap: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber:   'text-amber-600 bg-amber-50',
    red:     'text-red-600 bg-red-50',
    blue:    'text-blue-600 bg-blue-50',
  };
  const agentStyle = agentColorMap[insight.agentModeColor] ?? agentColorMap.blue;

  return (
    <div className="card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500/60" />
          <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
            Market Insights
          </h3>
        </div>
        <RiskBadge level={insight.riskLevel} />
      </div>

      <p className="text-[12px] text-gray-400 mb-3">
        AI-driven grid intelligence &amp; forecast
      </p>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Rows */}
      <div className="divide-y divide-gray-100 flex-1">
        {/* Grid Stability */}
        <InsightRow
          icon={<Shield className="w-3.5 h-3.5" />}
          label="Grid Stability"
          value={
            <div className="flex items-center gap-2">
              <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${insight.gridStability}%`,
                    background:
                      insight.gridStability > 70
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : insight.gridStability > 40
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                  }}
                />
              </div>
              <span className="text-sm font-bold font-mono text-gray-800 tabular-nums">
                {insight.gridStability}%
              </span>
            </div>
          }
        />

        {/* Agent Mode */}
        <InsightRow
          icon={<Brain className="w-3.5 h-3.5" />}
          label="Agent Mode"
          sub="Autonomous decision"
          value={
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[12px] font-bold ${agentStyle}`}>
              <Zap className="w-2.5 h-2.5" />
              {insight.agentMode}
            </span>
          }
        />

        {/* Next Renewable Peak */}
        <InsightRow
          icon={<Sun className="w-3.5 h-3.5" />}
          label="Next Renewable Peak"
          sub="Solar + Wind window"
          value={
            <span className={`text-sm font-bold font-mono ${
              insight.nextRenewablePeak === 'Now' ? 'text-emerald-600' : 'text-gray-500'
            }`}>
              {insight.nextRenewablePeak}
            </span>
          }
        />

        {/* Predicted 24h Savings */}
        <InsightRow
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Predicted Savings (24h)"
          sub="Extrapolated from current rate"
          value={
            <span className="text-sm font-bold font-mono text-emerald-600 tabular-nums">
              ${insight.predictedSavings24h.toFixed(2)}
            </span>
          }
        />

        {/* Current Spot Price */}
        <InsightRow
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Spot Price"
          value={
            <span className={`text-sm font-bold font-mono tabular-nums ${
              currentPrice > 50 ? 'text-red-500' : 'text-blue-600'
            }`}>
              ${currentPrice.toFixed(2)}
            </span>
          }
        />
      </div>
    </div>
  );
}
