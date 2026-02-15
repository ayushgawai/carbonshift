import { motion } from 'framer-motion';
import { Zap, Wifi, WifiOff, Radio } from 'lucide-react';
import type { TrainingStatus } from '../types';
import { formatStatus, getStatusColor } from '../utils/formatters';

interface HeaderProps {
  isConnected: boolean;
  isSimulating: boolean;
  trainingStatus: TrainingStatus | null;
}

const statusColorMap: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  yellow: 'bg-amber-50 text-amber-600 border-amber-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  red: 'bg-red-50 text-red-600 border-red-200',
};

export function Header({ isConnected, isSimulating, trainingStatus }: HeaderProps) {
  const statusColor = trainingStatus ? getStatusColor(trainingStatus) : 'orange';

  return (
    <header className="sticky top-0 z-50" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="logo-mark logo-shimmer relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 shadow-lg shadow-emerald-500/20"
              initial={{ opacity: 0, x: -20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            >
              <span className="absolute inset-0 rounded-xl border border-white/30 logo-ring" />
              <span className="absolute inset-1.5 rounded-lg bg-white/10 logo-pulse" />
              <Zap className="w-5 h-5 text-white relative z-10 drop-shadow-md" strokeWidth={2.5} />
            </motion.div>

            <div>
              <motion.h1
                className="text-2xl font-heading font-bold tracking-wide leading-none"
                initial={{ opacity: 0, x: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
              >
                <span className="text-gradient-animated">
                  CarbonShift
                </span>
              </motion.h1>
              <motion.p
                className="text-[12px] font-medium text-gray-400 tracking-[0.18em] uppercase leading-none mt-1"
                initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' as const }}
              >
                Efficiency that pays for itself
              </motion.p>
            </div>
          </div>

          {/* Right side badges */}
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-all duration-300 ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 badge-glow'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span className="hidden sm:inline">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            {/* Simulation mode badge */}
            {isSimulating && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border bg-amber-50 text-amber-600 border-amber-200 transition-all duration-300">
                <Radio className="w-3 h-3 animate-pulse" />
                <span className="hidden sm:inline">Sim</span>
              </div>
            )}

            {/* Training status badge */}
            {trainingStatus && (
              <div
                className={`px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-all duration-300 ${statusColorMap[statusColor]}`}
              >
                {formatStatus(trainingStatus)}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Animated gradient accent bar */}
      <div className="header-accent-bar" />
    </header>
  );
}
