import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_COLUMNS_SETTINGS,
  DEFAULT_GRID_SETTINGS,
  DEFAULT_LAYOUT_GUIDES_STATE,
  DEFAULT_ROWS_SETTINGS,
  LAYOUT_GUIDES_STORAGE_KEY,
} from '@/components/overlay/layout-guides/constants';
import * as containerDetector from '@/lib/container-detector';
import {
  clearSiteCustomState,
  getInitialGuidesSetup,
  runAutoDetectOrDefaults,
  saveSiteCustomState,
} from '@/lib/guides-storage';

describe('guides-storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('runAutoDetectOrDefaults', () => {
    it('returns default state when no container is detected', () => {
      vi.spyOn(
        containerDetector,
        'autoDetectPageContainer',
      ).mockReturnValueOnce(null);

      const result = runAutoDetectOrDefaults();
      expect(result).toEqual({
        state: DEFAULT_LAYOUT_GUIDES_STATE,
        trackedElement: null,
        trackedElementLabel: null,
      });
    });

    it('patches columns settings when a container is detected', () => {
      const el = document.createElement('main');
      vi.spyOn(
        containerDetector,
        'autoDetectPageContainer',
      ).mockReturnValueOnce({
        element: el,
        tagName: 'main',
        label: 'main.container',
        rect: el.getBoundingClientRect(),
        maxWidth: 1200,
        paddingInline: 32,
        columnCount: 12,
        columnGap: 24,
        alignment: 'stretch',
        offset: 0,
      });

      const result = runAutoDetectOrDefaults();
      expect(result.trackedElement).toBe(el);
      expect(result.trackedElementLabel).toBe('main.container');
      expect(result.state.columns.maxSize).toBe(1200);
      expect(result.state.columns.margin).toBe(32);
      expect(result.state.columns.gutter).toBe(24);
    });
  });

  describe('getInitialGuidesSetup, saveSiteCustomState, clearSiteCustomState', () => {
    it('removes legacy storage key and falls back to auto-detect when no custom state is stored', () => {
      window.localStorage.setItem('frameit:layout-guides', '{"legacy":true}');
      vi.spyOn(
        containerDetector,
        'autoDetectPageContainer',
      ).mockReturnValueOnce(null);

      const setup = getInitialGuidesSetup();
      expect(window.localStorage.getItem('frameit:layout-guides')).toBeNull();
      expect(setup.hasCustomSiteSettings).toBe(false);
      expect(setup.state).toEqual(DEFAULT_LAYOUT_GUIDES_STATE);
    });

    it('restores saved custom state and merges missing properties with defaults', () => {
      window.localStorage.setItem(
        LAYOUT_GUIDES_STORAGE_KEY,
        JSON.stringify({
          enabled: false,
          type: 'grid',
          columns: { count: 6 },
          grid: { size: 16 },
        }),
      );

      const setup = getInitialGuidesSetup();
      expect(setup.hasCustomSiteSettings).toBe(true);
      expect(setup.trackedElement).toBeNull();
      expect(setup.state).toEqual({
        enabled: false,
        type: 'grid',
        columns: { ...DEFAULT_COLUMNS_SETTINGS, count: 6 },
        rows: DEFAULT_ROWS_SETTINGS,
        grid: { ...DEFAULT_GRID_SETTINGS, size: 16 },
      });
    });

    it('saves and clears custom site state in localStorage', () => {
      saveSiteCustomState(DEFAULT_LAYOUT_GUIDES_STATE);
      expect(
        window.localStorage.getItem(LAYOUT_GUIDES_STORAGE_KEY),
      ).not.toBeNull();

      clearSiteCustomState();
      expect(window.localStorage.getItem(LAYOUT_GUIDES_STORAGE_KEY)).toBeNull();
    });

    it('gracefully handles corrupted JSON in localStorage', () => {
      window.localStorage.setItem(LAYOUT_GUIDES_STORAGE_KEY, '{invalid-json');
      vi.spyOn(
        containerDetector,
        'autoDetectPageContainer',
      ).mockReturnValueOnce(null);

      const setup = getInitialGuidesSetup();
      expect(setup.hasCustomSiteSettings).toBe(false);
      expect(setup.state).toEqual(DEFAULT_LAYOUT_GUIDES_STATE);
    });
  });
});
