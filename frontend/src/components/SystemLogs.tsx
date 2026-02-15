import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import type { DashboardData } from '../types';

interface SystemLogsProps {
  data: DashboardData | null;
}

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'success';
}

const levelColors: Record<string, string> = {
  info: 'text-emerald-400',
  warn: 'text-amber-400',
  success: 'text-cyan-400',
};

const levelPrefix: Record<string, string> = {
  info: 'INF',
  warn: 'WRN',
  success: 'OK ',
};

let nextLogId = 0;

export function SystemLogs({ data }: SystemLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevDataRef = useRef<DashboardData | null>(null);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [...prev, { id: nextLogId++, timestamp: ts, message, level }].slice(-50));
  }, []);

  useEffect(() => {
    if (!data) return;
    const prev = prevDataRef.current;

    if (!prev) {
      addLog('System online — receiving telemetry stream', 'success');
      addLog(`Grid price: $${data.electricity_price.toFixed(1)}/MWh | Carbon: ${Math.round(data.carbon_intensity)} gCO₂/kWh`);
      prevDataRef.current = data;
      return;
    }

    if (prev.training_status !== data.training_status) {
      switch (data.training_status) {
        case 'running':
          addLog('Signal: Carbon intensity dropped — resuming training', 'success');
          break;
        case 'paused':
          addLog(`Alert: Grid stress detected ($${data.electricity_price.toFixed(1)}/MWh) — training paused`, 'warn');
          break;
        case 'completed':
          addLog('Training complete — all epochs finished. Green AI certificate ready.', 'success');
          break;
        case 'idle':
          addLog('Training session stopped by operator', 'info');
          break;
      }
    }

    if (prev.gpu_power_limit !== data.gpu_power_limit) {
      const pct = Math.round((data.gpu_power_limit / 300) * 100);
      addLog(`GPU power limit adjusted → ${data.gpu_power_limit}W (${pct}% capacity)`, 'info');
    }

    if (data.peaks_avoided > prev.peaks_avoided) {
      addLog(`Peak avoided #${data.peaks_avoided}: price spike mitigated, saved $${(data.total_cost_saved - prev.total_cost_saved).toFixed(2)}`, 'warn');
    }

    if (data.current_epoch > prev.current_epoch) {
      addLog(`Epoch ${data.current_epoch}/${data.total_epochs} started — progress ${data.training_progress.toFixed(1)}%`, 'info');
    }

    if (prev.carbon_intensity >= 300 && data.carbon_intensity < 300) {
      addLog('Carbon intensity dropped below 300 gCO₂ — grid is cleaner', 'success');
    }
    if (prev.carbon_intensity < 400 && data.carbon_intensity >= 400) {
      addLog(`Carbon intensity high: ${Math.round(data.carbon_intensity)} gCO₂/kWh — monitoring`, 'warn');
    }

    prevDataRef.current = data;
  }, [data, addLog]);

  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200/60" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(24px)' }}>
      {/* Header bar */}
      <button
        onClick={() => setIsExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
        style={{ background: 'rgba(15,23,42,0.8)' }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">System Logs</span>
          <span className="text-[12px] text-gray-500 font-mono">({logs.length})</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>

      {/* Log content */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="h-40 sm:h-48 overflow-y-auto p-3 space-y-0.5"
        >
          {logs.length === 0 ? (
            <p className="terminal-text text-gray-600 italic">Waiting for telemetry...</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="terminal-line-enter flex gap-2">
                <span className="terminal-text text-gray-600 flex-shrink-0">{log.timestamp}</span>
                <span className={`terminal-text flex-shrink-0 font-bold ${levelColors[log.level]}`}>
                  [{levelPrefix[log.level]}]
                </span>
                <span className={`terminal-text ${levelColors[log.level]} opacity-90`}>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
