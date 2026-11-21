import { useCallback, useEffect, useRef, useState } from 'react';
import { autoDetectPageContainer } from '@/lib/container-detector';
import {
  calculateCenteredX,
  calculateFitWidthScale,
  computeSmartDesignPlacement,
  computeSnapToElementPlacement,
  readDesignImageFile,
} from '@/lib/design-overlay-image';
import {
  buildDefaultDesignOverlayState,
  clearSiteDesignOverlay,
  loadSiteDesignOverlay,
  saveSiteDesignOverlay,
} from '@/lib/design-overlay-storage';
import type { DesignOverlayState } from '@/types/design-overlay';
import type { DetectedContainerInfo } from '@/types/layout-guides';

export interface UseDesignOverlayOptions {
  lockedByDefault: boolean;
  onUnlock?: () => void;
}

/**
 * Manages design mockup overlay state, per-origin persistence, and placement actions.
 */
export function useDesignOverlay({
  lockedByDefault,
  onUnlock,
}: UseDesignOverlayOptions) {
  const [state, setState] = useState<DesignOverlayState>(() =>
    buildDefaultDesignOverlayState(lockedByDefault),
  );
  const [loaded, setLoaded] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const touchedRef = useRef(false);
  const onUnlockRef = useRef(onUnlock);
  onUnlockRef.current = onUnlock;

  useEffect(() => {
    let cancelled = false;
    loadSiteDesignOverlay(lockedByDefault).then((persisted) => {
      if (cancelled) return;
      if (!touchedRef.current) {
        setState(persisted);
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lockedByDefault]);

  useEffect(() => {
    if (!loaded) return;
    void saveSiteDesignOverlay(state).then((res) => {
      setQuotaExceeded(res.quotaExceeded);
    });
  }, [loaded, state]);

  const loadImage = useCallback(
    async (file: File | Blob, fileName?: string) => {
      const image = await readDesignImageFile(file, fileName);
      touchedRef.current = true;
      if (!lockedByDefault) {
        onUnlockRef.current?.();
      }
      const detectedContainer = autoDetectPageContainer();
      setState((prev) => {
        const hadImage = Boolean(prev.imageUrl);
        const smart = computeSmartDesignPlacement({
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          followScroll: prev.followScroll,
          containerRect: detectedContainer?.rect ?? null,
        });
        return {
          ...prev,
          enabled: true,
          imageUrl: image.imageUrl,
          fileName: image.fileName,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          x: hadImage ? prev.x : smart.x,
          y: hadImage ? prev.y : smart.y,
          scale: hadImage ? prev.scale : smart.scale,
          locked: hadImage ? prev.locked : lockedByDefault,
        };
      });
    },
    [lockedByDefault],
  );

  const patch = useCallback((nextPatch: Partial<DesignOverlayState>) => {
    touchedRef.current = true;
    if (nextPatch.locked === false) {
      onUnlockRef.current?.();
    }
    setState((prev) => ({ ...prev, ...nextPatch }));
  }, []);

  const toggleEnabled = useCallback((enabled: boolean) => {
    touchedRef.current = true;
    setState((prev) => ({ ...prev, enabled }));
  }, []);

  const toggleShortcut = useCallback(() => {
    touchedRef.current = true;
    setState((prev) =>
      prev.imageUrl ? { ...prev, enabled: !prev.enabled } : prev,
    );
  }, []);

  const toggleLock = useCallback(() => {
    touchedRef.current = true;
    setState((prev) => {
      if (!prev.imageUrl) return prev;
      const nextLocked = !prev.locked;
      if (!nextLocked) {
        onUnlockRef.current?.();
      }
      return { ...prev, locked: nextLocked };
    });
  }, []);

  const move = useCallback((x: number, y: number) => {
    touchedRef.current = true;
    setState((prev) => ({ ...prev, x, y }));
  }, []);

  const nudge = useCallback((dx: number, dy: number) => {
    touchedRef.current = true;
    setState((prev) => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  }, []);

  const centerHorizontal = useCallback(() => {
    touchedRef.current = true;
    setState((prev) => ({
      ...prev,
      x: calculateCenteredX(prev.naturalWidth, prev.scale, window.innerWidth),
    }));
  }, []);

  const fitToViewportWidth = useCallback(() => {
    touchedRef.current = true;
    setState((prev) => ({
      ...prev,
      scale: calculateFitWidthScale(prev.naturalWidth, window.innerWidth),
      x: 0,
    }));
  }, []);

  const autoFit = useCallback(() => {
    touchedRef.current = true;
    const detectedContainer = autoDetectPageContainer();
    setState((prev) => {
      if (!prev.imageUrl) return prev;
      const smart = computeSmartDesignPlacement({
        naturalWidth: prev.naturalWidth,
        naturalHeight: prev.naturalHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        followScroll: prev.followScroll,
        containerRect: detectedContainer?.rect ?? null,
      });
      return {
        ...prev,
        x: smart.x,
        y: smart.y,
        scale: smart.scale,
      };
    });
  }, []);

  const snapToElement = useCallback((info: DetectedContainerInfo) => {
    touchedRef.current = true;
    setState((prev) => {
      const snapped = computeSnapToElementPlacement({
        naturalWidth: prev.naturalWidth,
        rect: info.rect,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        followScroll: prev.followScroll,
      });
      return {
        ...prev,
        enabled: true,
        x: snapped.x,
        y: snapped.y,
        scale: snapped.scale,
      };
    });
  }, []);

  const resetPosition = useCallback(() => {
    touchedRef.current = true;
    setState((prev) => ({ ...prev, x: 0, y: 0 }));
  }, []);

  const clear = useCallback(() => {
    touchedRef.current = true;
    setQuotaExceeded(false);
    setState(buildDefaultDesignOverlayState(lockedByDefault));
    void clearSiteDesignOverlay();
  }, [lockedByDefault]);

  return {
    state,
    quotaExceeded,
    loadImage,
    patch,
    toggleEnabled,
    toggleShortcut,
    toggleLock,
    move,
    nudge,
    centerHorizontal,
    fitToViewportWidth,
    autoFit,
    snapToElement,
    resetPosition,
    clear,
  };
}
