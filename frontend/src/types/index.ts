export interface DashboardData {
  timestamp: string;
  electricity_price: number;
  carbon_intensity: number;
  gpu_power_watts: number;
  gpu_power_limit: number;
  training_status: TrainingStatus;
  total_cost_saved: number;
  total_carbon_saved: number;
  training_progress: number;
  current_epoch: number;
  total_epochs: number;
  peaks_avoided: number;
}

export type TrainingStatus = 'running' | 'paused' | 'idle' | 'completed';

export interface ChartDataPoint {
  time: string;
  timestamp: string;
  electricity_price: number;
  gpu_power_watts: number;
  gpu_power_limit: number;
  carbon_intensity: number;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red' | 'yellow';
  trend?: 'up' | 'down' | 'stable';
  pulse?: boolean;
}

export interface WebSocketState {
  isConnected: boolean;
  isSimulating: boolean;
  currentData: DashboardData | null;
  history: ChartDataPoint[];
  error: string | null;
}

export interface TrainingAPIState {
  isStarting: boolean;
  isStopping: boolean;
  isDownloading: boolean;
  error: string | null;
}

export type DomainFocus = 'all' | 'sustainability' | 'finance' | 'grid';

export const API_BASE_URL = 'http://localhost:8000';
export const WS_URL = 'ws://localhost:8000/ws';
