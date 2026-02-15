import { useState, useEffect, useRef, useCallback } from 'react';
import type { DashboardData, ChartDataPoint, WebSocketState, TrainingStatus } from '../types';
import { formatTime } from '../utils/formatters';
import { WS_URL } from '../types';

const MAX_HISTORY = 60;
const RECONNECT_DELAY = 3000;
const SIMULATION_INTERVAL = 2000;

// ─── Fake-data generator ────────────────────────────────────────────
// Produces a DashboardData object that matches the backend JSON schema
// exactly, with realistic fluctuations so charts look alive.

interface SimulationState {
  electricityPrice: number;
  carbonIntensity: number;
  gpuPower: number;
  progress: number;
  epoch: number;
  costSaved: number;
  carbonSaved: number;
  peaksAvoided: number;
  status: TrainingStatus;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function drift(current: number, min: number, max: number, maxStep: number): number {
  const delta = (Math.random() - 0.5) * 2 * maxStep;
  return clamp(current + delta, min, max);
}

function createSimulationState(): SimulationState {
  return {
    electricityPrice: 35 + Math.random() * 20,   // start 35-55 $/MWh
    carbonIntensity: 200 + Math.random() * 200,   // 200-400 gCO2/kWh
    gpuPower: 150 + Math.random() * 50,            // 150-200 W
    progress: 0,
    epoch: 1,
    costSaved: 0,
    carbonSaved: 0,
    peaksAvoided: 0,
    status: 'running' as TrainingStatus,
  };
}

function generateFakeData(sim: SimulationState): DashboardData {
  // Drift values with realistic random walk
  sim.electricityPrice = drift(sim.electricityPrice, 15, 80, 3);
  sim.carbonIntensity  = drift(sim.carbonIntensity, 80, 550, 15);
  sim.gpuPower         = drift(sim.gpuPower, 80, 250, 8);

  // Advance training progress
  sim.progress = Math.min(sim.progress + 0.3 + Math.random() * 0.7, 100);
  const totalEpochs = 10;
  sim.epoch = Math.min(Math.floor((sim.progress / 100) * totalEpochs) + 1, totalEpochs);

  // Accumulate impact metrics
  sim.costSaved   += 0.05 + Math.random() * 0.15;
  sim.carbonSaved += 0.01 + Math.random() * 0.05;

  // Occasionally avoid a peak (when price > 50)
  if (sim.electricityPrice > 50 && Math.random() > 0.6) {
    sim.peaksAvoided += 1;
    sim.gpuPower = clamp(sim.gpuPower - 30, 80, 250); // throttle GPU on spike
  }

  // Status logic
  if (sim.progress >= 100) {
    sim.status = 'completed';
  } else if (sim.electricityPrice > 55) {
    sim.status = 'paused';
  } else {
    sim.status = 'running';
  }

  // GPU power limit reflects status
  const gpuPowerLimit = sim.status === 'paused' ? 120 : 200;

  return {
    timestamp:          new Date().toISOString(),
    electricity_price:  parseFloat(sim.electricityPrice.toFixed(2)),
    carbon_intensity:   parseFloat(sim.carbonIntensity.toFixed(1)),
    gpu_power_watts:    parseFloat(sim.gpuPower.toFixed(1)),
    gpu_power_limit:    gpuPowerLimit,
    training_status:    sim.status,
    total_cost_saved:   parseFloat(sim.costSaved.toFixed(2)),
    total_carbon_saved: parseFloat(sim.carbonSaved.toFixed(2)),
    training_progress:  parseFloat(sim.progress.toFixed(1)),
    current_epoch:      sim.epoch,
    total_epochs:       10,
    peaks_avoided:      sim.peaksAvoided,
  };
}

// ─── Helper: turn DashboardData into a ChartDataPoint ───────────────

function toChartPoint(data: DashboardData): ChartDataPoint {
  return {
    time:              formatTime(data.timestamp),
    timestamp:         data.timestamp,
    electricity_price: data.electricity_price,
    gpu_power_watts:   data.gpu_power_watts,
    gpu_power_limit:   data.gpu_power_limit,
    carbon_intensity:  data.carbon_intensity,
  };
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useWebSocket(): WebSocketState {
  const [isConnected, setIsConnected]   = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentData, setCurrentData]   = useState<DashboardData | null>(null);
  const [history, setHistory]           = useState<ChartDataPoint[]>([]);
  const [error, setError]               = useState<string | null>(null);

  const wsRef                = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationStateRef   = useRef<SimulationState | null>(null);
  const mountedRef           = useRef(true);

  // ── Push one data frame into state (shared by real + fake paths) ──

  const pushData = useCallback((data: DashboardData) => {
    if (!mountedRef.current) return;
    setCurrentData(data);
    setHistory((prev) => [...prev, toChartPoint(data)].slice(-MAX_HISTORY));
  }, []);

  // ── Simulation start / stop ───────────────────────────────────────

  const startSimulation = useCallback(() => {
    // Don't double-start
    if (simulationIntervalRef.current) return;

    console.log('[SIM] Backend unavailable — starting fake-data simulation');
    simulationStateRef.current = createSimulationState();
    setIsSimulating(true);

    // Immediately push the first fake frame so the UI doesn't stay empty
    const first = generateFakeData(simulationStateRef.current);
    pushData(first);

    simulationIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || !simulationStateRef.current) return;

      // When progress completes, reset to keep data flowing
      if (simulationStateRef.current.progress >= 100) {
        simulationStateRef.current = createSimulationState();
      }

      const fake = generateFakeData(simulationStateRef.current);
      pushData(fake);
    }, SIMULATION_INTERVAL);
  }, [pushData]);

  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    simulationStateRef.current = null;
    setIsSimulating(false);
    console.log('[SIM] Simulation stopped — switching to real data');
  }, []);

  // ── WebSocket connection ──────────────────────────────────────────

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      // ▸ onopen — connection established
      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setError(null);

        // Kill simulation the moment we have a real connection
        stopSimulation();

        console.log('[WS] Connected to backend at', WS_URL);
      };

      // ▸ onmessage — real data from backend
      ws.onmessage = (event: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data: DashboardData = JSON.parse(event.data as string);
          pushData(data);
        } catch (parseError) {
          console.error('[WS] Failed to parse message:', parseError);
        }
      };

      // ▸ onerror — WebSocket error
      ws.onerror = () => {
        if (!mountedRef.current) return;
        console.error('[WS] Connection error');
        setError('WebSocket connection error');

        // Start simulation so the dashboard stays alive
        startSimulation();
      };

      // ▸ onclose — disconnected
      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        console.log('[WS] Disconnected — will retry in', RECONNECT_DELAY / 1000, 's');

        // Start simulation if not already running
        startSimulation();

        // Schedule reconnection attempt
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connect();
          }
        }, RECONNECT_DELAY);
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      setError('Failed to connect to server');
      setIsConnected(false);

      // Fallback to simulation
      startSimulation();

      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connect();
        }
      }, RECONNECT_DELAY);
    }
  }, [pushData, startSimulation, stopSimulation]);

  // ── Lifecycle ─────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;

      // Tear down WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Clear reconnect timer
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear simulation interval
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, isSimulating, currentData, history, error };
}
