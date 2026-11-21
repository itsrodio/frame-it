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
  measureImageDimensions,
  readDesignImageFile,
  readFileAsDataUrl,
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

  it('covers clipboard files fallback, FileReader/Image dimension helpers, and edge-case smart/snap placements', async () => {
    const webpBlob = new Blob(['webp'], { type: 'image/webp' });
    expect(isSupportedDesignImage(webpBlob)).toBe(true);
    expect(
      isSupportedDesignImage(new Blob(['x'], { type: '' }), 'screen.jpg'),
    ).toBe(true);

    const pngFile = new File(['png'], 'paste.png', { type: 'image/png' });
    const filesOnlyClipboard = {
      items: [],
      files: [pngFile],
    } as unknown as DataTransfer;
    expect(extractImageFromClipboard(filesOnlyClipboard)).toEqual({
      file: pngFile,
      fileName: 'paste.png',
    });

    const nonImageClipboard = {
      items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }],
      files: [new File(['hi'], 'doc.txt', { type: 'text/plain' })],
    } as unknown as DataTransfer;
    expect(extractImageFromClipboard(nonImageClipboard)).toBeNull();

    // Edge cases for clamping & dimensions
    expect(clampOpacity(Number.NaN)).toBe(50);
    expect(clampScale(Number.NaN)).toBe(1);
    expect(clampScale(-2)).toBe(1);
    expect(calculateFitWidthScale(0, 1440)).toBe(1);
    expect(calculateCenteredX(0, 1, 1440)).toBe(0);

    // Smart placement branches:
    // Invalid dimensions
    expect(
      computeSmartDesignPlacement({
        naturalWidth: 0,
        naturalHeight: 0,
        viewportWidth: 1440,
        viewportHeight: 900,
        scrollX: 10,
        scrollY: 100,
        followScroll: false,
      }),
    ).toEqual({ x: 0, y: 0, scale: 1 });

    // Container 1x match
    expect(
      computeSmartDesignPlacement({
        naturalWidth: 1200,
        naturalHeight: 400,
        viewportWidth: 1440,
        viewportHeight: 900,
        scrollX: 0,
        scrollY: 50,
        followScroll: true,
        containerRect: { left: 120, top: 40, width: 1200 },
      }),
    ).toEqual({ x: 120, y: 90, scale: 1 });

    // Exact 1x viewport match
    expect(
      computeSmartDesignPlacement({
        naturalWidth: 1440,
        naturalHeight: 900,
        viewportWidth: 1440,
        viewportHeight: 900,
        scrollX: 0,
        scrollY: 0,
        followScroll: false,
      }),
    ).toEqual({ x: 0, y: 0, scale: 1 });

    // Exact 2x viewport match
    expect(
      computeSmartDesignPlacement({
        naturalWidth: 2880,
        naturalHeight: 1800,
        viewportWidth: 1440,
        viewportHeight: 900,
        scrollX: 0,
        scrollY: 0,
        followScroll: true,
      }),
    ).toEqual({ x: 0, y: 0, scale: 0.5 });

    // Wider than 2x viewport -> fit width
    expect(
      computeSmartDesignPlacement({
        naturalWidth: 4000,
        naturalHeight: 2000,
        viewportWidth: 1000,
        viewportHeight: 800,
        scrollX: 0,
        scrollY: 0,
        followScroll: true,
      }),
    ).toEqual({ x: 0, y: 0, scale: 0.25 });

    // Narrower than viewport -> 1x centered
    expect(
      computeSmartDesignPlacement({
        naturalWidth: 800,
        naturalHeight: 600,
        viewportWidth: 1200,
        viewportHeight: 800,
        scrollX: 0,
        scrollY: 0,
        followScroll: true,
      }),
    ).toEqual({ x: 200, y: 0, scale: 1 });

    // Snap to element branches: zero width, 1x match, arbitrary width
    expect(
      computeSnapToElementPlacement({
        naturalWidth: 0,
        rect: { left: 10, top: 20, width: 500 },
        scrollX: 5,
        scrollY: 15,
        followScroll: false,
      }),
    ).toEqual({ x: 10, y: 20, scale: 1 });

    expect(
      computeSnapToElementPlacement({
        naturalWidth: 500,
        rect: { left: 10, top: 20, width: 500 },
        scrollX: 0,
        scrollY: 0,
        followScroll: true,
      }),
    ).toEqual({ x: 10, y: 20, scale: 1 });

    expect(
      computeSnapToElementPlacement({
        naturalWidth: 1000,
        rect: { left: 10, top: 20, width: 250 },
        scrollX: 0,
        scrollY: 0,
        followScroll: true,
      }),
    ).toEqual({ x: 10, y: 20, scale: 0.25 });

    // readFileAsDataUrl, measureImageDimensions, readDesignImageFile error & success paths
    await expect(
      readDesignImageFile(
        new File(['txt'], 'readme.txt', { type: 'text/plain' }),
      ),
    ).rejects.toThrow('Unsupported image format');

    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      error: Error | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL(blob: Blob) {
        if (blob.size === 1) {
          this.result = new ArrayBuffer(4);
          this.onload?.();
          return;
        }
        if (blob.size === 2) {
          this.error = new Error('read failed');
          this.onerror?.();
          return;
        }
        this.result = 'data:image/png;base64,AAAA';
        this.onload?.();
      }
    }
    vi.spyOn(window, 'FileReader').mockImplementation(
      MockFileReader as unknown as typeof FileReader,
    );

    await expect(readFileAsDataUrl(new Blob(['a']))).rejects.toThrow(
      'Failed to read image as data URL',
    );
    await expect(readFileAsDataUrl(new Blob(['ab']))).rejects.toThrow(
      'read failed',
    );
    await expect(readFileAsDataUrl(new Blob(['abcd']))).resolves.toBe(
      'data:image/png;base64,AAAA',
    );

    class MockImage {
      naturalWidth = 0;
      naturalHeight = 0;
      width = 0;
      height = 0;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(val: string) {
        queueMicrotask(() => {
          if (val === 'bad') {
            this.onerror?.();
          } else {
            this.naturalWidth = 640;
            this.naturalHeight = 480;
            this.onload?.();
          }
        });
      }
    }
    vi.spyOn(window, 'Image').mockImplementation(
      MockImage as unknown as typeof Image,
    );

    await expect(measureImageDimensions('bad')).rejects.toThrow(
      'Failed to decode image dimensions',
    );
    await expect(measureImageDimensions('good')).resolves.toEqual({
      width: 640,
      height: 480,
    });

    const loadedImg = await readDesignImageFile(
      new File(['1234'], 'hero.png', { type: 'image/png' }),
    );
    expect(loadedImg).toEqual({
      imageUrl: 'data:image/png;base64,AAAA',
      fileName: 'hero.png',
      naturalWidth: 640,
      naturalHeight: 480,
    });

    // Storage edge cases: normalize null, load/clear error resilience
    expect(normalizeDesignOverlayState(null, false).locked).toBe(false);
    vi.spyOn(browser.storage.local, 'get').mockRejectedValueOnce(
      new Error('storage error'),
    );
    const fallbackLoad = await loadSiteDesignOverlay(false, 'https://err.test');
    expect(fallbackLoad.locked).toBe(false);

    vi.spyOn(browser.storage.local, 'remove').mockRejectedValueOnce(
      new Error('remove error'),
    );
    await expect(
      clearSiteDesignOverlay('https://err.test'),
    ).resolves.toBeUndefined();
  });
});
