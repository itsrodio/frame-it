import { clampOpacity, clampScale } from '@/lib/design-overlay-image';
import type { DesignOverlayState } from '@/types/design-overlay';

export const DESIGN_OVERLAY_STORAGE_PREFIX = 'frameit:design-overlay:';

export function getDesignOverlayStorageKey(
  origin = typeof window !== 'undefined' ? window.location.origin : 'default',
): string {
  return `${DESIGN_OVERLAY_STORAGE_PREFIX}${origin}`;
}

export function buildDefaultDesignOverlayState(
  lockedByDefault = true,
): DesignOverlayState {
  return {
    enabled: true,
    imageUrl: null,
    fileName: null,
    naturalWidth: 0,
    naturalHeight: 0,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 50,
    blendMode: 'normal',
    locked: lockedByDefault,
    followScroll: true,
  };
}

export function normalizeDesignOverlayState(
  raw: Partial<DesignOverlayState> | null | undefined,
  lockedByDefault = true,
): DesignOverlayState {
  const defaults = buildDefaultDesignOverlayState(lockedByDefault);
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const imageUrl =
    typeof raw.imageUrl === 'string' && raw.imageUrl.length > 0
      ? raw.imageUrl
      : null;

  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : defaults.enabled,
    imageUrl,
    fileName:
      imageUrl && typeof raw.fileName === 'string' && raw.fileName.length > 0
        ? raw.fileName
        : null,
    naturalWidth:
      typeof raw.naturalWidth === 'number' && raw.naturalWidth > 0
        ? Math.round(raw.naturalWidth)
        : 0,
    naturalHeight:
      typeof raw.naturalHeight === 'number' && raw.naturalHeight > 0
        ? Math.round(raw.naturalHeight)
        : 0,
    x:
      typeof raw.x === 'number' && Number.isFinite(raw.x)
        ? Math.round(raw.x)
        : 0,
    y:
      typeof raw.y === 'number' && Number.isFinite(raw.y)
        ? Math.round(raw.y)
        : 0,
    scale:
      typeof raw.scale === 'number' ? clampScale(raw.scale) : defaults.scale,
    opacity:
      typeof raw.opacity === 'number'
        ? clampOpacity(raw.opacity)
        : defaults.opacity,
    blendMode: raw.blendMode === 'difference' ? 'difference' : 'normal',
    locked: typeof raw.locked === 'boolean' ? raw.locked : defaults.locked,
    followScroll:
      typeof raw.followScroll === 'boolean'
        ? raw.followScroll
        : defaults.followScroll,
  };
}

export async function loadSiteDesignOverlay(
  lockedByDefault = true,
  origin?: string,
): Promise<DesignOverlayState> {
  const key = getDesignOverlayStorageKey(origin);
  try {
    if (browser?.storage?.local?.get) {
      const result = await browser.storage.local.get(key);
      const raw = result?.[key] as Partial<DesignOverlayState> | undefined;
      return normalizeDesignOverlayState(raw, lockedByDefault);
    }
  } catch {
    // Ignore storage errors
  }
  return buildDefaultDesignOverlayState(lockedByDefault);
}

export async function saveSiteDesignOverlay(
  state: DesignOverlayState,
  origin?: string,
): Promise<{ ok: boolean; quotaExceeded: boolean }> {
  const key = getDesignOverlayStorageKey(origin);
  try {
    if (!state.imageUrl) {
      if (browser?.storage?.local?.remove) {
        await browser.storage.local.remove(key);
      }
      return { ok: true, quotaExceeded: false };
    }

    if (browser?.storage?.local?.set) {
      try {
        await browser.storage.local.set({ [key]: state });
        return { ok: true, quotaExceeded: false };
      } catch {
        // Evict stale design overlays from other origins and retry once
        if (browser.storage.local.get && browser.storage.local.remove) {
          const allItems = await browser.storage.local.get(null);
          const otherOverlayKeys = Object.keys(allItems ?? {}).filter(
            (existingKey) =>
              existingKey.startsWith(DESIGN_OVERLAY_STORAGE_PREFIX) &&
              existingKey !== key,
          );
          if (otherOverlayKeys.length > 0) {
            await browser.storage.local.remove(otherOverlayKeys);
            await browser.storage.local.set({ [key]: state });
            return { ok: true, quotaExceeded: false };
          }
        }
        return { ok: false, quotaExceeded: true };
      }
    }
  } catch {
    return { ok: false, quotaExceeded: true };
  }

  return { ok: true, quotaExceeded: false };
}

export async function clearSiteDesignOverlay(origin?: string): Promise<void> {
  const key = getDesignOverlayStorageKey(origin);
  try {
    if (browser?.storage?.local?.remove) {
      await browser.storage.local.remove(key);
    }
  } catch {
    // Ignore storage errors
  }
}
