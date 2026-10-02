import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { buzz } from './native';

/** Remaining ms on the match clock. Survives refresh because it is derived from endsAt. */
export function useRemaining(): number {
  const timer = useStore((s) => s.timer);
  const timerDone = useStore((s) => s.timerDone);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [timer.running]);

  const left = timer.running ? Math.max(0, (timer.endsAt ?? 0) - now) : timer.leftMs;

  useEffect(() => {
    if (timer.running && left === 0) {
      timerDone();
      buzz();
    }
  }, [timer.running, left, timerDone]);

  return left;
}

export const formatClock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
