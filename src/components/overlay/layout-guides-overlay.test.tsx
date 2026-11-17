import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT_GUIDES_STATE } from '@/components/overlay/layout-guides/constants';
import { LayoutGuidesOverlay } from '@/components/overlay/layout-guides-overlay';
import type { LayoutGuidesState } from '@/types/layout-guides';

describe('LayoutGuidesOverlay', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renders nothing when state.enabled is false', () => {
    const state: LayoutGuidesState = {
      ...DEFAULT_LAYOUT_GUIDES_STATE,
      enabled: false,
    };

    act(() => {
      root.render(
        <LayoutGuidesOverlay state={state} scroll={{ x: 0, y: 0 }} />,
      );
    });

    expect(container.innerHTML).toBe('');
  });

  it('renders columns guide items and applies maxWidth, margin, gutter, and scroll offset', () => {
    const state: LayoutGuidesState = {
      ...DEFAULT_LAYOUT_GUIDES_STATE,
      enabled: true,
      type: 'columns',
      columns: {
        ...DEFAULT_LAYOUT_GUIDES_STATE.columns,
        count: 4,
        maxSize: 1200,
        margin: 32,
        gutter: 16,
        offset: 10,
        followScroll: true,
      },
    };

    act(() => {
      root.render(
        <LayoutGuidesOverlay state={state} scroll={{ x: 50, y: 100 }} />,
      );
    });

    const gridEl = container.querySelector('.grid') as HTMLElement;
    expect(gridEl).not.toBeNull();
    expect(gridEl.children.length).toBe(4);
    expect(gridEl.style.maxWidth).toBe('1200px');
    expect(gridEl.style.padding).toBe('0px 32px');
    expect(gridEl.style.gap).toBe('16px');
    expect(gridEl.style.transform).toBe('translateX(-40px)');
  });

  it('renders rows guide items with vertical alignment and scrollY offset', () => {
    const state: LayoutGuidesState = {
      ...DEFAULT_LAYOUT_GUIDES_STATE,
      enabled: true,
      type: 'rows',
      rows: {
        ...DEFAULT_LAYOUT_GUIDES_STATE.rows,
        count: 6,
        alignment: 'start',
        itemSize: 48,
        followScroll: true,
        offset: 0,
      },
    };

    act(() => {
      root.render(
        <LayoutGuidesOverlay state={state} scroll={{ x: 0, y: 120 }} />,
      );
    });

    const gridEl = container.querySelector('.grid') as HTMLElement;
    expect(gridEl).not.toBeNull();
    expect(gridEl.children.length).toBe(6);
    expect(gridEl.style.gridTemplateRows).toBe('repeat(6, 48px)');
    expect(gridEl.style.transform).toBe('translateY(-120px)');
  });

  it('renders grid guide layer with backgroundSize and scroll-adjusted backgroundPosition', () => {
    const state: LayoutGuidesState = {
      ...DEFAULT_LAYOUT_GUIDES_STATE,
      enabled: true,
      type: 'grid',
      grid: {
        size: 16,
        color: '#00FF00',
        opacity: 25,
        offsetX: 4,
        offsetY: 8,
        followScroll: true,
      },
    };

    act(() => {
      root.render(
        <LayoutGuidesOverlay state={state} scroll={{ x: 20, y: 30 }} />,
      );
    });

    const layerEl = container.firstElementChild
      ?.firstElementChild as HTMLElement;
    expect(layerEl).not.toBeNull();
    expect(layerEl.style.backgroundSize).toBe('16px 16px');
    expect(layerEl.style.backgroundPosition).toBe('-16px -22px');
  });
});
