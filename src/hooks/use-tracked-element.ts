import { useCallback, useEffect } from 'react';
import { extractContainerInfo } from '@/lib/container-detector';
import type { DetectedContainerInfo } from '@/types/layout-guides';

export interface UseTrackedElementOptions {
  trackedElement: HTMLElement | null;
  onSync: (info: DetectedContainerInfo) => void;
  onDisconnected: () => void;
}

/**
 * Synchronizes guide settings with a tracked DOM container on window or element resize via ResizeObserver.
 */
export function useTrackedElement({
  trackedElement,
  onSync,
  onDisconnected,
}: UseTrackedElementOptions) {
  const syncElement = useCallback(
    (el: HTMLElement) => {
      if (!document.body.contains(el)) {
        onDisconnected();
        return;
      }
      onSync(extractContainerInfo(el));
    },
    [onDisconnected, onSync],
  );

  useEffect(() => {
    if (!trackedElement) return;

    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncElement(trackedElement);
      });
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(trackedElement);
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [trackedElement, syncElement]);
}
