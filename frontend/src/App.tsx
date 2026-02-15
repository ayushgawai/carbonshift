import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Leaf, Cpu, Activity, Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { MetricCard } from './components/MetricCard';
import { AnimatedValue } from './components/AnimatedValue';
import { EnergyPriceChart } from './components/EnergyPriceChart';
import { GPUPowerChart } from './components/GPUPowerChart';
import { ImpactMetrics } from './components/ImpactMetrics';
import { EnergySourceMix } from './components/EnergySourceMix';
import { SystemLogs } from './components/SystemLogs';
import { GridBackground } from './components/GridBackground';
import { GlitchOverlay } from './components/GlitchOverlay';
import { GpuHeatBar } from './components/GpuHeatBar';
import { HudRing } from './components/HudRing';
import { AuraOverlay } from './components/AuraOverlay';
import { MarketInsights } from './components/MarketInsights';
import { ESGTargets } from './components/ESGTargets';
import { DomainFilter } from './components/DomainFilter';
import { ProfitChart } from './components/ProfitChart';
import { PeaksTimeline } from './components/PeaksTimeline';
import { HeroIntro } from './components/HeroIntro';
import { useWebSocket } from './hooks/useWebSocket';
import { getCarbonColor, getStatusColor, formatStatus } from './utils/formatters';
import { predictPrices, deriveMarketInsights } from './utils/prediction';
import type { DomainFocus } from './types';

// ── Stagger "unbox" variants ─────────────────────────────────────────

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

// ── Map training status → CSS glow class ─────────────────────────────

function getGlowClass(status: string | null): string {
  switch (status) {
    case 'running':   return 'glow-running';
    case 'paused':    return 'glow-paused';
    case 'completed': return 'glow-completed';
    default:          return 'glow-idle';
  }
}

// ── Formatters for AnimatedValue (stable references) ─────────────────

const fmtPrice  = (v: number) => v.toFixed(2);
const fmtCarbon = (v: number) => Math.round(v).toString();
const fmtWatts  = (v: number) => Math.round(v).toString();

// ── Loading skeleton ─────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ffffff 30%, #ecfdf5 60%, #f0fdf4 100%)' }}>
      <div className="sticky top-0 z-50 border-b border-gray-200/60" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(24px)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
              <div>
                <div className="h-5 w-28 bg-gray-100 rounded-lg animate-pulse" />
                <div className="h-2.5 w-36 bg-gray-50 rounded animate-pulse mt-1.5" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-10 w-28 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-4" />
              <div className="h-56 bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────

export function App() {
  const { isConnected, isSimulating, currentData, history, error } = useWebSocket();
  // Cinematic intro state
  const [showIntro, setShowIntro] = useState(true);
  const dismissIntro = useCallback(() => setShowIntro(false), []);

  // Domain focus mode
  const [focusMode, setFocusMode] = useState<DomainFocus>('all');

  // GPU icon spin speed
  const gpuSpinDuration = useMemo(() => {
    if (!currentData) return 4;
    return Math.max(4 - (currentData.gpu_power_watts / 100), 0.5);
  }, [currentData?.gpu_power_watts]);

  const isPriceDanger = (currentData?.electricity_price ?? 0) > 50;

  // ── AI Prediction + Market Insights ─────────────────────────────
  const marketInsight = useMemo(() => {
    if (!currentData || history.length < 5) return null;
    const prices = history.map((d) => d.electricity_price);
    const lastTime = history[history.length - 1].time;
    const prediction = predictPrices(prices, lastTime, 15);
    return deriveMarketInsights(
      prices,
      currentData.carbon_intensity,
      currentData.total_cost_saved,
      prediction,
    );
  }, [currentData, history]);

  const focusClass = useCallback(
    (...modes: DomainFocus[]): string => {
      if (focusMode === 'all') return 'focus-section focus-highlighted';
      return modes.includes(focusMode)
        ? 'focus-section focus-highlighted'
        : 'focus-section focus-dimmed';
    },
    [focusMode],
  );

  // Loading state
  if (!currentData) {
    return <LoadingSkeleton />;
  }

  const glowClass = getGlowClass(currentData.training_status);

  return (
    <>
      {/* ── Cinematic Intro ────────────────────────────────────────── */}
      <AnimatePresence>
        {showIntro && <HeroIntro onComplete={dismissIntro} />}
      </AnimatePresence>

      {/* ── Dashboard (revealed after intro) ───────────────────────── */}
      {!showIntro && (
        <>
          {/* Animated grid network + particle background */}
          <GridBackground
            carbonIntensity={currentData.carbon_intensity}
            electricityPrice={currentData.electricity_price}
          />

          {/* Dynamic edge aura */}
          <AuraOverlay
            carbonIntensity={currentData.carbon_intensity}
            electricityPrice={currentData.electricity_price}
          />

          {/* ── Floating decorative elements ────────────────────────── */}
          <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden" aria-hidden="true">
            {/* Large gradient ring — top right */}
            <div
              className="float-slow absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full border border-emerald-300/10"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)' }}
            />
            {/* Small circle — left */}
            <div
              className="float-medium absolute top-1/3 -left-16 w-40 h-40 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)' }}
            />
            {/* Accent ring — bottom center */}
            <div
              className="float-fast absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full border border-teal-300/8"
              style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.03) 0%, transparent 65%)' }}
            />
            {/* Diamond accent — mid-right */}
            <div
              className="float-medium absolute top-2/3 right-[10%] w-6 h-6 rotate-45 bg-emerald-400/10 rounded-sm"
            />
            {/* Small dot cluster — top-left */}
            <div className="float-slow absolute top-[15%] left-[8%] flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/15" />
              <div className="w-1 h-1 rounded-full bg-teal-400/10 mt-1" />
              <div className="w-2 h-2 rounded-full bg-emerald-300/8" />
            </div>
            {/* Horizontal accent line — mid-page */}
            <div
              className="float-fast absolute top-[55%] left-[5%] w-32 h-[1px]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.12), transparent)' }}
            />
          </div>

          <div className={`relative z-10 min-h-screen dashboard-glow ${glowClass}`}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Header
                isConnected={isConnected}
                isSimulating={isSimulating}
                trainingStatus={currentData.training_status}
              />
            </motion.div>

            {/* Main content — 70/30 two-column layout */}
            <motion.main
              className="w-full px-4 sm:px-6 lg:px-8 py-8"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {/* Connection error / simulation banner */}
              {!isConnected && isSimulating && (
                <motion.div variants={staggerItem} className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200/60 rounded-2xl mb-6">
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-sm text-amber-700">
                    Backend unavailable — showing <span className="font-semibold text-amber-800">simulated data</span>.
                  </p>
                </motion.div>
              )}
              {error && !isConnected && !isSimulating && (
                <motion.div variants={staggerItem} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200/60 rounded-2xl mb-6">
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm text-red-700">
                    Connection lost. Attempting to reconnect...
                  </p>
                </motion.div>
              )}

              {/* ── Persistent 70 / 30 grid ──────────────────────────── */}
              <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">

                {/* ════ LEFT COLUMN (~70%) ════ */}
                <div className="xl:col-span-7 space-y-6">

                  {/* ESG Targets + Domain Filter */}
                  <motion.section variants={staggerItem}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div />
                      <DomainFilter mode={focusMode} onChange={setFocusMode} />
                    </div>
                    <ESGTargets
                      carbonSaved={currentData.total_carbon_saved}
                      costSaved={currentData.total_cost_saved}
                      carbonIntensity={currentData.carbon_intensity}
                      trainingProgress={currentData.training_progress}
                    />
                  </motion.section>

                  {/* Company Profit Bar Chart */}
                  <motion.section variants={staggerItem} className={focusClass('finance')}>
                    <ProfitChart
                      history={history}
                      totalCostSaved={currentData.total_cost_saved}
                    />
                  </motion.section>

                  {/* Metric Cards — 4 in a row */}
                  <motion.section variants={staggerItem} className={focusClass('sustainability', 'finance', 'grid')}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className={focusClass('finance')}>
                        <MetricCard
                          title="Electricity Price"
                          value=""
                          unit="$/MWh"
                          icon={<DollarSign className="w-4 h-4" />}
                          color={isPriceDanger ? 'red' : 'blue'}
                          pulse
                          danger={isPriceDanger}
                        >
                          <div className="flex items-baseline gap-2">
                            <AnimatedValue
                              value={currentData.electricity_price}
                              formatter={fmtPrice}
                              className={`text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight ${
                                isPriceDanger ? 'text-red-500' : 'text-gray-900'
                              }`}
                            />
                            <span className="text-sm font-medium text-gray-400">$/MWh</span>
                          </div>
                        </MetricCard>
                      </div>

                      <div className={focusClass('sustainability')}>
                        <MetricCard
                          title="Carbon Intensity"
                          value=""
                          unit="gCO₂/kWh"
                          icon={<Leaf className="w-4 h-4" />}
                          color={getCarbonColor(currentData.carbon_intensity)}
                          pulse
                        >
                          <div className="flex items-baseline gap-2">
                            <AnimatedValue
                              value={currentData.carbon_intensity}
                              formatter={fmtCarbon}
                              className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-gray-900"
                            />
                            <span className="text-sm font-medium text-gray-400">gCO₂</span>
                          </div>
                        </MetricCard>
                      </div>

                      <div className={focusClass('grid')}>
                        <MetricCard
                          title="GPU Power"
                          value=""
                          unit="Watts"
                          icon={
                            <Cpu
                              className="w-4 h-4"
                              style={{
                                animation: `spin ${gpuSpinDuration}s linear infinite`,
                              }}
                            />
                          }
                          color="orange"
                          pulse
                        >
                          <div className="flex items-baseline gap-2">
                            <AnimatedValue
                              value={currentData.gpu_power_watts}
                              formatter={fmtWatts}
                              className="text-4xl sm:text-5xl font-bold font-mono tabular-nums tracking-tight text-gray-900"
                            />
                            <span className="text-sm font-medium text-gray-400">W</span>
                          </div>
                          <GpuHeatBar watts={currentData.gpu_power_watts} />
                        </MetricCard>
                      </div>

                      <div className={focusClass('sustainability', 'finance', 'grid')}>
                        <MetricCard
                          title="Training Status"
                          value={formatStatus(currentData.training_status)}
                          unit={`Epoch ${currentData.current_epoch}/${currentData.total_epochs}`}
                          icon={<Activity className="w-4 h-4" />}
                          color={getStatusColor(currentData.training_status)}
                          pulse
                        />
                      </div>
                    </div>

                    {/* Energy Source Mix */}
                    <div className={`mt-4 ${focusClass('sustainability')}`}>
                      <EnergySourceMix carbonIntensity={currentData.carbon_intensity} />
                    </div>
                  </motion.section>

                  {/* Live Charts */}
                  <motion.section variants={staggerItem} className={focusClass('finance', 'grid')}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className={focusClass('finance')}>
                        <EnergyPriceChart data={history} />
                      </div>
                      <div className={focusClass('grid')}>
                        <GPUPowerChart data={history} />
                      </div>
                    </div>
                  </motion.section>

                  {/* Impact Metrics */}
                  <motion.section variants={staggerItem} className={focusClass('sustainability', 'finance', 'grid')}>
                    <ImpactMetrics
                      costSaved={currentData.total_cost_saved}
                      carbonSaved={currentData.total_carbon_saved}
                      peaksAvoided={currentData.peaks_avoided}
                    />
                  </motion.section>

                  {/* System Logs */}
                  <motion.section variants={staggerItem} className={focusClass('sustainability', 'finance', 'grid')}>
                    <SystemLogs data={currentData} />
                  </motion.section>
                </div>

                {/* ════ RIGHT COLUMN (~30%) — AI Insights ════ */}
                <motion.div
                  className="xl:col-span-3"
                  variants={staggerItem}
                >
                  <div className="xl:sticky xl:top-20 space-y-4">
                    {marketInsight && (
                      <MarketInsights
                        insight={marketInsight}
                        currentPrice={currentData.electricity_price}
                      />
                    )}
                    <PeaksTimeline
                      history={history}
                      peaksAvoided={currentData.peaks_avoided}
                    />
                  </div>
                </motion.div>
              </div>

              {/* ── The Signature ─────────────────────────────────────── */}
              <motion.footer variants={staggerItem} className="pt-12 pb-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                  <p className="text-[11px] font-light text-gray-400 tracking-[0.3em] uppercase">
                    Designed in California for our Planet.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-400/30" />
                    <p className="text-[10px] text-gray-300 tracking-wide">
                      CarbonShift &middot; TreeHacks 2025
                    </p>
                    <div className="w-1 h-1 rounded-full bg-emerald-400/30" />
                  </div>
                </div>
              </motion.footer>
            </motion.main>
          </div>

          {/* HUD Ring — bottom right */}
          <HudRing
            electricityPrice={currentData.electricity_price}
            carbonIntensity={currentData.carbon_intensity}
            trainingStatus={currentData.training_status}
          />

          {/* Glitch overlay */}
          <GlitchOverlay trainingStatus={currentData.training_status} />

        </>
      )}
    </>
  );
}
