import {
  DEFAULT_COLUMNS_SETTINGS,
  DEFAULT_GRID_SETTINGS,
  DEFAULT_ROWS_SETTINGS,
} from '@/components/overlay/layout-guides/constants';
import { DEFAULT_HOTKEYS } from '@/lib/hotkeys';
import { setLanguageOverride } from '@/lib/locale-manager';
import type {
  ExtensionLanguage,
  ExtensionSettings,
  HotkeyBinding,
  SupportedLocale,
} from '@/types/settings';

export const EXTENSION_SETTINGS_STORAGE_KEY = 'frameit:extension-settings';

const VALID_LANGUAGES = new Set<ExtensionLanguage>([
  'auto',
  'en',
  'es',
  'zh_CN',
  'pt_BR',
  'de',
  'fr',
  'ru',
  'ja',
  'ko',
]);

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  language: 'auto',
  theme: 'system',
  behavior: {
    autoDetectOnLaunch: true,
    guidesEnabledByDefault: true,
    defaultGuideType: 'columns',
    rememberSiteSettings: true,
    holdToClose: true,
  },
  hotkeys: DEFAULT_HOTKEYS,
  defaultGuides: {
    columns: DEFAULT_COLUMNS_SETTINGS,
    rows: DEFAULT_ROWS_SETTINGS,
    grid: DEFAULT_GRID_SETTINGS,
  },
};

function sanitizeHotkeyBinding(
  raw: Partial<HotkeyBinding> | undefined,
  fallback: HotkeyBinding,
): HotkeyBinding {
  if (!raw || typeof raw.code !== 'string' || raw.code.trim().length === 0) {
    return fallback;
  }
  return {
    code: raw.code,
    shift: typeof raw.shift === 'boolean' ? raw.shift : fallback.shift,
    ctrlOrMeta:
      typeof raw.ctrlOrMeta === 'boolean'
        ? raw.ctrlOrMeta
        : fallback.ctrlOrMeta,
    alt: typeof raw.alt === 'boolean' ? raw.alt : fallback.alt,
  };
}

export function normalizeExtensionSettings(
  raw?: Partial<ExtensionSettings> | null,
): ExtensionSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_EXTENSION_SETTINGS;
  }

  const language: ExtensionLanguage =
    typeof raw.language === 'string' &&
    VALID_LANGUAGES.has(raw.language as ExtensionLanguage)
      ? (raw.language as SupportedLocale | 'auto')
      : DEFAULT_EXTENSION_SETTINGS.language;

  const theme =
    raw.theme === 'light' || raw.theme === 'dark' || raw.theme === 'system'
      ? raw.theme
      : DEFAULT_EXTENSION_SETTINGS.theme;

  const behavior =
    raw.behavior ?? ({} as Partial<ExtensionSettings['behavior']>);
  const hotkeys = raw.hotkeys ?? ({} as Partial<ExtensionSettings['hotkeys']>);
  const defaultGuides =
    raw.defaultGuides ?? ({} as Partial<ExtensionSettings['defaultGuides']>);

  return {
    language,
    theme,
    behavior: {
      autoDetectOnLaunch:
        typeof behavior.autoDetectOnLaunch === 'boolean'
          ? behavior.autoDetectOnLaunch
          : DEFAULT_EXTENSION_SETTINGS.behavior.autoDetectOnLaunch,
      guidesEnabledByDefault:
        typeof behavior.guidesEnabledByDefault === 'boolean'
          ? behavior.guidesEnabledByDefault
          : DEFAULT_EXTENSION_SETTINGS.behavior.guidesEnabledByDefault,
      defaultGuideType:
        behavior.defaultGuideType === 'columns' ||
        behavior.defaultGuideType === 'rows' ||
        behavior.defaultGuideType === 'grid'
          ? behavior.defaultGuideType
          : DEFAULT_EXTENSION_SETTINGS.behavior.defaultGuideType,
      rememberSiteSettings:
        typeof behavior.rememberSiteSettings === 'boolean'
          ? behavior.rememberSiteSettings
          : DEFAULT_EXTENSION_SETTINGS.behavior.rememberSiteSettings,
      holdToClose:
        typeof behavior.holdToClose === 'boolean'
          ? behavior.holdToClose
          : DEFAULT_EXTENSION_SETTINGS.behavior.holdToClose,
    },
    hotkeys: {
      enabled:
        typeof hotkeys.enabled === 'boolean'
          ? hotkeys.enabled
          : DEFAULT_HOTKEYS.enabled,
      toggleGuides: sanitizeHotkeyBinding(
        hotkeys.toggleGuides,
        DEFAULT_HOTKEYS.toggleGuides,
      ),
      toggleInspect: sanitizeHotkeyBinding(
        hotkeys.toggleInspect,
        DEFAULT_HOTKEYS.toggleInspect,
      ),
      autoDetect: sanitizeHotkeyBinding(
        hotkeys.autoDetect,
        DEFAULT_HOTKEYS.autoDetect,
      ),
      pickContainer: sanitizeHotkeyBinding(
        hotkeys.pickContainer,
        DEFAULT_HOTKEYS.pickContainer,
      ),
      switchColumns: sanitizeHotkeyBinding(
        hotkeys.switchColumns,
        DEFAULT_HOTKEYS.switchColumns,
      ),
      switchRows: sanitizeHotkeyBinding(
        hotkeys.switchRows,
        DEFAULT_HOTKEYS.switchRows,
      ),
      switchGrid: sanitizeHotkeyBinding(
        hotkeys.switchGrid,
        DEFAULT_HOTKEYS.switchGrid,
      ),
    },
    defaultGuides: {
      columns: {
        ...DEFAULT_COLUMNS_SETTINGS,
        ...defaultGuides.columns,
      },
      rows: {
        ...DEFAULT_ROWS_SETTINGS,
        ...defaultGuides.rows,
      },
      grid: {
        ...DEFAULT_GRID_SETTINGS,
        ...defaultGuides.grid,
      },
    },
  };
}

let cachedSettings: ExtensionSettings = DEFAULT_EXTENSION_SETTINGS;

export function getCachedSettings(): ExtensionSettings {
  return cachedSettings;
}

export function setCachedSettings(settings: ExtensionSettings): void {
  cachedSettings = normalizeExtensionSettings(settings);
  setLanguageOverride(cachedSettings.language);
}

export async function loadExtensionSettings(): Promise<ExtensionSettings> {
  try {
    if (browser?.storage?.local?.get) {
      const result = await browser.storage.local.get(
        EXTENSION_SETTINGS_STORAGE_KEY,
      );
      const raw = result?.[
        EXTENSION_SETTINGS_STORAGE_KEY
      ] as Partial<ExtensionSettings> | null;
      const normalized = normalizeExtensionSettings(raw);
      setCachedSettings(normalized);
      return normalized;
    }
  } catch {
    // Fallback if storage.local is unavailable or restricted
  }

  try {
    const fallbackRaw = window.localStorage.getItem(
      EXTENSION_SETTINGS_STORAGE_KEY,
    );
    if (fallbackRaw) {
      const normalized = normalizeExtensionSettings(JSON.parse(fallbackRaw));
      setCachedSettings(normalized);
      return normalized;
    }
  } catch {
    // Ignore localStorage fallback errors
  }

  setCachedSettings(DEFAULT_EXTENSION_SETTINGS);
  return DEFAULT_EXTENSION_SETTINGS;
}

export async function saveExtensionSettings(
  settings: ExtensionSettings,
): Promise<ExtensionSettings> {
  const normalized = normalizeExtensionSettings(settings);
  setCachedSettings(normalized);

  try {
    if (browser?.storage?.local?.set) {
      await browser.storage.local.set({
        [EXTENSION_SETTINGS_STORAGE_KEY]: normalized,
      });
      return normalized;
    }
  } catch {
    // Fallback to localStorage below
  }

  try {
    window.localStorage.setItem(
      EXTENSION_SETTINGS_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  } catch {
    // Ignore storage errors
  }

  return normalized;
}

export async function resetExtensionSettings(): Promise<ExtensionSettings> {
  setCachedSettings(DEFAULT_EXTENSION_SETTINGS);

  try {
    if (browser?.storage?.local?.remove) {
      await browser.storage.local.remove(EXTENSION_SETTINGS_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }

  try {
    window.localStorage.removeItem(EXTENSION_SETTINGS_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }

  return DEFAULT_EXTENSION_SETTINGS;
}

export function subscribeExtensionSettings(
  listener: (settings: ExtensionSettings) => void,
): () => void {
  const handleStorageChange = (
    changes: Record<string, { newValue?: unknown }>,
    areaName: string,
  ) => {
    if (areaName !== 'local') return;
    if (!(EXTENSION_SETTINGS_STORAGE_KEY in changes)) return;
    const nextValue = changes[EXTENSION_SETTINGS_STORAGE_KEY]
      ?.newValue as Partial<ExtensionSettings> | null;
    const normalized = normalizeExtensionSettings(nextValue);
    setCachedSettings(normalized);
    listener(normalized);
  };

  try {
    if (browser?.storage?.onChanged?.addListener) {
      browser.storage.onChanged.addListener(handleStorageChange);
      return () => {
        try {
          browser.storage.onChanged.removeListener(handleStorageChange);
        } catch {
          // Ignore removeListener errors
        }
      };
    }
  } catch {
    // Ignore if browser.storage.onChanged is not available
  }

  return () => {};
}
