import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Download, Loader2, Award } from 'lucide-react';

interface VictoryOverlayProps {
  isCompleted: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  onDismiss: () => void;
}

export function VictoryOverlay({ isCompleted, isDownloading, onDownload, onDismiss }: VictoryOverlayProps) {
  const [visible, setVisible] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (isCompleted && !firedRef.current) {
      firedRef.current = true;
      setVisible(true);

      // Fire confetti bursts
      const fire = (opts: confetti.Options) => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#2563eb', '#f59e0b', '#06b6d4', '#8b5cf6'],
          ...opts,
        });
      };

      fire({ angle: 60, origin: { x: 0.15, y: 0.65 } });
      fire({ angle: 120, origin: { x: 0.85, y: 0.65 } });

      const timer = setTimeout(() => {
        fire({ angle: 90, origin: { x: 0.5, y: 0.7 }, particleCount: 120, spread: 100 });
      }, 400);

      return () => clearTimeout(timer);
    }
    if (!isCompleted) {
      firedRef.current = false;
      setVisible(false);
    }
  }, [isCompleted]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Card */}
      <div className="victory-enter relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 px-8 py-10 max-w-md mx-4 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-5">
          <Award className="w-8 h-8 text-white" strokeWidth={2} />
        </div>

        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-1">
          AI Training Optimized
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Training completed with smart energy scheduling.<br />
          Your Green AI Certificate is ready.
        </p>

        {/* Certificate button with 3D hover */}
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="certificate-btn inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          {isDownloading ? 'Downloading...' : 'Download Green AI Certificate'}
        </button>

        {/* Dismiss hint */}
        <p className="text-[12px] text-gray-400 mt-4">
          Click outside or press anywhere to close
        </p>
      </div>
    </div>
  );
}
