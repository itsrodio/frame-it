import { getElementLabel } from '@/lib/dom-utils';
import type {
  DetectedContainerInfo,
  GuideAlignment,
  LinearGuideSettings,
} from '@/types/layout-guides';

export function parsePx(value: string | null | undefined): number | null {
  if (!value || value === 'none' || value === 'normal' || value === 'auto') {
    return null;
  }
  if (value.endsWith('px')) {
    const num = Number.parseFloat(value);
    return Number.isFinite(num) ? Math.round(num) : null;
  }
  return null;
}

export function parseGridColumns(
  style: CSSStyleDeclaration,
): { count: number; gap: number } | null {
  if (style.display !== 'grid' && style.display !== 'inline-grid') {
    return null;
  }
  const template = style.gridTemplateColumns;
  if (!template || template === 'none') {
    return null;
  }
  const tracks = template
    .trim()
    .split(/\s+/)
    .filter((t) => t.endsWith('px'));
  if (tracks.length < 2 || tracks.length > 48) {
    return null;
  }
  const gap = parsePx(style.columnGap) ?? 0;
  return { count: tracks.length, gap };
}

/**
 * Suggests an adaptive column count and gutter based on the container's inner width
 * when the element has no explicit CSS Grid columns.
 */
export function suggestColumnsForWidth(innerWidth: number): {
  count: number;
  gap: number;
} {
  if (innerWidth < 240) {
    return { count: 2, gap: 8 };
  }
  if (innerWidth < 480) {
    return { count: 4, gap: 12 };
  }
  if (innerWidth < 768) {
    return { count: 6, gap: 16 };
  }
  if (innerWidth < 1024) {
    return { count: 8, gap: 16 };
  }
  return { count: 12, gap: 20 };
}

/**
 * Extracts layout guide parameters (width, inline padding, offset, columns) from a DOM element.
 */
export function extractContainerInfo(
  el: HTMLElement,
  precomputedRect?: DOMRect,
  precomputedStyle?: CSSStyleDeclaration,
): DetectedContainerInfo {
  const rect = precomputedRect ?? el.getBoundingClientRect();
  const style = precomputedStyle ?? window.getComputedStyle(el);
  const viewportWidth =
    document.documentElement.clientWidth || window.innerWidth;

  const paddingLeft = parsePx(style.paddingLeft) ?? 0;
  const paddingRight = parsePx(style.paddingRight) ?? 0;
  const paddingInline = Math.round((paddingLeft + paddingRight) / 2);

  const computedMaxWidth = parsePx(style.maxWidth);
  const roundedWidth = Math.round(rect.width);

  const isFullBleed = roundedWidth >= viewportWidth - 2;
  const maxWidth = isFullBleed
    ? computedMaxWidth && computedMaxWidth < viewportWidth
      ? computedMaxWidth
      : null
    : roundedWidth;

  const leftSpace = rect.left;
  const rightSpace = viewportWidth - rect.right;
  const centerDiff = Math.round(rect.left + rect.width / 2 - viewportWidth / 2);

  let alignment: GuideAlignment = 'stretch';
  let offset = 0;

  if (!isFullBleed) {
    if (Math.abs(leftSpace - rightSpace) <= 8) {
      alignment = 'stretch';
      offset = 0;
    } else if (Math.abs(leftSpace) <= 4) {
      alignment = 'start';
      offset = Math.round(leftSpace);
    } else if (Math.abs(rightSpace) <= 4) {
      alignment = 'end';
      offset = -Math.round(rightSpace);
    } else {
      alignment = 'stretch';
      offset = centerDiff;
    }
  }

  let gridInfo = parseGridColumns(style);
  if (!gridInfo) {
    for (const child of Array.from(el.children)) {
      if (child instanceof HTMLElement) {
        const childRect = child.getBoundingClientRect();
        if (
          Math.abs(
            childRect.width - (rect.width - paddingLeft - paddingRight),
          ) <= 8
        ) {
          const childGrid = parseGridColumns(window.getComputedStyle(child));
          if (childGrid) {
            gridInfo = childGrid;
            break;
          }
        }
      }
    }
  }

  const innerWidth = Math.max(0, roundedWidth - paddingLeft - paddingRight);
  const fallbackGrid = suggestColumnsForWidth(innerWidth);

  return {
    element: el,
    tagName: el.tagName.toLowerCase(),
    label: getElementLabel(el),
    rect,
    maxWidth,
    paddingInline,
    columnCount: gridInfo?.count ?? fallbackGrid.count,
    columnGap: gridInfo?.gap ?? fallbackGrid.gap,
    alignment,
    offset,
  };
}

/**
 * Converts detected container info into a partial columns guide settings patch.
 */
export function containerInfoToColumnsPatch(
  info: DetectedContainerInfo,
  current: LinearGuideSettings,
): Partial<LinearGuideSettings> {
  return {
    alignment: info.alignment,
    itemSize: info.alignment === 'stretch' ? null : current.itemSize,
    maxSize: info.maxWidth,
    margin: info.paddingInline,
    offset: info.offset,
    ...(info.columnCount !== null ? { count: info.columnCount } : {}),
    ...(info.columnGap !== null ? { gutter: info.columnGap } : {}),
  };
}
