import { LAYOUT_GUIDES_STORAGE_KEY } from '@/components/overlay/layout-guides/constants';
import {
  autoDetectPageContainer,
  containerInfoToColumnsPatch,
} from '@/lib/container-detector';
import { getCachedSettings } from '@/lib/settings-storage';
import type { LayoutGuidesState } from '@/types/layout-guides';
import type { ExtensionSettings } from '@/types/settings';

const LEGACY_STORAGE_KEY = 'frameit:layout-guides';

export function buildDefaultGuidesState(
  settings: ExtensionSettings = getCachedSettings(),
): LayoutGuidesState {
  return {
    enabled: settings.behavior.guidesEnabledByDefault,
    type: settings.behavior.defaultGuideType,
    columns: { ...settings.defaultGuides.columns },
    rows: { ...settings.defaultGuides.rows },
    grid: { ...settings.defaultGuides.grid },
  };
}

export function runAutoDetectOrDefaults(
  settings: ExtensionSettings = getCachedSettings(),
): {
  state: LayoutGuidesState;
  trackedElement: HTMLElement | null;
  trackedElementLabel: string | null;
} {
  const baseState = buildDefaultGuidesState(settings);

  if (settings.behavior.autoDetectOnLaunch) {
    const detected = autoDetectPageContainer();
    if (detected) {
      return {
        state: {
          ...baseState,
          columns: {
            ...baseState.columns,
            ...containerInfoToColumnsPatch(detected, baseState.columns),
          },
        },
        trackedElement: detected.element,
        trackedElementLabel: detected.label,
      };
    }
  }

  return {
    state: baseState,
    trackedElement: null,
    trackedElementLabel: null,
  };
}

/**
 * Resolves initial guide settings on page open:
 * 1. If per-site persistence is enabled and custom settings exist, restore them without overwriting via auto-detect.
 * 2. Otherwise run container auto-detection (if enabled) or fall back to extension defaults.
 */
export function getInitialGuidesSetup(
  settings: ExtensionSettings = getCachedSettings(),
): {
  state: LayoutGuidesState;
  trackedElement: HTMLElement | null;
  trackedElementLabel: string | null;
  hasCustomSiteSettings: boolean;
} {
  const baseState = buildDefaultGuidesState(settings);

  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);

    if (settings.behavior.rememberSiteSettings) {
      const raw = window.localStorage.getItem(LAYOUT_GUIDES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LayoutGuidesState>;
        return {
          state: {
            enabled:
              typeof parsed.enabled === 'boolean'
                ? parsed.enabled
                : baseState.enabled,
            type:
              parsed.type === 'columns' ||
              parsed.type === 'rows' ||
              parsed.type === 'grid'
                ? parsed.type
                : baseState.type,
            columns: {
              ...baseState.columns,
              ...parsed.columns,
            },
            rows: {
              ...baseState.rows,
              ...parsed.rows,
            },
            grid: {
              ...baseState.grid,
              ...parsed.grid,
            },
          },
          trackedElement: null,
          trackedElementLabel: null,
          hasCustomSiteSettings: true,
        };
      }
    }
  } catch {
    // Ignore storage errors (e.g. sandboxed iframes or disabled cookies)
  }

  return {
    ...runAutoDetectOrDefaults(settings),
    hasCustomSiteSettings: false,
  };
}

export function saveSiteCustomState(state: LayoutGuidesState): void {
  try {
    window.localStorage.setItem(
      LAYOUT_GUIDES_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    // Ignore storage quota or security errors
  }
}

export function clearSiteCustomState(): void {
  try {
    window.localStorage.removeItem(LAYOUT_GUIDES_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
