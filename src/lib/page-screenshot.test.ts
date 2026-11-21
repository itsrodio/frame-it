import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureFullPagePngBlob } from '@/lib/page-screenshot';

describe('captureFullPagePngBlob', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('hides FrameIt overlay, scrolls through all slices, stitches onto canvas, and restores state', async () => {
    const overlayHost = document.createElement('frameit-overlay');
    overlayHost.style.visibility = 'visible';
    document.body.appendChild(overlayHost);

    Object.defineProperty(window, 'innerWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollWidth', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 900,
      configurable: true,
    });

    let currentScrollY = 120;
    Object.defineProperty(window, 'scrollX', { value: 0, configurable: true });
    Object.defineProperty(window, 'scrollY', {
      get: () => currentScrollY,
      configurable: true,
    });

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(((
      opts?: ScrollToOptions | number,
    ) => {
      if (typeof opts === 'object' && opts !== null && 'top' in opts) {
        currentScrollY = opts.top ?? 0;
      }
    }) as typeof window.scrollTo);

    // Mock Image decoding so happy-dom doesn't need real PNG decoding
    class MockImage {
      width = 1000;
      height = 500;
      naturalWidth = 1000;
      naturalHeight = 500;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_val: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', MockImage);

    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    const expectedBlob = new Blob(['png-bytes'], { type: 'image/png' });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => {
      cb(expectedBlob);
    });

    const visibilitiesDuringCapture: string[] = [];
    const captureViewport = vi.fn(async () => {
      visibilitiesDuringCapture.push(overlayHost.style.visibility);
      return 'data:image/png;base64,SLICE';
    });

    const blob = await captureFullPagePngBlob({
      captureViewport,
      captureIntervalMs: 0,
      waitForPaint: async () => {},
    });

    expect(blob).toBe(expectedBlob);
    // Page is 900px tall with 500px viewport -> 2 slices at y=0 and y=400
    expect(captureViewport).toHaveBeenCalledTimes(2);
    expect(visibilitiesDuringCapture).toEqual(['hidden', 'hidden']);
    expect(overlayHost.style.visibility).toBe('visible');
    expect(drawImage).toHaveBeenNthCalledWith(
      1,
      expect.any(MockImage),
      0,
      0,
      1000,
      500,
    );
    expect(drawImage).toHaveBeenNthCalledWith(
      2,
      expect.any(MockImage),
      0,
      400,
      1000,
      500,
    );
    // Restores original scroll position (120)
    expect(scrollToSpy).toHaveBeenLastCalledWith({
      left: 0,
      top: 120,
      behavior: 'instant',
    });

    vi.unstubAllGlobals();
  });
});
