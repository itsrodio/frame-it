import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { getLanguageOverride, setLanguageOverride } from '@/lib/locale-manager';
import {
  DEFAULT_EXTENSION_SETTINGS,
  EXTENSION_SETTINGS_STORAGE_KEY,
  getCachedSettings,
  loadExtensionSettings,
  normalizeExtensionSettings,
  resetExtensionSettings,
  saveExtensionSettings,
  subscribeExtensionSettings,
} from '@/lib/settings-storage';

describe('settings-storage & locale-manager', () => {
  it('normalizes partial or invalid settings objects safely back to defaults', () => {
    expect(normalizeExtensionSettings(null)).toEqual(
      DEFAULT_EXTENSION_SETTINGS,
    );

    const normalized = normalizeExtensionSettings({
      language: 'invalid-lang' as never,
      theme: 'invalid-theme' as never,
      behavior: {
        autoDetectOnLaunch: false,
        defaultGuideType: 'grid',
      } as never,
      hotkeys: {
        enabled: false,
        toggleGuides: { code: '' } as never,
      } as never,
      defaultGuides: {
        columns: { count: 16 } as never,
      } as never,
    });

    expect(normalized.language).toBe('auto');
    expect(normalized.theme).toBe('system');
    expect(normalized.behavior.autoDetectOnLaunch).toBe(false);
    expect(normalized.behavior.defaultGuideType).toBe('grid');
    expect(normalized.hotkeys.enabled).toBe(false);
    expect(normalized.hotkeys.toggleGuides.code).toBe('KeyG');
    expect(normalized.defaultGuides.columns.count).toBe(16);
  });

  it('saves, loads, subscribes to changes, and resets extension settings via browser.storage.local', async () => {
    const events: string[] = [];
    const unsubscribe = subscribeExtensionSettings((updated) => {
      events.push(updated.language);
    });

    const customSettings = normalizeExtensionSettings({
      ...DEFAULT_EXTENSION_SETTINGS,
      language: 'ru',
      theme: 'dark',
    });

    await saveExtensionSettings(customSettings);
    expect(getCachedSettings().language).toBe('ru');
    expect(getLanguageOverride()).toBe('ru');
    expect(i18n.t('guides.types.columns')).toBe('Колонки');

    const loaded = await loadExtensionSettings();
    expect(loaded.language).toBe('ru');
    expect(loaded.theme).toBe('dark');
    expect(events).toContain('ru');

    const reset = await resetExtensionSettings();
    expect(reset).toEqual(DEFAULT_EXTENSION_SETTINGS);
    expect(getLanguageOverride()).toBe('auto');

    unsubscribe();
  });

  it('overrides i18n.t with positional substitutions when an explicit language is selected', () => {
    setLanguageOverride('de');
    expect(i18n.t('guides.types.columns')).toBe('Spalten');
    expect(i18n.t('picker.badgePadding', [24])).toBe('(Pad 24px)');
    expect(i18n.t('picker.badgeCols', [12])).toBe('12 Sp.');

    setLanguageOverride('auto');
    expect(i18n.t('guides.types.columns')).toBe('Columns');
  });

  it('falls back to localStorage when browser.storage.local throws and filters storage change events', async () => {
    window.localStorage.clear();

    const setSpy = vi
      .spyOn(browser.storage.local, 'set')
      .mockRejectedValue(new Error('storage disabled'));
    const getSpy = vi
      .spyOn(browser.storage.local, 'get')
      .mockRejectedValue(new Error('storage disabled'));

    const saved = await saveExtensionSettings({
      ...DEFAULT_EXTENSION_SETTINGS,
      theme: 'dark',
    });
    expect(saved.theme).toBe('dark');
    expect(
      window.localStorage.getItem(EXTENSION_SETTINGS_STORAGE_KEY),
    ).toContain('"dark"');

    const loaded = await loadExtensionSettings();
    expect(loaded.theme).toBe('dark');

    window.localStorage.removeItem(EXTENSION_SETTINGS_STORAGE_KEY);
    const defaultLoaded = await loadExtensionSettings();
    expect(defaultLoaded).toEqual(DEFAULT_EXTENSION_SETTINGS);

    setSpy.mockRestore();
    getSpy.mockRestore();

    const listener = vi.fn();
    const unsub = subscribeExtensionSettings(listener);
    await fakeBrowser.storage.onChanged.trigger(
      { [EXTENSION_SETTINGS_STORAGE_KEY]: { newValue: { theme: 'light' } } },
      'sync',
    );
    await fakeBrowser.storage.onChanged.trigger(
      { unrelated_key: { newValue: { theme: 'light' } } },
      'local',
    );
    expect(listener).not.toHaveBeenCalled();

    await fakeBrowser.storage.onChanged.trigger(
      { [EXTENSION_SETTINGS_STORAGE_KEY]: { newValue: { theme: 'light' } } },
      'local',
    );
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].theme).toBe('light');
    unsub();
  });
});
