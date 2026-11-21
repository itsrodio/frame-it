import { isOverlayElement } from '@/lib/dom-utils';
import {
  cleanFontFamily,
  extractGradientStops,
  extractInspectedStyles,
  type InspectedElementStyles,
  isTextBackgroundClip,
  parseCssColor,
  type RgbaColor,
  rgbaToHex,
} from '@/lib/inspect-styles';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isVisuallyHiddenElement(
  el: Element,
  style: CSSStyleDeclaration,
  rect: DOMRect,
): boolean {
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    Number.parseFloat(style.opacity || '1') === 0
  ) {
    return true;
  }

  if (
    el.classList.contains('sr-only') ||
    el.classList.contains('visually-hidden')
  ) {
    return true;
  }

  const clip = style.clip?.replace(/\s+/g, '');
  if (clip === 'rect(0px,0px,0px,0px)' || clip === 'rect(0,0,0,0)') {
    return true;
  }

  if (
    style.clipPath?.includes('inset(50%)') ||
    style.clipPath?.includes('inset(100%)')
  ) {
    return true;
  }

  if (
    rect.width <= 2 &&
    rect.height <= 2 &&
    (style.overflow === 'hidden' ||
      style.overflowX === 'hidden' ||
      style.overflowY === 'hidden')
  ) {
    return true;
  }

  return false;
}

const SYSTEM_SANS_FONTS = new Set([
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'sans-serif',
]);

const SYSTEM_MONO_FONTS = new Set([
  'ui-monospace',
  'sfmono-regular',
  'menlo',
  'monaco',
  'consolas',
  'monospace',
]);

function resolveFigmaFontFamily(rawFontFamily: string): string {
  const cleaned = cleanFontFamily(rawFontFamily);
  const lower = cleaned.toLowerCase();
  if (SYSTEM_SANS_FONTS.has(lower)) return 'Inter';
  if (SYSTEM_MONO_FONTS.has(lower)) return 'Roboto Mono';
  return cleaned;
}

/**
 * Finds the nearest ancestor with `overflow: hidden` / `text-overflow: ellipsis`
 * and its right boundary in viewport coordinates.
 */
function getClippingInfo(
  el: HTMLElement,
  rootEl: HTMLElement,
  rootRect: DOMRect,
): { clipRight: number; clipContainer: HTMLElement | null } {
  let curr: HTMLElement | null = el;
  let minRight = rootRect.right;
  let clipContainer: HTMLElement | null = null;

  while (curr && curr !== rootEl.parentElement) {
    const st = window.getComputedStyle(curr);
    if (
      st.overflow === 'hidden' ||
      st.overflowX === 'hidden' ||
      st.textOverflow === 'ellipsis'
    ) {
      const r = curr.getBoundingClientRect();
      if (r.width > 4 && r.right <= minRight) {
        minRight = r.right;
        clipContainer = curr;
      }
    }
    curr = curr.parentElement;
  }

  return { clipRight: minRight, clipContainer };
}

function truncateTextToWidth(
  text: string,
  maxWidthPx: number,
  fontSize: number,
): { text: string; truncated: boolean } {
  const avgCharW = fontSize * 0.54;
  const maxChars = Math.max(1, Math.floor(maxWidthPx / avgCharW));
  if (text.length <= maxChars) return { text, truncated: false };
  if (maxChars <= 1) return { text: '…', truncated: true };
  return {
    text: `${text.slice(0, maxChars - 1).trimEnd()}…`,
    truncated: true,
  };
}

interface TextLineFragment {
  text: string;
  x: number;
  y: number;
  right: number;
  truncated: boolean;
  clipContainer: HTMLElement | null;
}

function extractTextNodeLines(
  textNode: Text,
  parentEl: HTMLElement,
  rootEl: HTMLElement,
  rootRect: DOMRect,
  fontSize: number,
  lineHeightPx: number,
  truncatedContainers: Set<HTMLElement>,
): TextLineFragment[] {
  const raw = textNode.nodeValue ?? '';
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (!collapsed) return [];

  // Preserve whitespace before or after inline links (e.g., `hooks (` and `#15`).
  const hasLeadingSpace = /^\s/.test(raw);
  const hasTrailingSpace = /\s$/.test(raw);

  const { clipRight, clipContainer } = getClippingInfo(
    parentEl,
    rootEl,
    rootRect,
  );
  if (clipContainer && truncatedContainers.has(clipContainer)) {
    return [];
  }

  if (typeof document.createRange === 'function') {
    try {
      const fullRange = document.createRange();
      fullRange.selectNodeContents(textNode);
      const clientRects = Array.from(fullRange.getClientRects()).filter(
        (r) => r.width > 0 && r.height > 0,
      );

      if (clientRects.length === 1 && clientRects[0]) {
        const r = clientRects[0];
        // If text starts past the right boundary of an overflow:hidden container, it is fully clipped.
        if (r.left >= clipRight - 1) {
          if (clipContainer) truncatedContainers.add(clipContainer);
          return [];
        }

        const availWidth = Math.max(16, clipRight - r.left);
        const isOverflowing = r.right > clipRight + 2;
        const { text: finalText, truncated } = isOverflowing
          ? truncateTextToWidth(collapsed, availWidth, fontSize)
          : { text: collapsed, truncated: false };

        if (truncated && clipContainer) {
          truncatedContainers.add(clipContainer);
        }

        const paddedText =
          !truncated && (hasLeadingSpace || hasTrailingSpace)
            ? `${hasLeadingSpace ? ' ' : ''}${finalText}${hasTrailingSpace ? ' ' : ''}`
            : finalText;

        return [
          {
            text: paddedText,
            x: round1(r.left - rootRect.left),
            y: round1(r.top - rootRect.top + r.height * 0.8),
            right: round1(Math.min(r.right, clipRight) - rootRect.left),
            truncated,
            clipContainer,
          },
        ];
      }

      if (clientRects.length > 1) {
        const wordRegex = /\S+/g;
        const lines: Array<{
          words: string[];
          left: number;
          right: number;
          top: number;
          height: number;
        }> = [];
        let match = wordRegex.exec(raw);
        while (match !== null) {
          fullRange.setStart(textNode, match.index);
          fullRange.setEnd(textNode, match.index + match[0].length);
          const wRect = fullRange.getBoundingClientRect();
          if (wRect.width > 0 && wRect.height > 0) {
            const lastLine = lines[lines.length - 1];
            if (
              lastLine &&
              Math.abs(wRect.top - lastLine.top) <= fontSize * 0.55
            ) {
              lastLine.words.push(match[0]);
              lastLine.left = Math.min(lastLine.left, wRect.left);
              lastLine.right = Math.max(lastLine.right, wRect.right);
            } else {
              lines.push({
                words: [match[0]],
                left: wRect.left,
                right: wRect.right,
                top: wRect.top,
                height: wRect.height,
              });
            }
          }
          match = wordRegex.exec(raw);
        }

        if (lines.length > 0) {
          return lines
            .filter((line) => line.left < clipRight - 6)
            .map((line) => {
              const joined = line.words.join(' ');
              const availWidth = Math.max(16, clipRight - line.left);
              const { text, truncated } =
                line.right > clipRight + 2
                  ? truncateTextToWidth(joined, availWidth, fontSize)
                  : { text: joined, truncated: false };
              if (truncated && clipContainer) {
                truncatedContainers.add(clipContainer);
              }
              return {
                text,
                x: round1(line.left - rootRect.left),
                y: round1(line.top - rootRect.top + line.height * 0.8),
                right: round1(Math.min(line.right, clipRight) - rootRect.left),
                truncated,
                clipContainer,
              };
            });
        }
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback when Range yields no clientRects (e.g., happy-dom or <relative-time>).
  const pRect = parentEl.getBoundingClientRect();
  if (pRect.width > 0 && pRect.left >= clipRight - 6) {
    if (clipContainer) truncatedContainers.add(clipContainer);
    return [];
  }

  const pStyle = window.getComputedStyle(parentEl);
  const padLeft = Number.parseFloat(pStyle.paddingLeft) || 0;
  const padRight = Number.parseFloat(pStyle.paddingRight) || 0;
  const padTop = Number.parseFloat(pStyle.paddingTop) || 0;

  const baseX = round1(
    (pRect.width > 0 ? pRect.left - rootRect.left : 0) + padLeft,
  );
  const baseTop = (pRect.height > 0 ? pRect.top - rootRect.top : 0) + padTop;
  const firstBaselineY =
    baseTop + (lineHeightPx - fontSize) / 2 + fontSize * 0.8;

  // Never wrap single-line or white-space:nowrap boxes onto multiple lines.
  const isSingleLineBox =
    pStyle.whiteSpace === 'nowrap' ||
    pStyle.whiteSpace === 'pre' ||
    (pRect.height > 0 && pRect.height < lineHeightPx * 1.65);

  if (isSingleLineBox) {
    const estWidth = round1(collapsed.length * fontSize * 0.52);
    return [
      {
        text: collapsed,
        x: baseX,
        y: round1(firstBaselineY),
        right: round1(baseX + estWidth),
        truncated: false,
        clipContainer,
      },
    ];
  }

  const baseW = pRect.width > 0 ? pRect.width : rootRect.width;
  const innerW = Math.max(fontSize * 2, baseW - padLeft - padRight);
  const maxChars = Math.max(4, Math.floor(innerW / (fontSize * 0.54)));

  const words = collapsed.split(' ').filter(Boolean);
  const wrapped: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`;
    } else {
      wrapped.push(current);
      current = word;
    }
  }
  if (current) wrapped.push(current);

  return wrapped.map((text, idx) => ({
    text,
    x: baseX,
    y: round1(firstBaselineY + idx * lineHeightPx),
    right: round1(baseX + text.length * fontSize * 0.52),
    truncated: false,
    clipContainer,
  }));
}

function serializeInlineSvg(
  svgEl: Element,
  rootRect: DOMRect,
  fallbackColorHex: string,
): string {
  const sRect = svgEl.getBoundingClientRect();
  const w = Math.max(
    1,
    round1(sRect.width || Number(svgEl.getAttribute('width')) || 16),
  );
  const h = Math.max(
    1,
    round1(sRect.height || Number(svgEl.getAttribute('height')) || 16),
  );
  const x = round1(sRect.width > 0 ? sRect.left - rootRect.left : 0);
  const y = round1(sRect.height > 0 ? sRect.top - rootRect.top : 0);

  const clone = svgEl.cloneNode(true) as Element;
  clone.removeAttribute('class');
  clone.removeAttribute('style');
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('x', String(x));
  clone.setAttribute('y', String(y));
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  if (!clone.getAttribute('fill')) {
    clone.setAttribute('fill', fallbackColorHex);
  }

  for (const child of Array.from(clone.querySelectorAll('*'))) {
    child.removeAttribute('class');
  }

  return clone.outerHTML.replace(/currentColor/gi, fallbackColorHex);
}

/**
 * Draws an image source (`HTMLImageElement` or `ImageBitmap`) onto a `<canvas>`
 * respecting `object-fit: cover` and returns a `data:image/png;base64,...` URL
 * (Figma SVG `<image>` supports PNG and JPEG, not `data:image/webp`).
 */
function drawSourceToPngDataUrl(
  source: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  targetW: number,
  targetH: number,
  objectFit: string,
): string | null {
  try {
    if (sourceW <= 0 || sourceH <= 0) return null;

    const canvas = document.createElement('canvas');
    const scale = Math.min(2, 1200 / Math.max(targetW, targetH, 1));
    canvas.width = Math.max(1, Math.round(targetW * scale));
    canvas.height = Math.max(1, Math.round(targetH * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let sx = 0;
    let sy = 0;
    let sw = sourceW;
    let sh = sourceH;

    if (objectFit === 'cover' && sourceW > 0 && sourceH > 0) {
      const targetRatio = targetW / targetH;
      const natRatio = sourceW / sourceH;
      if (natRatio > targetRatio) {
        sw = sourceH * targetRatio;
        sx = (sourceW - sw) / 2;
      } else {
        sh = sourceW / targetRatio;
        sy = (sourceH - sh) / 2;
      }
    }

    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl.startsWith('data:image/png') ? dataUrl : null;
  } catch {
    return null;
  }
}

function imageElementToCanvasDataUrl(
  imgEl: HTMLImageElement,
  targetW: number,
  targetH: number,
  objectFit: string,
): string | null {
  return drawSourceToPngDataUrl(
    imgEl,
    imgEl.naturalWidth || targetW,
    imgEl.naturalHeight || targetH,
    targetW,
    targetH,
    objectFit,
  );
}

async function blobToPngDataUrl(
  blob: Blob,
  targetW: number,
  targetH: number,
  objectFit: string,
): Promise<string | null> {
  // Convert WebP / AVIF / JPEG blobs via ImageBitmap + Canvas to PNG for Figma compatibility.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob);
      const pngUrl = drawSourceToPngDataUrl(
        bitmap,
        bitmap.width,
        bitmap.height,
        targetW,
        targetH,
        objectFit,
      );
      bitmap.close?.();
      if (pngUrl) return pngUrl;
    } catch {
      // Fallback below
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * Asynchronously prepares `data:image/png;base64,...` URLs for all `<img>` elements inside `rootEl`
 * (converting `.webp` and `.avif` to PNG because Figma's SVG importer rejects WebP).
 */
export async function preloadImagesForFigma(
  rootEl: HTMLElement,
): Promise<Map<HTMLImageElement, string>> {
  const map = new Map<HTMLImageElement, string>();
  const imgs: HTMLImageElement[] =
    rootEl instanceof HTMLImageElement
      ? [rootEl]
      : Array.from(rootEl.querySelectorAll('img')).filter(
          (img) => !isOverlayElement(img),
        );

  await Promise.all(
    imgs.map(async (img) => {
      const rect = img.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width || img.width || 100));
      const h = Math.max(1, Math.round(rect.height || img.height || 100));
      const style = window.getComputedStyle(img);
      const objectFit = style.objectFit || 'cover';

      const canvasDataUrl = imageElementToCanvasDataUrl(img, w, h, objectFit);
      if (canvasDataUrl) {
        map.set(img, canvasDataUrl);
        return;
      }

      const src = img.currentSrc || img.getAttribute('src') || img.src;
      if (!src) return;
      if (
        src.startsWith('data:image/png') ||
        src.startsWith('data:image/jpeg')
      ) {
        map.set(img, src);
        return;
      }

      try {
        const res = await fetch(src);
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await blobToPngDataUrl(blob, w, h, objectFit);
        if (dataUrl?.startsWith('data:image/')) {
          map.set(img, dataUrl);
        }
      } catch {
        // Ignore network/CORS errors
      }
    }),
  );

  return map;
}

function serializeImageElement(
  imgEl: HTMLImageElement,
  rootRect: DOMRect,
  style: CSSStyleDeclaration,
  preloadedImages?: Map<HTMLImageElement, string>,
): string | null {
  const iRect = imgEl.getBoundingClientRect();
  const w = Math.max(
    1,
    round1(iRect.width || Number(imgEl.getAttribute('width')) || 100),
  );
  const h = Math.max(
    1,
    round1(iRect.height || Number(imgEl.getAttribute('height')) || 100),
  );
  const x = round1(iRect.width > 0 ? iRect.left - rootRect.left : 0);
  const y = round1(iRect.height > 0 ? iRect.top - rootRect.top : 0);

  const dataUrl =
    preloadedImages?.get(imgEl) ??
    imageElementToCanvasDataUrl(imgEl, w, h, style.objectFit || 'cover') ??
    imgEl.currentSrc ??
    imgEl.getAttribute('src') ??
    imgEl.src;

  if (!dataUrl) return null;

  const escapedHref = escapeXml(dataUrl);
  const preserveAspectRatio =
    style.objectFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';

  return `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${escapedHref}" xlink:href="${escapedHref}" preserveAspectRatio="${preserveAspectRatio}" />`;
}

interface SvgTextSpan {
  text: string;
  fill: string;
  opacityAttr: string;
  fontWeight: string;
  fontStyleAttr: string;
}

interface SvgLayerItem {
  kind: 'raw' | 'text';
  raw?: string;
  x?: number;
  y?: number;
  right?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyleAttr?: string;
  fill?: string;
  opacityAttr?: string;
  spans?: SvgTextSpan[];
}

export interface BuildFigmaSvgOptions {
  maxDepth?: number;
  frameLabel?: string;
}

export function buildFigmaSvg(
  el: HTMLElement,
  styles: InspectedElementStyles,
  rect: DOMRect,
  preloadedImages?: Map<HTMLImageElement, string>,
  options?: BuildFigmaSvgOptions,
): string {
  const maxDepth = options?.maxDepth ?? 24;
  const tag = el.tagName.toLowerCase();
  const rootTextHex = styles.colors.text.hex.slice(0, 7);

  if (tag === 'svg') {
    const clone = el.cloneNode(true) as Element;
    clone.removeAttribute('class');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(Math.max(1, styles.width)));
    clone.setAttribute('height', String(Math.max(1, styles.height)));
    return clone.outerHTML.replace(/currentColor/gi, rootTextHex);
  }

  const w = Math.max(1, styles.width);
  const h = Math.max(1, styles.height);
  const defs: string[] = [];
  const layerItems: SvgLayerItem[] = [];
  const truncatedContainers = new Set<HTMLElement>();
  let gradCounter = 0;

  const registerGradient = (stops: RgbaColor[], horizontal = false): string => {
    gradCounter += 1;
    const id = `frameit-grad-${gradCounter}`;
    const x2 = horizontal ? '100%' : '0%';
    const y2 = horizontal ? '0%' : '100%';
    const stopTags = stops.map((stop, idx) => {
      const pct =
        stops.length === 1 ? 0 : Math.round((idx / (stops.length - 1)) * 100);
      const hex6 = rgbaToHex({ ...stop, a: 1 });
      const opacityAttr = stop.a < 1 ? ` stop-opacity="${round2(stop.a)}"` : '';
      return `      <stop offset="${pct}%" stop-color="${hex6}"${opacityAttr} />`;
    });
    defs.push(
      `    <linearGradient id="${id}" x1="0%" y1="0%" x2="${x2}" y2="${y2}">\n${stopTags.join('\n')}\n    </linearGradient>`,
    );
    return `url(#${id})`;
  };

  const pushRaw = (raw: string) => {
    layerItems.push({ kind: 'raw', raw });
  };

  const pushText = (
    line: TextLineFragment,
    fontFamily: string,
    fontSize: number,
    fontWeight: string,
    fontStyleAttr: string,
    fill: string,
    opacityAttr: string,
  ) => {
    const last = layerItems[layerItems.length - 1];
    // Align consecutive inline text fragments of the same font size on the same visual line
    // (e.g., italic `<em>` after normal text) to the first fragment's baseline Y so italics don't shift upward.
    let alignedY = line.y;
    if (
      last &&
      last.kind === 'text' &&
      last.x !== undefined &&
      last.y !== undefined &&
      last.fontSize === fontSize &&
      line.x > last.x &&
      Math.abs(last.y - line.y) <= fontSize * 0.3
    ) {
      alignedY = last.y;
    }

    // Merge only contiguous inline spans sharing font-family and font-weight via `<tspan>`,
    // keeping separate flex items at their exact X coordinates.
    if (
      last &&
      last.kind === 'text' &&
      last.x !== undefined &&
      last.y !== undefined &&
      last.right !== undefined &&
      last.fontSize === fontSize &&
      last.fontFamily === fontFamily &&
      last.fontWeight === fontWeight &&
      Math.abs(last.y - alignedY) <= 1.5 &&
      line.x >= last.x &&
      line.x - last.right <= 3
    ) {
      last.spans?.push({
        text: line.text,
        fill,
        opacityAttr,
        fontWeight,
        fontStyleAttr,
      });
      last.right = Math.max(last.right, line.right);
      return;
    }

    layerItems.push({
      kind: 'text',
      x: line.x,
      y: alignedY,
      right: line.right,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyleAttr,
      fill,
      opacityAttr,
      spans: [
        {
          text: line.text,
          fill,
          opacityAttr,
          fontWeight,
          fontStyleAttr,
        },
      ],
    });
  };

  const walkElement = (node: Element, depth: number) => {
    if (depth > maxDepth) return;
    const nodeTag = node.tagName.toLowerCase();
    if (
      nodeTag === 'script' ||
      nodeTag === 'style' ||
      nodeTag === 'noscript' ||
      nodeTag === 'template'
    ) {
      return;
    }

    const isRoot = node === el;
    if (!isRoot && isOverlayElement(node)) {
      return;
    }
    const nRect = isRoot ? rect : node.getBoundingClientRect();
    const nStyle = window.getComputedStyle(node);

    if (isVisuallyHiddenElement(node, nStyle, nRect)) {
      return;
    }

    if (nodeTag === 'svg') {
      const iconColor = parseCssColor(nStyle.color);
      const iconHex = iconColor
        ? rgbaToHex({ ...iconColor, a: 1 })
        : rootTextHex;
      pushRaw(`    ${serializeInlineSvg(node, rect, iconHex)}`);
      return;
    }

    if (nodeTag === 'img' && node instanceof HTMLImageElement) {
      const imgTag = serializeImageElement(node, rect, nStyle, preloadedImages);
      if (imgTag) {
        pushRaw(`    ${imgTag}`);
      }
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    const isDisplayContents = nStyle.display === 'contents';
    const nw = isRoot ? w : round1(nRect.width);
    const nh = isRoot ? h : round1(nRect.height);
    if (!isRoot && !isDisplayContents && (nw <= 0 || nh <= 0)) return;

    const nx = isRoot ? 0 : round1(nRect.left - rect.left);
    const ny = isRoot ? 0 : round1(nRect.top - rect.top);

    if (!isDisplayContents) {
      const rawRadius = Number.parseFloat(nStyle.borderRadius) || 0;
      const rx = Math.max(
        0,
        Math.min(round1(nw / 2), round1(nh / 2), round1(rawRadius)),
      );

      const bgColor = parseCssColor(nStyle.backgroundColor);
      const clipIsText = isTextBackgroundClip(nStyle);
      const gradStops = !clipIsText
        ? extractGradientStops(nStyle.backgroundImage)
        : [];

      const bt = round1(Number.parseFloat(nStyle.borderTopWidth) || 0);
      const br = round1(
        Number.parseFloat(nStyle.borderRightWidth || nStyle.borderTopWidth) ||
          0,
      );
      const bb = round1(
        Number.parseFloat(nStyle.borderBottomWidth || nStyle.borderTopWidth) ||
          0,
      );
      const bl = round1(
        Number.parseFloat(nStyle.borderLeftWidth || nStyle.borderTopWidth) || 0,
      );
      const hasUniformBorder = bt > 0 && bt === br && bt === bb && bt === bl;
      const topBorderColor =
        bt > 0 ? parseCssColor(nStyle.borderTopColor) : null;
      const bottomBorderColor =
        bb > 0
          ? parseCssColor(nStyle.borderBottomColor || nStyle.borderTopColor)
          : null;

      // Always preserve the resolved page/section background on container roots so copied blocks
      // do not appear on Figma's transparent dark canvas.
      const isContainerRoot = isRoot && el.children.length > 0;
      const hasBoxFill =
        bgColor !== null ||
        gradStops.length > 0 ||
        (isRoot && (!styles.colors.isInheritedBackground || isContainerRoot));

      if (hasBoxFill || (hasUniformBorder && topBorderColor)) {
        let fillAttr = 'fill="none"';
        if (gradStops.length > 0) {
          const isHorizontal =
            nw > nh * 2 ||
            nStyle.backgroundImage.includes('90deg') ||
            nStyle.backgroundImage.includes('to right');
          const gradUrl = registerGradient(gradStops, isHorizontal);
          fillAttr = `fill="${gradUrl}"`;
        } else if (bgColor) {
          const hex6 = rgbaToHex({ ...bgColor, a: 1 });
          const opacityAttr =
            bgColor.a < 1 ? ` fill-opacity="${round2(bgColor.a)}"` : '';
          fillAttr = `fill="${hex6}"${opacityAttr}`;
        } else if (
          isRoot &&
          (!styles.colors.isInheritedBackground || isContainerRoot)
        ) {
          fillAttr = `fill="${styles.colors.background.hex.slice(0, 7)}"`;
        }

        let strokeAttr = '';
        if (hasUniformBorder && topBorderColor) {
          const bHex6 = rgbaToHex({ ...topBorderColor, a: 1 });
          const bOpacity =
            topBorderColor.a < 1
              ? ` stroke-opacity="${round2(topBorderColor.a)}"`
              : '';
          strokeAttr = ` stroke="${bHex6}"${bOpacity} stroke-width="${bt}"`;
        }

        const posAttrs = nx !== 0 || ny !== 0 ? `x="${nx}" y="${ny}" ` : '';
        const rxAttr = rx > 0 ? ` rx="${rx}"` : '';
        pushRaw(
          `    <rect ${posAttrs}width="${nw}" height="${nh}"${rxAttr} ${fillAttr}${strokeAttr} />`,
        );
      }

      if (!hasUniformBorder) {
        if (bt > 0 && topBorderColor) {
          const hex6 = rgbaToHex({ ...topBorderColor, a: 1 });
          const op =
            topBorderColor.a < 1
              ? ` stroke-opacity="${round2(topBorderColor.a)}"`
              : '';
          pushRaw(
            `    <line x1="${nx}" y1="${ny}" x2="${round1(nx + nw)}" y2="${ny}" stroke="${hex6}"${op} stroke-width="${bt}" />`,
          );
        }
        if (bb > 0 && bottomBorderColor) {
          const hex6 = rgbaToHex({ ...bottomBorderColor, a: 1 });
          const op =
            bottomBorderColor.a < 1
              ? ` stroke-opacity="${round2(bottomBorderColor.a)}"`
              : '';
          const by = round1(ny + nh);
          pushRaw(
            `    <line x1="${nx}" y1="${by}" x2="${round1(nx + nw)}" y2="${by}" stroke="${hex6}"${op} stroke-width="${bb}" />`,
          );
        }
      }
    }

    const clipIsText = isTextBackgroundClip(nStyle);

    const fontSize = Math.max(
      8,
      round1(Number.parseFloat(nStyle.fontSize) || 16),
    );
    const lineHeightPx = Math.max(
      fontSize,
      round1(Number.parseFloat(nStyle.lineHeight) || fontSize * 1.35),
    );
    const fontFamily = escapeXml(
      resolveFigmaFontFamily(nStyle.fontFamily || styles.typography.fontFamily),
    );
    const fontWeight = escapeXml(nStyle.fontWeight || '400');
    const fontStyleAttr =
      nStyle.fontStyle === 'italic' ? ' font-style="italic"' : '';

    let nodeTextFill = rootTextHex;
    let nodeTextOpacity = '';
    if (clipIsText && nStyle.backgroundImage?.includes('gradient(')) {
      const textGradStops = extractGradientStops(nStyle.backgroundImage);
      if (textGradStops.length > 0) {
        nodeTextFill = registerGradient(textGradStops, true);
      }
    } else {
      const parsedText = parseCssColor(nStyle.color);
      if (parsedText) {
        nodeTextFill = rgbaToHex({ ...parsedText, a: 1 });
        if (parsedText.a < 1) {
          nodeTextOpacity = ` fill-opacity="${round2(parsedText.a)}"`;
        }
      }
    }

    // Traverse open shadowRoot on Web Components (e.g. GitHub's <relative-time>)
    // instead of their hidden fallback light DOM.
    const childSource: Node = node.shadowRoot ?? node;

    for (const childNode of Array.from(childSource.childNodes)) {
      if (childNode.nodeType === Node.TEXT_NODE) {
        const lines = extractTextNodeLines(
          childNode as Text,
          node,
          el,
          rect,
          fontSize,
          lineHeightPx,
          truncatedContainers,
        );
        for (const line of lines) {
          pushText(
            line,
            fontFamily,
            fontSize,
            fontWeight,
            fontStyleAttr,
            nodeTextFill,
            nodeTextOpacity,
          );
        }
      } else if (childNode.nodeType === Node.ELEMENT_NODE) {
        walkElement(childNode as Element, depth + 1);
      }
    }
  };

  walkElement(el, 0);

  const renderedLayers = layerItems.map((item) => {
    if (item.kind === 'raw' || !item.spans || item.spans.length === 0) {
      return item.raw ?? '';
    }
    if (item.spans.length === 1 && item.spans[0]) {
      const s = item.spans[0];
      return `    <text x="${item.x}" y="${item.y}" fill="${s.fill}"${s.opacityAttr} font-family="${item.fontFamily}" font-size="${item.fontSize}" font-weight="${s.fontWeight}"${s.fontStyleAttr}>${escapeXml(s.text.trim())}</text>`;
    }
    const tspans = item.spans
      .map((s) => {
        const fillAttr = s.fill !== item.fill ? ` fill="${s.fill}"` : '';
        const weightAttr =
          s.fontWeight !== item.fontWeight
            ? ` font-weight="${s.fontWeight}"`
            : '';
        return `<tspan${fillAttr}${s.opacityAttr}${weightAttr}${s.fontStyleAttr}>${escapeXml(s.text)}</tspan>`;
      })
      .join('');
    return `    <text x="${item.x}" y="${item.y}" fill="${item.fill}"${item.opacityAttr} font-family="${item.fontFamily}" font-size="${item.fontSize}" font-weight="${item.fontWeight}"${item.fontStyleAttr}>${tspans}</text>`;
  });

  const label = escapeXml(
    options?.frameLabel?.trim() || tag + (el.id ? `#${el.id}` : ''),
  );
  const defsBlock = defs.length > 0 ? [`  <defs>`, ...defs, `  </defs>`] : [];

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">`,
    ...defsBlock,
    `  <g id="${label}">`,
    ...renderedLayers,
    `  </g>`,
    `</svg>`,
  ].join('\n');
}

function createDocumentPageRect(doc: Document): DOMRect {
  const docEl = doc.documentElement;
  const bodyEl = doc.body;
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;
  const width = Math.max(
    docEl?.scrollWidth ?? 0,
    bodyEl?.scrollWidth ?? 0,
    docEl?.clientWidth ?? 0,
    window.innerWidth || 0,
    1,
  );
  const height = Math.max(
    docEl?.scrollHeight ?? 0,
    bodyEl?.scrollHeight ?? 0,
    docEl?.clientHeight ?? 0,
    window.innerHeight || 0,
    1,
  );
  const left = -scrollX;
  const top = -scrollY;
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({ left, top, width, height }),
  };
}

/**
 * Generates a `.svg` or `.png` filename for the current page export.
 */
export function buildPageExportFilename(
  doc: Document = document,
  loc: Location = window.location,
  extension: 'svg' | 'png' = 'svg',
): string {
  const host = (loc.hostname || '').trim();
  const path = (loc.pathname || '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  const titleSlug = (doc.title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const base = [host, path].filter(Boolean).join('-') || titleSlug || 'page';
  return `${base.slice(0, 64)}.${extension}`;
}

/**
 * Exports the entire visible webpage DOM (excluding FrameIt's own overlay)
 * as a Figma-compatible vector SVG string.
 */
export async function buildPageFigmaSvg(
  doc: Document = document,
): Promise<string> {
  const rootEl = doc.body ?? doc.documentElement;
  if (!(rootEl instanceof HTMLElement)) {
    return '';
  }

  const pageRect = createDocumentPageRect(doc);
  const styles = extractInspectedStyles(rootEl, pageRect);
  const hasImages = Array.from(rootEl.querySelectorAll('img')).some(
    (img) => !isOverlayElement(img),
  );
  const preloadedImages = hasImages
    ? await preloadImagesForFigma(rootEl)
    : undefined;

  const frameLabel =
    doc.title?.trim() || window.location.hostname?.trim() || 'page';

  return buildFigmaSvg(rootEl, styles, pageRect, preloadedImages, {
    maxDepth: 64,
    frameLabel,
  });
}
