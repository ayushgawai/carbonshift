import { useEffect, useRef } from 'react';

interface GridBackgroundProps {
  carbonIntensity: number;
  electricityPrice: number;
}

/* ═══════════════════════════════════════════════════════════════════
   Animated Gradient Orbs — award-winning style (Linear / Stripe)
   Large, softly morphing blobs that drift across the viewport.
   ═══════════════════════════════════════════════════════════════════ */

interface Orb {
  cx: number;      // center x (0-1 normalized)
  cy: number;      // center y (0-1 normalized)
  rx: number;      // radius x
  ry: number;      // radius y
  r: number;       // color
  g: number;
  b: number;
  alpha: number;
  speedX: number;
  speedY: number;
  morphSpeed: number;
  morphOffset: number;
  sizeBase: number; // base radius multiplier
}

interface RisingParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  wobbleOffset: number;
  shape: 'circle' | 'ring' | 'diamond';
}

// ── Network mesh nodes ──────────────────────────────────────────────

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COUNT = 35;
const CONNECTION_DIST = 160;
const RISING_PARTICLE_COUNT = 25;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function GridBackground({ carbonIntensity, electricityPrice }: GridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(carbonIntensity);
  const priceRef = useRef(electricityPrice);
  const animRef = useRef(0);

  useEffect(() => { intensityRef.current = carbonIntensity; }, [carbonIntensity]);
  useEffect(() => { priceRef.current = electricityPrice; }, [electricityPrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // ── Large gradient orbs (Stripe / Linear style) ──────────────────
    const orbs: Orb[] = [
      // Emerald — top-left, large
      { cx: 0.15, cy: 0.12, rx: 0, ry: 0, r: 16, g: 185, b: 129, alpha: 0.07,
        speedX: 0.008, speedY: 0.006, morphSpeed: 0.3, morphOffset: 0, sizeBase: 0.38 },
      // Teal — center-right
      { cx: 0.78, cy: 0.35, rx: 0, ry: 0, r: 20, g: 184, b: 166, alpha: 0.05,
        speedX: -0.006, speedY: 0.009, morphSpeed: 0.25, morphOffset: 1.5, sizeBase: 0.3 },
      // Mint — bottom-center
      { cx: 0.45, cy: 0.82, rx: 0, ry: 0, r: 110, g: 231, b: 183, alpha: 0.06,
        speedX: 0.007, speedY: -0.005, morphSpeed: 0.35, morphOffset: 3.0, sizeBase: 0.32 },
      // Sky blue — top-right (very subtle)
      { cx: 0.85, cy: 0.08, rx: 0, ry: 0, r: 125, g: 211, b: 252, alpha: 0.035,
        speedX: -0.005, speedY: 0.004, morphSpeed: 0.2, morphOffset: 4.5, sizeBase: 0.25 },
      // Warm green — center-left
      { cx: 0.25, cy: 0.55, rx: 0, ry: 0, r: 74, g: 222, b: 128, alpha: 0.04,
        speedX: 0.004, speedY: 0.007, morphSpeed: 0.28, morphOffset: 2.2, sizeBase: 0.22 },
    ];

    // ── Rising eco-particles ──────────────────────────────────────────
    const risingParticles: RisingParticle[] = Array.from({ length: RISING_PARTICLE_COUNT }, () => ({
      x: Math.random() * (w || 1920),
      y: Math.random() * (h || 1080),
      speed: 0.15 + Math.random() * 0.35,
      size: 1.5 + Math.random() * 3,
      alpha: 0.04 + Math.random() * 0.08,
      wobbleSpeed: 0.5 + Math.random() * 1.5,
      wobbleAmp: 15 + Math.random() * 25,
      wobbleOffset: Math.random() * Math.PI * 2,
      shape: (['circle', 'ring', 'diamond'] as const)[Math.floor(Math.random() * 3)],
    }));

    // ── Mesh network nodes ────────────────────────────────────────────
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * (w || 1920),
      y: Math.random() * (h || 1080),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));

    let frameCount = 0;

    const draw = () => {
      frameCount++;
      const time = frameCount * 0.016;
      const price = priceRef.current;
      const intensity = intensityRef.current;

      const stressFactor = Math.min(Math.max((price - 30) / 40, 0), 1);
      const cleanFactor = Math.max(0, 1 - intensity / 400);

      ctx.clearRect(0, 0, w, h);

      // ── 1. Large morphing gradient orbs ───────────────────────────
      for (const orb of orbs) {
        // Drift position
        orb.cx += Math.sin(time * orb.speedX + orb.morphOffset) * 0.0003;
        orb.cy += Math.cos(time * orb.speedY + orb.morphOffset) * 0.0003;

        // Keep in bounds
        orb.cx = Math.max(0.05, Math.min(0.95, orb.cx));
        orb.cy = Math.max(0.05, Math.min(0.95, orb.cy));

        // Morph radius (breathing effect)
        const breathe = 1 + 0.15 * Math.sin(time * orb.morphSpeed + orb.morphOffset);
        const stretchX = 1 + 0.1 * Math.sin(time * orb.morphSpeed * 0.7 + orb.morphOffset);
        const stretchY = 1 + 0.1 * Math.cos(time * orb.morphSpeed * 0.7 + orb.morphOffset + 1);

        const radiusX = w * orb.sizeBase * breathe * stretchX;
        const radiusY = h * orb.sizeBase * breathe * stretchY;

        const cx = orb.cx * w;
        const cy = orb.cy * h;

        // Draw elliptical gradient orb
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, radiusY / radiusX);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
        // Shift color slightly based on grid state
        const orbR = Math.round(lerp(orb.r, orb.r + 30 * stressFactor, 0.5));
        const orbG = Math.round(lerp(orb.g, orb.g - 20 * stressFactor, 0.5));
        const orbB = Math.round(lerp(orb.b, orb.b - 15 * stressFactor, 0.5));
        const orbAlpha = orb.alpha * (1 + cleanFactor * 0.3);

        grad.addColorStop(0, `rgba(${orbR},${orbG},${orbB},${orbAlpha})`);
        grad.addColorStop(0.4, `rgba(${orbR},${orbG},${orbB},${orbAlpha * 0.5})`);
        grad.addColorStop(0.7, `rgba(${orbR},${orbG},${orbB},${orbAlpha * 0.15})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ── 2. Mesh network (subtle) ─────────────────────────────────
      const meshAlpha = lerp(0.025, 0.05, stressFactor);
      const meshR = Math.round(lerp(16, 180, stressFactor));
      const meshG = Math.round(lerp(185, 100, stressFactor));
      const meshB = Math.round(lerp(129, 100, stressFactor));
      const meshSpeed = 0.1 * (1 + stressFactor * 0.8);

      for (const node of nodes) {
        node.x += node.vx * meshSpeed;
        node.y += node.vy * meshSpeed;
        if (node.x < 0 || node.x > w) { node.vx *= -1; node.x = Math.max(0, Math.min(w, node.x)); }
        if (node.y < 0 || node.y > h) { node.vy *= -1; node.y = Math.max(0, Math.min(h, node.y)); }
      }

      ctx.strokeStyle = `rgba(${meshR},${meshG},${meshB},${meshAlpha})`;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            ctx.globalAlpha = (1 - dist / CONNECTION_DIST) * meshAlpha;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Node dots
      ctx.fillStyle = `rgba(${meshR},${meshG},${meshB},${meshAlpha * 2.5})`;
      for (const node of nodes) {
        ctx.globalAlpha = meshAlpha * 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 3. Rising eco-particles ──────────────────────────────────
      for (const p of risingParticles) {
        // Rise upward
        p.y -= p.speed;
        // Wobble side to side
        const wobble = Math.sin(time * p.wobbleSpeed + p.wobbleOffset) * p.wobbleAmp * 0.02;
        p.x += wobble;

        // Respawn at bottom when off-screen
        if (p.y < -20) {
          p.y = h + 10 + Math.random() * 40;
          p.x = Math.random() * w;
        }
        // Wrap horizontal
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        // Fade near edges
        const edgeFade = Math.min(p.y / (h * 0.15), (h - p.y) / (h * 0.15), 1);
        const alpha = p.alpha * edgeFade * (1 + cleanFactor * 0.4);

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgba(16,185,129,${alpha * 1.5})`;
        ctx.fillStyle = `rgba(16,185,129,${alpha * 0.6})`;
        ctx.lineWidth = 0.8;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'ring') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Diamond
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x + p.size * 0.7, p.y);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.lineTo(p.x - p.size * 0.7, p.y);
          ctx.closePath();
          ctx.stroke();
        }
      }

      // ── 4. Horizontal aurora band (top of page) ──────────────────
      const auroraAlpha = 0.025 + cleanFactor * 0.015;
      const auroraShift = Math.sin(time * 0.1) * 80;

      const auroraGrad = ctx.createLinearGradient(0, 0, w, 0);
      auroraGrad.addColorStop(0, 'rgba(16,185,129,0)');
      auroraGrad.addColorStop(0.2 + Math.sin(time * 0.08) * 0.05, `rgba(16,185,129,${auroraAlpha})`);
      auroraGrad.addColorStop(0.4 + Math.sin(time * 0.06) * 0.05, `rgba(52,211,153,${auroraAlpha * 1.2})`);
      auroraGrad.addColorStop(0.6 + Math.cos(time * 0.07) * 0.05, `rgba(110,231,183,${auroraAlpha * 0.8})`);
      auroraGrad.addColorStop(0.8 + Math.cos(time * 0.09) * 0.04, `rgba(125,211,252,${auroraAlpha * 0.5})`);
      auroraGrad.addColorStop(1, 'rgba(125,211,252,0)');

      ctx.globalAlpha = 1;
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(-20 + auroraShift, 0, w + 40, h * 0.08);

      // Second softer aurora mid-page
      const aurora2Alpha = 0.012 + cleanFactor * 0.008;
      const aurora2Y = h * 0.45 + Math.sin(time * 0.04) * 30;
      const aurora2Grad = ctx.createLinearGradient(0, aurora2Y - 30, 0, aurora2Y + 30);
      aurora2Grad.addColorStop(0, 'rgba(52,211,153,0)');
      aurora2Grad.addColorStop(0.5, `rgba(52,211,153,${aurora2Alpha})`);
      aurora2Grad.addColorStop(1, 'rgba(52,211,153,0)');
      ctx.fillStyle = aurora2Grad;
      ctx.fillRect(0, aurora2Y - 30, w, 60);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />
      {/* Subtle grain texture overlay for premium feel */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
    </>
  );
}
