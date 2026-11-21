import { describe, expect, it, vi } from 'vitest';
import {
  calculateCenteredX,
  calculateFitWidthScale,
  clampOpacity,
  clampScale,
  computeSmartDesignPlacement,
  computeSnapToElementPlacement,
  extractImageFromClipboard,
  isSupportedDesignImage,
} from '@/lib/design-overlay-image';
import {
  buildDefaultDesignOverlayState,
  clearSiteDesignOverlay,
  DESIGN_OVERLAY_STORAGE_PREFIX,
  getDesignOverlayStorageKey,
  loadSiteDesignOverlay,
  normalizeDesignOverlayState,
  saveSiteDesignOverlay,
} from '@/lib/design-overlay-storage';

describe('design-overlay-image & design-overlay-storage', () => {
  it('validates supported image formats and extracts clipboard image files', () => {
    const pngFile = new File(['abc'], 'mockup.png', { type: 'image/png' });
    const webpFile = new File(['abc'], 'mockup.webp', { type: 'image/webp' });
    const svgByExt = new File(['<svg/>'], 'frame.svg', { type: '' });
    const txtFile = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    expect(isSupportedDesignImage(pngFile)).toBe(true);
    expect(isSupportedDesignImage(webpFile)).toBe(true);
    expect(isSupportedDesignImage(svgByExt)).toBe(true);
    expect(isSupportedDesignImage(txtFile)).toBe(false);

    const clipboard = {
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => pngFile,
        },
      ],
      files: [],
    } as unknown as DataTransfer;

    expect(extractImageFromClipboard(clipboard)).toEqual({
      file: pngFile,
      fileName: 'mockup.png',
    });
    expect(extractImageFromClipboard(null)).toBeNull();
  });

  it('computes clamped opacity, scale, fit-width scale, and centered X position', () => {
    expect(clampOpacity(-10)).toBe(0);
    expect(clampOpacity(150)).toBe(100);
    expect(clampOpacity(42.4)).toBe(42);

    expect(clampScale(0.01)).toBe(0.1);
    expect(clampScale(10)).toBe(4);
    expect(clampScale(0.5)).toBe(0.5);

    expect(calculateFitWidthScale(2880, 1440)).toBe(0.5);
    expect(calculateFitWidthScale(720, 1440)).toBe(2);
    expect(calculateCenteredX(1440, 1, 1920)).toBe(240);
    expect(calculateCenteredX(2880, 0.5, 1440)).toBe(0);
  });

  it('computes smart Retina/container placement and element snap placement', () => {
    // 2x Figma screenshot (2880x2048) pasted on 1920px viewport -> 0.5x (1440px) centered at x=240
    expect(
      computeSmartDesignPlacement({
        naturalWidth: 2880,
        naturalHeight: 2048,
        viewportWidth: 1920,
        viewportHeight: 1080,
        scrollX: 0,
        scrollY: 300,
        followScroll: true,
        containerRect: null,
      }),
    ).toEqual({ x: 240, y: 300, scale: 0.5 });

    // 2x container-cropped mockup (2400px) matching 1200px detected container at left=360
    expect(
      computeSmartDesignPlacement({
        naturalWidth: 2400,
        naturalHeight: 800,
        viewportWidth: 1920,
        viewportHeight: 1080,
        scrollX: 0,
        scrollY: 100,
        followScroll: true,
        containerRect: { left: 360, top: 80, width: 1200 },
      }),
    ).toEqual({ x: 360, y: 180, scale: 0.5 });

    // Snap to clicked page element
    expect(
      computeSnapToElementPlacement({
        naturalWidth: 1200,
        rect: { left: 100, top: 240, width: 600 },
        scrollX: 0,
        scrollY: 500,
        followScroll: true,
      }),
    ).toEqual({ x: 100, y: 740, scale: 0.5 });
  });

  it('normalizes, saves, loads, evicts on quota errors, and clears site design overlay state', async () => {
    const defaults = buildDefaultDesignOverlayState(true);
    expect(defaults.locked).toBe(true);
    expect(defaults.opacity).toBe(50);

    const normalized = normalizeDesignOverlayState(
      {
        imageUrl: 'data:image/png;base64,AAAA',
        fileName: 'hero.png',
        naturalWidth: 1440.4,
        naturalHeight: 900.2,
        x: 12.6,
        y: -4.2,
        scale: 0.5,
        opacity: 140,
        blendMode: 'difference',
        locked: false,
        followScroll: false,
      },
      true,
    );

    expect(normalized).toEqual({
      enabled: true,
      imageUrl: 'data:image/png;base64,AAAA',
      fileName: 'hero.png',
      naturalWidth: 1440,
      naturalHeight: 900,
      x: 13,
      y: -4,
      scale: 0.5,
      opacity: 100,
      blendMode: 'difference',
      locked: false,
      followScroll: false,
    });

    await saveSiteDesignOverlay(normalized, 'https://example.com');
    const loaded = await loadSiteDesignOverlay(true, 'https://example.com');
    expect(loaded).toEqual(normalized);

    // Clearing removes the site key
    await clearSiteDesignOverlay('https://example.com');
    const afterClear = await loadSiteDesignOverlay(true, 'https://example.com');
    expect(afterClear.imageUrl).toBeNull();

    // Evicts older site overlays if storage.local.set fails once with quota error
    const otherKey = `${DESIGN_OVERLAY_STORAGE_PREFIX}https://old-site.test`;
    await browser.storage.local.set({ [otherKey]: normalized });

    const originalSet = browser.storage.local.set.bind(browser.storage.local);
    let callCount = 0;
    const setSpy = vi
      .spyOn(browser.storage.local, 'set')
      .mockImplementation(async (items) => {
        callCount += 1;
        if (callCount === 1) {
          throw new Error('QUOTA_BYTES quota exceeded');
        }
        return originalSet(items);
      });

    const retryResult = await saveSiteDesignOverlay(
      normalized,
      'https://new-site.test',
    );
    expect(retryResult).toEqual({ ok: true, quotaExceeded: false });
    const checkOld = await browser.storage.local.get(otherKey);
    expect(checkOld[otherKey]).toBeUndefined();
    expect(getDesignOverlayStorageKey('https://new-site.test')).toBe(
      `${DESIGN_OVERLAY_STORAGE_PREFIX}https://new-site.test`,
    );

    setSpy.mockRejectedValue(new Error('QUOTA_BYTES quota exceeded'));
    const failedResult = await saveSiteDesignOverlay(
      normalized,
      'https://huge-site.test',
    );
    expect(failedResult).toEqual({ ok: false, quotaExceeded: true });
  });
});
