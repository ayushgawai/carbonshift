import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════
   HeroIntro — Apple-style cinematic launch sequence
   ═══════════════════════════════════════════════════════════════════ */

interface HeroIntroProps {
  onComplete: () => void;
}

/* ── Quote data ───────────────────────────────────────────────────── */

const QUOTES = [
  'To the ones who see what others don\u2019t.',
  'AI shouldn\u2019t just be fast. It should be wise.',
  'A symphony of code and carbon.',
  'Finally, a brain that feels the planet.',
] as const;

/* Timing (ms) */
const QUOTE_INTERVAL = 3200;   // total time per quote (enter + visible + exit)
const LOGO_DELAY = 600;        // pause before logo
const LOGO_DURATION = 2400;    // logo stays before flash
const FLASH_DURATION = 700;    // white flash

/* ── Variants ─────────────────────────────────────────────────────── */

const quoteVariants = {
  enter: {
    opacity: 0,
    filter: 'blur(12px)',
    scale: 0.96,
    y: 8,
  },
  center: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    y: 0,
    transition: {
      duration: 1.1,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(6px)',
    y: -24,
    scale: 0.98,
    transition: {
      duration: 0.8,
      ease: [0.55, 0.06, 0.68, 0.19] as [number, number, number, number],
    },
  },
};

const logoVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(20px)',
    scale: 0.85,
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const taglineVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.5, ease: 'easeOut' as const },
  },
};

/* ═══════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════ */

export function HeroIntro({ onComplete }: HeroIntroProps) {
  const [phase, setPhase] = useState<'quotes' | 'logo' | 'flash' | 'done'>('quotes');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [flashOpacity, setFlashOpacity] = useState(0);

  /* ── Quote cycling ────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'quotes') return;

    const timer = setTimeout(() => {
      if (quoteIndex < QUOTES.length - 1) {
        setQuoteIndex((i) => i + 1);
      } else {
        // All quotes shown — move to logo
        setTimeout(() => setPhase('logo'), LOGO_DELAY);
      }
    }, QUOTE_INTERVAL);

    return () => clearTimeout(timer);
  }, [quoteIndex, phase]);

  /* ── Logo → Flash → Done ──────────────────────────────────────── */
  useEffect(() => {
    if (phase !== 'logo') return;

    const timer = setTimeout(() => {
      setPhase('flash');
      setFlashOpacity(1);
    }, LOGO_DURATION);

    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'flash') return;

    const timer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, FLASH_DURATION);

    return () => clearTimeout(timer);
  }, [phase, onComplete]);

  /* ── Skip handler (click anywhere) ────────────────────────────── */
  const skip = useCallback(() => {
    setPhase('done');
    onComplete();
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black cursor-pointer select-none"
      onClick={skip}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Quote phase ─────────────────────────────────────────── */}
      {phase === 'quotes' && (
        <AnimatePresence mode="wait">
          <motion.p
            key={quoteIndex}
            className="max-w-2xl px-8 text-center text-white/90 font-heading"
            style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2.4rem)',
              fontWeight: 200,
              lineHeight: 1.5,
              letterSpacing: '-0.02em',
            }}
            variants={quoteVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {QUOTES[quoteIndex]}
          </motion.p>
        </AnimatePresence>
      )}

      {/* ── Logo phase ──────────────────────────────────────────── */}
      {phase === 'logo' && (
        <motion.div
          className="flex flex-col items-center gap-4"
          variants={logoVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Neon glow layers */}
          <div className="relative">
            {/* Outer glow */}
            <span
              className="absolute inset-0 blur-2xl pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, rgba(59,130,246,0.35), rgba(6,182,212,0.25), rgba(16,185,129,0.35))',
                transform: 'scale(1.5)',
              }}
            />
            {/* Text */}
            <h1
              className="relative font-heading font-extrabold tracking-tight"
              style={{
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                background: 'linear-gradient(90deg, #60a5fa, #22d3ee, #34d399)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
              }}
            >
              CarbonShift
            </h1>
          </div>

          <motion.p
            className="text-white/40 font-heading tracking-[0.25em] uppercase"
            style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.85rem)', fontWeight: 300 }}
            variants={taglineVariants}
            initial="hidden"
            animate="visible"
          >
            Efficiency that pays for itself
          </motion.p>
        </motion.div>
      )}

      {/* ── White flash overlay ─────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: flashOpacity }}
        transition={{ duration: FLASH_DURATION / 1000, ease: 'easeIn' }}
      />

      {/* ── Skip hint ───────────────────────────────────────────── */}
      <motion.span
        className="absolute bottom-8 text-white/20 text-xs font-heading tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        Click anywhere to skip
      </motion.span>
    </motion.div>
  );
}
