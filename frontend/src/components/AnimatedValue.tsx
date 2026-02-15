import { useEffect, useRef, useCallback } from 'react';
import { animate } from 'framer-motion';

interface AnimatedValueProps {
  value: number;
  formatter?: (v: number) => string;
  className?: string;
}

export function AnimatedValue({ value, formatter, className }: AnimatedValueProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(value);

  const format = useCallback(
    (v: number) => (formatter ? formatter(v) : v.toString()),
    [formatter],
  );

  useEffect(() => {
    const node = spanRef.current;
    if (!node) return;

    const from = prevRef.current;
    prevRef.current = value;

    // Skip animation if it's the first render
    if (from === value) {
      node.textContent = format(value);
      return;
    }

    const controls = animate(from, value, {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],  // spring-like overshoot
      onUpdate(latest) {
        node.textContent = format(latest);
      },
    });

    return () => controls.stop();
  }, [value, format]);

  return (
    <span ref={spanRef} className={className}>
      {format(value)}
    </span>
  );
}
