import { useMemo } from 'react';

interface AuraOverlayProps {
  carbonIntensity: number;
  electricityPrice: number;
}

/**
 * Full-viewport edge aura that breathes between green (clean grid)
 * and red (grid stress / high price).
 *
 * - carbon_intensity < 300  →  green aura
 * - electricity_price > 50  →  instantly red (overrides green)
 * - otherwise               →  no aura (fades out)
 */
export function AuraOverlay({ carbonIntensity, electricityPrice }: AuraOverlayProps) {
  const isStressed = electricityPrice > 50;
  const isClean = carbonIntensity < 300;
  const isActive = isStressed || isClean;

  // Pick color
  const color = useMemo(() => {
    if (isStressed) return { r: 239, g: 68, b: 68 };   // red-500
    if (isClean)    return { r: 16, g: 185, b: 129 };   // emerald-500
    return { r: 0, g: 0, b: 0 };
  }, [isStressed, isClean]);

  // Aura intensity: stressed = stronger, clean = softer
  const peakOpacity = isStressed ? 0.18 : 0.10;

  if (!isActive) return null;

  const rgba = (a: number) => `rgba(${color.r},${color.g},${color.b},${a})`;

  return (
    <div
      className="fixed inset-0 z-[5] pointer-events-none transition-opacity duration-700"
      aria-hidden="true"
    >
      {/* Top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-36 aura-breathe"
        style={{
          background: `linear-gradient(to bottom, ${rgba(peakOpacity)}, transparent)`,
        }}
      />
      {/* Bottom edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-36 aura-breathe"
        style={{
          background: `linear-gradient(to top, ${rgba(peakOpacity)}, transparent)`,
        }}
      />
      {/* Left edge */}
      <div
        className="absolute top-0 bottom-0 left-0 w-36 aura-breathe"
        style={{
          background: `linear-gradient(to right, ${rgba(peakOpacity * 0.7)}, transparent)`,
        }}
      />
      {/* Right edge */}
      <div
        className="absolute top-0 bottom-0 right-0 w-36 aura-breathe"
        style={{
          background: `linear-gradient(to left, ${rgba(peakOpacity * 0.7)}, transparent)`,
        }}
      />

      {/* Corner accents (brighter in the corners) */}
      <div
        className="absolute top-0 left-0 w-48 h-48 aura-breathe"
        style={{
          background: `radial-gradient(ellipse at top left, ${rgba(peakOpacity * 0.6)}, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-0 right-0 w-48 h-48 aura-breathe"
        style={{
          background: `radial-gradient(ellipse at top right, ${rgba(peakOpacity * 0.6)}, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 aura-breathe"
        style={{
          background: `radial-gradient(ellipse at bottom left, ${rgba(peakOpacity * 0.5)}, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-48 h-48 aura-breathe"
        style={{
          background: `radial-gradient(ellipse at bottom right, ${rgba(peakOpacity * 0.5)}, transparent 70%)`,
        }}
      />
    </div>
  );
}
