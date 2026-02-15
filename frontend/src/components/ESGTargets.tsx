import { useState, useMemo } from 'react';
import {
  Target,
  Leaf,
  DollarSign,
  Sun,
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════ */

interface ESGTargetsProps {
  carbonSaved: number;
  costSaved: number;
  carbonIntensity: number;
  trainingProgress: number;
}

interface TargetData {
  id: string;
  label: string;
  icon: React.ReactNode;
  current: number;
  target: number;
  unit: string;
  color: string;
  strokeColor: string;
  glowColor: string;
  isAhead: boolean;
  etaDays: number;
}

/* ═══════════════════════════════════════════════════════════════════
   SVG Progress Ring
   ═══════════════════════════════════════════════════════════════════ */

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  strokeColor: string;
  glowColor: string;
  children?: React.ReactNode;
}

function ProgressRing({
  progress,
  size,
  strokeWidth,
  strokeColor,
  glowColor,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const offset = circumference * (1 - clampedProgress / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <filter id={`ring-glow-${strokeColor.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={`url(#ring-glow-${strokeColor.replace('#', '')})`}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 6px ${glowColor})`,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Target Card
   ═══════════════════════════════════════════════════════════════════ */

interface TargetCardProps {
  target: TargetData;
  adjustedProgress?: number;
  adjustedEta?: number;
}

function TargetCard({ target, adjustedProgress, adjustedEta }: TargetCardProps) {
  const progress = Math.min((target.current / target.target) * 100, 100);
  const displayProgress = adjustedProgress ?? progress;
  const displayEta = adjustedEta ?? target.etaDays;

  return (
    <div className="card flex items-center gap-3 p-3 group">
      <ProgressRing
        progress={displayProgress}
        size={56}
        strokeWidth={5}
        strokeColor={target.strokeColor}
        glowColor={target.glowColor}
      >
        <span className="text-[13px] font-bold font-mono text-gray-800 tabular-nums">
          {Math.round(displayProgress)}%
        </span>
      </ProgressRing>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center justify-center w-4 h-4 rounded bg-gray-50 ${
            target.color === 'emerald' ? 'text-emerald-500' :
            target.color === 'blue' ? 'text-blue-500' :
            'text-amber-500'
          }`}>
            {target.icon}
          </div>
          <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider truncate">
            {target.label}
          </span>
          {target.isAhead && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 ml-auto shrink-0">
              <CheckCircle2 className="w-2 h-2 text-emerald-500" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Ahead</span>
            </span>
          )}
        </div>

        <p className="text-[12px] font-mono text-gray-500 tabular-nums mt-1">
          <span className="text-gray-800 font-bold">
            {target.unit === '$'
              ? `$${target.current.toFixed(2)}`
              : target.unit === '%'
              ? `${Math.round(target.current)}%`
              : `${target.current.toFixed(1)} kg`}
          </span>
          <span className="text-gray-300 mx-0.5">/</span>
          <span className="text-gray-400">
            {target.unit === '$'
              ? `$${target.target}`
              : target.unit === '%'
              ? `${target.target}%`
              : `${target.target} kg`}
          </span>
          <span className="text-gray-400 ml-2">ETA</span>{' '}
          <span className={`font-bold ${
            displayEta <= 15 ? 'text-emerald-500' : displayEta <= 30 ? 'text-amber-500' : 'text-red-500'
          }`}>
            {displayEta <= 0 ? 'Done' : `${Math.round(displayEta)}d`}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   What-If Simulator
   ═══════════════════════════════════════════════════════════════════ */

interface WhatIfProps {
  intensity: number;
  onChange: (val: number) => void;
  baseTargets: TargetData[];
}

function WhatIfSimulator({ intensity, onChange, baseTargets }: WhatIfProps) {
  const adjustments = useMemo(() => {
    return baseTargets.map((t) => {
      const baseProgress = Math.min((t.current / t.target) * 100, 100);
      let factor: number;
      let etaFactor: number;

      if (t.id === 'carbon') {
        factor = 1.15 - (intensity - 1) * 0.25;
        etaFactor = 1 / factor;
      } else if (t.id === 'budget') {
        factor = 0.85 + (intensity - 1) * 0.2;
        etaFactor = 1 / factor;
      } else {
        factor = 1;
        etaFactor = 1;
      }

      const adjustedProgress = Math.min(baseProgress * factor, 100);
      const adjustedEta = Math.max(t.etaDays * etaFactor, 0);

      return {
        id: t.id,
        adjustedProgress,
        adjustedEta,
        deltaProgress: adjustedProgress - baseProgress,
        deltaEta: adjustedEta - t.etaDays,
      };
    });
  }, [intensity, baseTargets]);

  return (
    <div className="card p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
            What-If
          </span>
        </div>
        <span className="text-xs font-bold font-mono text-violet-600 tabular-nums">
          {intensity.toFixed(1)}x
        </span>
      </div>

      <div className="mb-3">
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={intensity}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="whatif-slider w-full"
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-gray-400 font-mono">0.5x</span>
          <span className="text-[9px] text-gray-400 font-mono">1.0x</span>
          <span className="text-[9px] text-gray-400 font-mono">2.0x</span>
        </div>
      </div>

      <div className="space-y-1.5 flex-1">
        {adjustments
          .filter((a) => a.id !== 'renewable')
          .map((a) => {
            const target = baseTargets.find((t) => t.id === a.id);
            if (!target) return null;
            const isImproved = a.deltaEta < -0.5;
            const isWorse = a.deltaEta > 0.5;

            return (
              <div
                key={a.id}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-1.5">
                  {a.id === 'carbon' ? (
                    <Leaf className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <DollarSign className="w-3 h-3 text-blue-500" />
                  )}
                  <span className="text-[12px] text-gray-500">
                    {a.id === 'carbon' ? 'Carbon' : 'Budget'} ETA
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-mono text-gray-400 tabular-nums">
                    {Math.round(target.etaDays)}d
                  </span>
                  <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
                  <span
                    className={`text-[12px] font-mono font-bold tabular-nums ${
                      isImproved
                        ? 'text-emerald-500'
                        : isWorse
                        ? 'text-red-500'
                        : 'text-gray-600'
                    }`}
                  >
                    {Math.round(a.adjustedEta)}d
                  </span>
                  {isImproved && <TrendingDown className="w-2.5 h-2.5 text-emerald-500" />}
                  {isWorse && <TrendingUp className="w-2.5 h-2.5 text-red-500" />}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main ESG Targets Component
   ═══════════════════════════════════════════════════════════════════ */

export function ESGTargets({
  carbonSaved,
  costSaved,
  carbonIntensity,
  trainingProgress,
}: ESGTargetsProps) {
  const [intensity, setIntensity] = useState(1.0);

  const targets = useMemo<TargetData[]>(() => {
    const CARBON_TARGET = 500;
    const BUDGET_TARGET = 1000;
    const RENEWABLE_TARGET = 80;

    const renewablePercent = Math.min(
      100,
      Math.max(0, 100 - (carbonIntensity / 800) * 100),
    );

    const timeFraction = Math.max(trainingProgress / 100, 0.01);

    const carbonProgress = carbonSaved / CARBON_TARGET;
    const budgetProgress = costSaved / BUDGET_TARGET;
    const renewableProgress = renewablePercent / RENEWABLE_TARGET;

    const carbonAhead = carbonProgress > timeFraction * 1.1;
    const budgetAhead = budgetProgress > timeFraction * 1.1;
    const renewableAhead = renewableProgress > 1.0;

    const projectDays = 30;
    const elapsedDays = timeFraction * projectDays;
    const carbonRate = elapsedDays > 0 ? carbonSaved / elapsedDays : 0;
    const budgetRate = elapsedDays > 0 ? costSaved / elapsedDays : 0;

    const carbonEta =
      carbonRate > 0
        ? Math.max(0, (CARBON_TARGET - carbonSaved) / carbonRate)
        : 999;
    const budgetEta =
      budgetRate > 0
        ? Math.max(0, (BUDGET_TARGET - costSaved) / budgetRate)
        : 999;
    const renewableEta = renewablePercent >= RENEWABLE_TARGET ? 0 : 7;

    return [
      {
        id: 'carbon',
        label: 'Carbon Neutrality',
        icon: <Leaf className="w-3 h-3" />,
        current: carbonSaved,
        target: CARBON_TARGET,
        unit: 'kg',
        color: 'emerald',
        strokeColor: '#10b981',
        glowColor: 'rgba(16,185,129,0.4)',
        isAhead: carbonAhead,
        etaDays: Math.min(carbonEta, 365),
      },
      {
        id: 'budget',
        label: 'Energy Budget',
        icon: <DollarSign className="w-3 h-3" />,
        current: costSaved,
        target: BUDGET_TARGET,
        unit: '$',
        color: 'blue',
        strokeColor: '#3b82f6',
        glowColor: 'rgba(59,130,246,0.4)',
        isAhead: budgetAhead,
        etaDays: Math.min(budgetEta, 365),
      },
      {
        id: 'renewable',
        label: 'Renewable Mix',
        icon: <Sun className="w-3 h-3" />,
        current: renewablePercent,
        target: RENEWABLE_TARGET,
        unit: '%',
        color: 'amber',
        strokeColor: '#f59e0b',
        glowColor: 'rgba(245,158,11,0.4)',
        isAhead: renewableAhead,
        etaDays: renewableEta,
      },
    ];
  }, [carbonSaved, costSaved, carbonIntensity, trainingProgress]);

  const adjustedValues = useMemo(() => {
    if (intensity === 1.0) return null;

    return targets.map((t) => {
      const baseProgress = Math.min((t.current / t.target) * 100, 100);
      let factor = 1;
      let etaFactor = 1;

      if (t.id === 'carbon') {
        factor = 1.15 - (intensity - 1) * 0.25;
        etaFactor = 1 / factor;
      } else if (t.id === 'budget') {
        factor = 0.85 + (intensity - 1) * 0.2;
        etaFactor = 1 / factor;
      }

      return {
        id: t.id,
        adjustedProgress: Math.min(baseProgress * factor, 100),
        adjustedEta: Math.max(t.etaDays * etaFactor, 0),
      };
    });
  }, [intensity, targets]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <Target className="w-4 h-4 text-emerald-500/60" />
        <h2 className="text-[12px] font-semibold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
          Strategic ESG Targets
          <Sparkles className="w-3 h-3 text-amber-400/50" />
        </h2>
      </div>

      {/* Primary row — 2 big cards: Carbon Neutrality + Energy Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {targets.filter((t) => t.id === 'carbon' || t.id === 'budget').map((t) => {
          const adj = adjustedValues?.find((a) => a.id === t.id);
          return (
            <TargetCard
              key={t.id}
              target={t}
              adjustedProgress={adj?.adjustedProgress}
              adjustedEta={adj?.adjustedEta}
            />
          );
        })}
      </div>

      {/* Secondary row — Renewable Mix + What-If (compact) */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {targets.filter((t) => t.id === 'renewable').map((t) => {
          const adj = adjustedValues?.find((a) => a.id === t.id);
          return (
            <TargetCard
              key={t.id}
              target={t}
              adjustedProgress={adj?.adjustedProgress}
              adjustedEta={adj?.adjustedEta}
            />
          );
        })}
        <WhatIfSimulator
          intensity={intensity}
          onChange={setIntensity}
          baseTargets={targets}
        />
      </div>
    </div>
  );
}
