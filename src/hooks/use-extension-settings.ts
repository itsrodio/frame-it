import { useCallback, useEffect, useRef, useState } from 'react';
import { setLanguageOverride } from '@/lib/locale-manager';
import {
  getCachedSettings,
  loadExtensionSettings,
  resetExtensionSettings,
  saveExtensionSettings,
  subscribeExtensionSettings,
} from '@/lib/settings-storage';
import type { ExtensionSettings } from '@/types/settings';

export interface UseExtensionSettingsOptions {
  onExternalChange?: (nextSettings: ExtensionSettings) => void;
}

export function useExtensionSettings(
  options: UseExtensionSettingsOptions = {},
) {
  const [settings, setSettings] =
    useState<ExtensionSettings>(getCachedSettings);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const onExternalChangeRef = useRef(options.onExternalChange);
  onExternalChangeRef.current = options.onExternalChange;

  useEffect(() => {
    let active = true;

    const applySettings = (nextSettings: ExtensionSettings) => {
      if (!active) return;
      if (
        JSON.stringify(settingsRef.current) === JSON.stringify(nextSettings)
      ) {
        return;
      }
      settingsRef.current = nextSettings;
      setLanguageOverride(nextSettings.language);
      setSettings(nextSettings);
      onExternalChangeRef.current?.(nextSettings);
    };

    void loadExtensionSettings().then(applySettings);
    const unsubscribe = subscribeExtensionSettings(applySettings);

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const persistSettings = useCallback(
    (
      nextOrUpdater:
        | ExtensionSettings
        | ((prev: ExtensionSettings) => ExtensionSettings),
    ) => {
      setSettings((prev) => {
        const next =
          typeof nextOrUpdater === 'function'
            ? nextOrUpdater(prev)
            : nextOrUpdater;
        settingsRef.current = next;
        setLanguageOverride(next.language);
        void saveExtensionSettings(next);
        return next;
      });
    },
    [],
  );

  const resetAllSettings = useCallback(async () => {
    const defaults = await resetExtensionSettings();
    settingsRef.current = defaults;
    setLanguageOverride(defaults.language);
    setSettings(defaults);
    return defaults;
  }, []);

  return {
    settings,
    persistSettings,
    resetAllSettings,
  };
}
