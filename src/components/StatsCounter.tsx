import React, { useEffect, useRef, useState } from 'react';

interface StatsCounterProps {
  value: number;
  label: string;
  suffix?: string;
  duration?: number;
}

export const StatsCounter: React.FC<StatsCounterProps> = ({ value, label, suffix = '', duration = 2000 }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }

    startRef.current = null;
    const startValue = 0;

    function step(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(startValue + (value - startValue) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
      <span className="text-3xl sm:text-4xl font-black text-purple-400 tabular-nums">
        {display}{suffix}
      </span>
      <span className="text-xs text-zinc-400 font-medium mt-1 text-center">
        {label}
      </span>
    </div>
  );
};
