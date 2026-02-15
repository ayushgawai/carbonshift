import { useEffect, useRef, useState, useCallback } from 'react';
import { DollarSign, Leaf, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedValue } from './AnimatedValue';

interface ImpactMetricsProps {
  costSaved: number;
  carbonSaved: number;
  peaksAvoided: number;
}

// ── Floating delta particle ──────────────────────────────────────────

interface Particle {
  id: number;
  label: string;
}

function useFloatingParticles(value: number, formatter: (delta: number) => string) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value > prevRef.current && prevRef.current > 0) {
      const delta = value - prevRef.current;
      const id = Date.now() + Math.random();
      setParticles((prev) => [...prev, { id, label: formatter(delta) }]);
      const timeout = setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 1400);
      prevRef.current = value;
      return () => clearTimeout(timeout);
    }
    prevRef.current = value;
  }, [value, formatter]);

  return particles;
}

// ── Impact card sub-component ────────────────────────────────────────

interface ImpactCardProps {
  value: number;
  formatter: (v: number) => string;
  particleFormatter: (delta: number) => string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor: string;
}

function ImpactCard({
  value,
  formatter,
  particleFormatter,
  icon,
  title,
  subtitle,
  accentColor,
}: ImpactCardProps) {
  const particles = useFloatingParticles(value, particleFormatter);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.01)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.transform = '';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="card group relative overflow-hidden"
    >
      <div className="card-gradient-border" />

      {/* Floating particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, y: 0, x: 0 }}
            animate={{ opacity: 0, y: -36, x: Math.random() * 20 - 10 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: 'easeOut' }}
            className={`absolute top-4 right-5 text-sm font-bold pointer-events-none z-10 font-mono ${accentColor}`}
          >
            {p.label}
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="relative z-[1]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`${accentColor} opacity-60`}>
            {icon}
          </div>
          <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.15em]">{title}</p>
        </div>
        <AnimatedValue
          value={value}
          formatter={formatter}
          className="text-4xl sm:text-5xl font-bold font-mono tabular-nums text-gray-900"
        />
        <p className="text-[13px] text-gray-400 mt-2">{subtitle}</p>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

const formatCost = (v: number) => `$${v.toFixed(2)}`;
const formatCarbon = (v: number) =>
  v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatPeaks = (v: number) => Math.round(v).toString();
const deltaCost = (d: number) => `+$${d.toFixed(2)}`;
const deltaCarbon = (d: number) => `+${d.toFixed(2)}kg`;
const deltaPeaks = (d: number) => `+${Math.round(d)}`;

export function ImpactMetrics({ costSaved, carbonSaved, peaksAvoided }: ImpactMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ImpactCard
        value={costSaved}
        formatter={formatCost}
        particleFormatter={deltaCost}
        icon={<DollarSign className="w-5 h-5" />}
        title="Cost Saved"
        subtitle="Cumulative USD savings"
        accentColor="text-emerald-500"
      />
      <ImpactCard
        value={carbonSaved}
        formatter={formatCarbon}
        particleFormatter={deltaCarbon}
        icon={<Leaf className="w-5 h-5" />}
        title="Carbon Saved"
        subtitle="kg CO₂ avoided"
        accentColor="text-emerald-500"
      />
      <ImpactCard
        value={peaksAvoided}
        formatter={formatPeaks}
        particleFormatter={deltaPeaks}
        icon={<ShieldAlert className="w-5 h-5" />}
        title="Peaks Avoided"
        subtitle="Price spikes dodged"
        accentColor="text-blue-500"
      />
    </div>
  );
}
