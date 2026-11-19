import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  autoDetectPageContainer,
  containerInfoToColumnsPatch,
  extractContainerInfo,
} from '@/lib/container-detector';
import type { LinearGuideSettings } from '@/types/layout-guides';

function mockRect(rect: Partial<DOMRect>): DOMRect {
  const left = rect.left ?? 0;
  const top = rect.top ?? 0;
  const width = rect.width ?? 0;
  const height = rect.height ?? 0;
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: rect.right ?? left + width,
    bottom: rect.bottom ?? top + height,
    toJSON: () => ({}),
  };
}

describe('extractContainerInfo', () => {
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1440,
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 1440,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 900,
      configurable: true,
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('extracts centered container with symmetric padding and fallback 12-column grid', () => {
    const el = document.createElement('div');
    el.id = 'main-wrapper';
    el.style.paddingLeft = '24px';
    el.style.paddingRight = '24px';
    el.style.maxWidth = '1200px';
    document.body.appendChild(el);

    const rect = mockRect({ left: 120, top: 0, width: 1200, height: 600 });
    const style = window.getComputedStyle(el);

    const info = extractContainerInfo(el, rect, style);

    expect(info).toEqual({
      element: el,
      tagName: 'div',
      label: 'div#main-wrapper',
      rect,
      maxWidth: 1200,
      paddingInline: 24,
      columnCount: 12,
      columnGap: 20,
      alignment: 'stretch',
      offset: 0,
    });
  });

  it('detects left-aligned ("start"), right-aligned ("end"), and shifted containers', () => {
    const el = document.createElement('aside');
    const style = window.getComputedStyle(el);

    // Left-aligned
    const leftInfo = extractContainerInfo(
      el,
      mockRect({ left: 0, width: 300, height: 500 }),
      style,
    );
    expect(leftInfo.alignment).toBe('start');
    expect(leftInfo.offset).toBe(0);
    expect(leftInfo.columnCount).toBe(4);
    expect(leftInfo.columnGap).toBe(12);

    // Right-aligned (1440 - 300 = 1140)
    const rightInfo = extractContainerInfo(
      el,
      mockRect({ left: 1140, width: 300, height: 500 }),
      style,
    );
    expect(rightInfo.alignment).toBe('end');
    expect(rightInfo.offset).toBe(-0);

    // Shifted container (e.g. next to a 240px sidebar: left=240, width=1000 -> center=740 vs viewport center 720 -> +20)
    const shiftedInfo = extractContainerInfo(
      el,
      mockRect({ left: 240, width: 1000, height: 500 }),
      style,
    );
    expect(shiftedInfo.alignment).toBe('stretch');
    expect(shiftedInfo.offset).toBe(20);
  });

  it('handles full-bleed containers with and without explicit maxWidth', () => {
    const el = document.createElement('section');
    document.body.appendChild(el);
    const fullRect = mockRect({ left: 0, width: 1440, height: 500 });

    const withoutMaxInfo = extractContainerInfo(
      el,
      fullRect,
      window.getComputedStyle(el),
    );
    expect(withoutMaxInfo.maxWidth).toBeNull();

    el.style.maxWidth = '1280px';
    const withMaxInfo = extractContainerInfo(
      el,
      fullRect,
      window.getComputedStyle(el),
    );
    expect(withMaxInfo.maxWidth).toBe(1280);
  });

  it('extracts explicit CSS Grid columns and columnGap from the element or its direct child', () => {
    const parent = document.createElement('div');
    const child = document.createElement('div');
    parent.appendChild(child);
    document.body.appendChild(parent);

    const parentRect = mockRect({ left: 120, width: 1200, height: 500 });
    vi.spyOn(child, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 120, width: 1200, height: 500 }),
    );

    child.style.display = 'grid';
    child.style.gridTemplateColumns = '280px 280px 280px 280px';
    child.style.columnGap = '24px';

    const info = extractContainerInfo(
      parent,
      parentRect,
      window.getComputedStyle(parent),
    );
    expect(info.columnCount).toBe(4);
    expect(info.columnGap).toBe(24);
  });

  it.each([
    { width: 200, expectedCols: 2, expectedGap: 8 },
    { width: 360, expectedCols: 4, expectedGap: 12 },
    { width: 600, expectedCols: 6, expectedGap: 16 },
    { width: 900, expectedCols: 8, expectedGap: 16 },
    { width: 1200, expectedCols: 12, expectedGap: 20 },
  ])(
    'suggests $expectedCols columns and $expectedGap px gap for width $width px',
    ({ width, expectedCols, expectedGap }) => {
      const el = document.createElement('div');
      const info = extractContainerInfo(
        el,
        mockRect({ left: 0, width, height: 300 }),
        window.getComputedStyle(el),
      );
      expect(info.columnCount).toBe(expectedCols);
      expect(info.columnGap).toBe(expectedGap);
    },
  );
});

describe('containerInfoToColumnsPatch', () => {
  const currentSettings: LinearGuideSettings = {
    count: 12,
    color: '#FF0000',
    opacity: 10,
    alignment: 'center',
    itemSize: 80,
    maxSize: null,
    margin: 24,
    gutter: 16,
    offset: 0,
    followScroll: false,
  };

  it('clears itemSize when alignment is stretch and preserves it otherwise', () => {
    const el = document.createElement('div');
    const stretchPatch = containerInfoToColumnsPatch(
      {
        element: el,
        tagName: 'div',
        label: 'div',
        rect: mockRect({ width: 1200 }),
        maxWidth: 1200,
        paddingInline: 32,
        columnCount: 12,
        columnGap: 24,
        alignment: 'stretch',
        offset: 0,
      },
      currentSettings,
    );

    expect(stretchPatch).toEqual({
      alignment: 'stretch',
      itemSize: null,
      maxSize: 1200,
      margin: 32,
      offset: 0,
      count: 12,
      gutter: 24,
    });

    const startPatch = containerInfoToColumnsPatch(
      {
        element: el,
        tagName: 'div',
        label: 'div',
        rect: mockRect({ width: 300 }),
        maxWidth: 300,
        paddingInline: 16,
        columnCount: null,
        columnGap: null,
        alignment: 'start',
        offset: 0,
      },
      currentSettings,
    );

    expect(startPatch.itemSize).toBe(80);
    expect(startPatch.count).toBeUndefined();
    expect(startPatch.gutter).toBeUndefined();
  });
});

describe('autoDetectPageContainer', () => {
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1440,
      configurable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: 1440,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 900,
      configurable: true,
    });
    document.body.innerHTML = '';
  });

  it('returns null when page has no suitable container elements', () => {
    const small = document.createElement('div');
    vi.spyOn(small, 'getBoundingClientRect').mockReturnValue(
      mockRect({ width: 100, height: 40 }),
    );
    document.body.appendChild(small);

    expect(autoDetectPageContainer()).toBeNull();
  });

  it('scores and selects the main centered container over full-bleed wrappers and overlay elements', () => {
    const fullBleed = document.createElement('div');
    vi.spyOn(fullBleed, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 0, top: 0, width: 1440, height: 900 }),
    );

    const mainContainer = document.createElement('main');
    mainContainer.className = 'container mx-auto';
    mainContainer.style.maxWidth = '1280px';
    mainContainer.style.paddingLeft = '24px';
    mainContainer.style.paddingRight = '24px';
    vi.spyOn(mainContainer, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 80, top: 60, width: 1280, height: 800 }),
    );

    const overlayEl = document.createElement('frameit-overlay');
    vi.spyOn(overlayEl, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 80, top: 0, width: 1280, height: 900 }),
    );

    fullBleed.appendChild(mainContainer);
    document.body.appendChild(fullBleed);
    document.body.appendChild(overlayEl);

    const detected = autoDetectPageContainer();
    expect(detected).not.toBeNull();
    expect(detected?.element).toBe(mainContainer);
    expect(detected?.maxWidth).toBe(1280);
    expect(detected?.paddingInline).toBe(24);
  });
});
