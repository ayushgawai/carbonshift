import { Play, Square, Download, Loader2, GraduationCap } from 'lucide-react';
import type { TrainingStatus } from '../types';
import { formatPercent } from '../utils/formatters';

interface TrainingControlProps {
  status: TrainingStatus | null;
  progress: number;
  currentEpoch: number;
  totalEpochs: number;
  isStarting: boolean;
  isStopping: boolean;
  isDownloading: boolean;
  onStart: () => void;
  onStop: () => void;
  onDownload: () => void;
  apiError: string | null;
}

const statusGradients: Record<string, string> = {
  running: 'from-emerald-500 to-emerald-600',
  paused: 'from-amber-400 to-amber-500',
  completed: 'from-blue-500 to-blue-600',
  idle: 'from-gray-300 to-gray-400',
};

export function TrainingControl({
  status,
  progress,
  currentEpoch,
  totalEpochs,
  isStarting,
  isStopping,
  isDownloading,
  onStart,
  onStop,
  onDownload,
  apiError,
}: TrainingControlProps) {
  const effectiveStatus = status || 'idle';
  const gradient = statusGradients[effectiveStatus] || statusGradients.idle;

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 text-violet-600">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Training Control</h3>
          <p className="text-xs text-gray-400">Manage model training</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Progress</span>
          <span className="text-xs font-bold font-mono text-gray-700">{formatPercent(progress)}</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {effectiveStatus === 'running' && progress > 5 && (
              <div className="w-full h-full bg-white/20 animate-pulse rounded-full" />
            )}
          </div>
        </div>
      </div>

      {/* Epoch display */}
      <div className="flex items-center justify-center mb-5">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
          <span className="text-xs font-medium text-gray-500">Epoch</span>
          <span className="text-lg font-bold font-mono text-gray-900">
            {currentEpoch} <span className="text-gray-400 text-sm font-normal">/ {totalEpochs}</span>
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {(effectiveStatus === 'idle' || effectiveStatus === 'completed') && (
          <button
            onClick={onStart}
            disabled={isStarting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium text-sm shadow-sm shadow-emerald-500/25 hover:shadow-md hover:shadow-emerald-500/30 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" fill="currentColor" />
            )}
            {isStarting ? 'Starting...' : 'Start Training'}
          </button>
        )}

        {(effectiveStatus === 'running' || effectiveStatus === 'paused') && (
          <button
            onClick={onStop}
            disabled={isStopping}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium text-sm shadow-sm shadow-red-500/25 hover:shadow-md hover:shadow-red-500/30 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isStopping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4" fill="currentColor" />
            )}
            {isStopping ? 'Stopping...' : 'Stop Training'}
          </button>
        )}

        {effectiveStatus === 'completed' && (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium text-sm shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloading ? 'Downloading...' : 'Download Certificate'}
          </button>
        )}
      </div>

      {/* API Error */}
      {apiError && (
        <div className="mt-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-600">{apiError}</p>
        </div>
      )}
    </div>
  );
}
