import { useEffect, useRef, useState } from 'react';

interface GlitchOverlayProps {
  trainingStatus: string;
}

export function GlitchOverlay({ trainingStatus }: GlitchOverlayProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const prevStatusRef = useRef(trainingStatus);

  useEffect(() => {
    // Trigger glitch only on transition INTO paused
    if (prevStatusRef.current !== 'paused' && trainingStatus === 'paused') {
      setIsGlitching(true);

      // Add screen shake to root element
      document.documentElement.classList.add('screen-shake');

      const timeout = setTimeout(() => {
        setIsGlitching(false);
        document.documentElement.classList.remove('screen-shake');
      }, 500);

      return () => {
        clearTimeout(timeout);
        document.documentElement.classList.remove('screen-shake');
      };
    }
    prevStatusRef.current = trainingStatus;
  }, [trainingStatus]);

  if (!isGlitching) return null;

  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none glitch-vignette"
      aria-hidden="true"
    />
  );
}
