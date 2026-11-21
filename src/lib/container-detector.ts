import {
  containerInfoToColumnsPatch,
  extractContainerInfo,
  parseGridColumns,
  parsePx,
} from '@/lib/container-extract';
import { isOverlayElement } from '@/lib/dom-utils';
import type { DetectedContainerInfo } from '@/types/layout-guides';

export { containerInfoToColumnsPatch, extractContainerInfo };

const IGNORED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'SVG',
  'PATH',
  'IMG',
  'VIDEO',
  'CANVAS',
  'IFRAME',
  'LINK',
  'META',
  'HEAD',
  'HTML',
  'BR',
  'HR',
  'SPAN',
  'A',
  'BUTTON',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'LABEL',
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
]);

const CONTAINER_CLASS_REGEX =
  /\b(container|wrapper|max-w-|layout|content|grid|page|main|shell|inner)\b/i;

/**
 * Automatically detects the primary content container on the page
 * by scoring max-width, centering, semantic tags, and visible area.
 */
export function autoDetectPageContainer(): DetectedContainerInfo | null {
  const viewportWidth =
    document.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = window.innerHeight;
  const minCandidateWidth = Math.min(320, viewportWidth * 0.45);

  const elements = document.body.querySelectorAll<HTMLElement>('*');
  const widthFrequency = new Map<number, number>();
  const filtered: Array<{
    el: HTMLElement;
    rect: DOMRect;
    roundedW: number;
  }> = [];

  for (const el of elements) {
    if (IGNORED_TAGS.has(el.tagName) || isOverlayElement(el)) continue;

    const rect = el.getBoundingClientRect();
    if (
      rect.width < minCandidateWidth ||
      rect.height < 60 ||
      rect.bottom < 0 ||
      rect.top > viewportHeight * 2
    ) {
      continue;
    }

    const roundedW = Math.round(rect.width);
    if (roundedW < viewportWidth - 8) {
      widthFrequency.set(roundedW, (widthFrequency.get(roundedW) ?? 0) + 1);
    }

    filtered.push({ el, rect, roundedW });
  }

  let bestCandidate: {
    el: HTMLElement;
    rect: DOMRect;
    style: CSSStyleDeclaration;
    score: number;
  } | null = null;

  for (const { el, rect, roundedW } of filtered) {
    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.position === 'fixed'
    ) {
      continue;
    }

    const isConstrained = roundedW < viewportWidth - 8;
    const computedMaxW = parsePx(style.maxWidth);
    const hasExplicitMaxW =
      computedMaxW !== null &&
      computedMaxW <= viewportWidth &&
      computedMaxW >= 480;

    const leftSpace = rect.left;
    const rightSpace = viewportWidth - rect.right;
    const isCentered =
      isConstrained && Math.abs(leftSpace - rightSpace) <= 12 && leftSpace > 4;

    const gridInfo = parseGridColumns(style);
    const paddingLeft = parsePx(style.paddingLeft) ?? 0;
    const paddingRight = parsePx(style.paddingRight) ?? 0;
    const hasSymmetricPadding =
      paddingLeft > 0 && Math.abs(paddingLeft - paddingRight) <= 4;

    if (
      !isConstrained &&
      !hasExplicitMaxW &&
      !gridInfo &&
      !hasSymmetricPadding
    ) {
      continue;
    }

    let score = 0;

    if (hasExplicitMaxW) score += 45;
    if (isCentered) score += 35;
    else if (isConstrained) score += 15;

    if (isConstrained) {
      const freq = widthFrequency.get(roundedW) ?? 0;
      score += Math.min(30, freq * 6);
    }

    const tag = el.tagName;
    if (tag === 'MAIN') score += 25;
    else if (tag === 'SECTION' || tag === 'HEADER' || tag === 'ARTICLE') {
      score += 10;
    }

    const classNameStr = typeof el.className === 'string' ? el.className : '';
    if (CONTAINER_CLASS_REGEX.test(classNameStr)) {
      score += 20;
    }

    if (gridInfo) {
      score += 30;
    }

    if (hasSymmetricPadding && paddingLeft <= 120) {
      score += 12;
    }

    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(viewportHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    score += Math.round((visibleHeight / viewportHeight) * 20);

    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = { el, rect, style, score };
    }
  }

  if (!bestCandidate) {
    return null;
  }

  return extractContainerInfo(
    bestCandidate.el,
    bestCandidate.rect,
    bestCandidate.style,
  );
}
