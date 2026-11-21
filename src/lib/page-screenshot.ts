const CAPTURE_INTERVAL_MS = 550;
const MAX_CANVAS_SIDE = 16384;

export interface CaptureViewportResponse {
  dataUrl?: string;
  error?: string;
}

export interface CapturePagePngOptions {
  captureViewport?: () => Promise<string>;
  captureIntervalMs?: number;
  waitForPaint?: () => Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function waitTwoFrames(): Promise<void> {
  if (typeof requestAnimationFrame !== 'function') {
    return sleep(32);
  }
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode captured viewport'));
    img.src = dataUrl;
  });
}

async function defaultCaptureViewport(): Promise<string> {
  const response = (await browser.runtime.sendMessage({
    type: 'CAPTURE_VISIBLE_TAB',
  })) as CaptureViewportResponse | undefined;

  if (!response?.dataUrl) {
    throw new Error(response?.error || 'Failed to capture visible tab');
  }
  return response.dataUrl;
}

/**
 * Captures a full-page PNG screenshot by scrolling through the document,
 * temporarily hiding FrameIt's overlay, requesting visible tab captures
 * from the background script, and stitching slices onto a single canvas.
 */
export async function captureFullPagePngBlob(
  options: CapturePagePngOptions = {},
): Promise<Blob> {
  const captureViewport = options.captureViewport ?? defaultCaptureViewport;
  const captureIntervalMs = options.captureIntervalMs ?? CAPTURE_INTERVAL_MS;
  const waitForPaint = options.waitForPaint ?? waitTwoFrames;

  const docEl = document.documentElement;
  const bodyEl = document.body;
  const viewportW = Math.max(
    docEl?.clientWidth ?? 0,
    window.innerWidth || 0,
    1,
  );
  const viewportH = Math.max(
    docEl?.clientHeight ?? 0,
    window.innerHeight || 0,
    1,
  );
  const pageW = Math.max(
    docEl?.scrollWidth ?? 0,
    bodyEl?.scrollWidth ?? 0,
    viewportW,
  );
  const pageH = Math.max(
    docEl?.scrollHeight ?? 0,
    bodyEl?.scrollHeight ?? 0,
    viewportH,
  );

  const origX = window.scrollX || 0;
  const origY = window.scrollY || 0;

  const overlayHosts = Array.from(
    document.querySelectorAll('frameit-overlay'),
  ).filter((el): el is HTMLElement => el instanceof HTMLElement);
  const previousVisibilities = overlayHosts.map((el) => el.style.visibility);

  const slices: Array<{ scrollY: number; img: HTMLImageElement }> = [];

  try {
    for (const host of overlayHosts) {
      host.style.visibility = 'hidden';
    }

    const maxScrollY = Math.max(0, pageH - viewportH);
    const yPositions: number[] = [];
    for (let y = 0; y < pageH; y += viewportH) {
      const clampedY = Math.min(y, maxScrollY);
      if (yPositions[yPositions.length - 1] !== clampedY) {
        yPositions.push(clampedY);
      }
      if (clampedY >= maxScrollY) break;
    }
    if (yPositions.length === 0) {
      yPositions.push(0);
    }

    let lastCaptureTime = 0;
    for (const targetY of yPositions) {
      window.scrollTo({ left: 0, top: targetY, behavior: 'instant' });
      await waitForPaint();

      const elapsed = Date.now() - lastCaptureTime;
      if (lastCaptureTime > 0 && elapsed < captureIntervalMs) {
        await sleep(captureIntervalMs - elapsed);
      }

      const actualY = window.scrollY ?? targetY;
      const dataUrl = await captureViewport();
      lastCaptureTime = Date.now();
      const img = await loadImageFromDataUrl(dataUrl);
      slices.push({ scrollY: actualY, img });
    }
  } finally {
    overlayHosts.forEach((host, idx) => {
      host.style.visibility = previousVisibilities[idx] ?? '';
    });
    window.scrollTo({ left: origX, top: origY, behavior: 'instant' });
  }

  const firstSlice = slices[0];
  if (!firstSlice) {
    throw new Error('No screenshot slices captured');
  }

  const dprX =
    (firstSlice.img.naturalWidth || firstSlice.img.width || viewportW) /
    viewportW;
  const dprY =
    (firstSlice.img.naturalHeight || firstSlice.img.height || viewportH) /
    viewportH;

  const rawWidth = Math.max(1, Math.round(pageW * dprX));
  const rawHeight = Math.max(1, Math.round(pageH * dprY));
  const clampScale = Math.min(
    1,
    MAX_CANVAS_SIDE / rawWidth,
    MAX_CANVAS_SIDE / rawHeight,
  );

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rawWidth * clampScale));
  canvas.height = Math.max(1, Math.round(rawHeight * clampScale));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  const drawW = Math.round(viewportW * dprX * clampScale);
  const drawH = Math.round(viewportH * dprY * clampScale);
  for (const slice of slices) {
    const destY = Math.round(slice.scrollY * dprY * clampScale);
    ctx.drawImage(slice.img, 0, destY, drawW, drawH);
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/png');
  });
  if (!blob) {
    throw new Error('Failed to encode PNG');
  }
  return blob;
}
