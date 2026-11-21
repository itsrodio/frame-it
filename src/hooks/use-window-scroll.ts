import { useEffect, useState } from 'react';

/**
 * Tracks window scroll position batched via requestAnimationFrame when `enabled` is true.
 */
export function useWindowScroll(enabled: boolean): { x: number; y: number } {
  const [scroll, setScroll] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    let rafId: number | null = null;

    const updateScroll = () => {
      rafId = null;
      const nextX = window.scrollX;
      const nextY = window.scrollY;
      setScroll((prev) =>
        prev.x === nextX && prev.y === nextY ? prev : { x: nextX, y: nextY },
      );
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateScroll);
      }
    };

    updateScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled]);

  return scroll;
}
