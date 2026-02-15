import { useState, useCallback } from 'react';
import axios from 'axios';
import type { TrainingAPIState } from '../types';
import { API_BASE_URL } from '../types';

interface UseTrainingAPIReturn extends TrainingAPIState {
  startTraining: () => Promise<void>;
  stopTraining: () => Promise<void>;
  downloadCertificate: () => void;
}

export function useTrainingAPI(): UseTrainingAPIReturn {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTraining = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/start-training`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start training';
      setError(message);
      console.error('[API] Start training error:', err);
    } finally {
      setIsStarting(false);
    }
  }, []);

  const stopTraining = useCallback(async () => {
    setIsStopping(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/stop-training`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop training';
      setError(message);
      console.error('[API] Stop training error:', err);
    } finally {
      setIsStopping(false);
    }
  }, []);

  const downloadCertificate = useCallback(() => {
    setIsDownloading(true);
    window.open(`${API_BASE_URL}/api/certificate`, '_blank');
    // Reset download state after short delay since we can't track the new window
    setTimeout(() => setIsDownloading(false), 2000);
  }, []);

  return {
    isStarting,
    isStopping,
    isDownloading,
    error,
    startTraining,
    stopTraining,
    downloadCertificate,
  };
}
