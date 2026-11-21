import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContainerPickerOverlay } from '@/components/overlay/layout-guides/container-picker-overlay';

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

describe('ContainerPickerOverlay', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;
  let rafQueue: FrameRequestCallback[];

  const flushRaf = () => {
    while (rafQueue.length > 0) {
      const cb = rafQueue.shift();
      cb?.(0);
    }
  };

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'frameit-root';
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);

    rafQueue = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  it('climbs up from small inline elements (< 200px) to the nearest container and selects it on click', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    const section = document.createElement('section');
    section.id = 'hero';
    const smallSpan = document.createElement('span');
    section.appendChild(smallSpan);
    document.body.appendChild(section);

    vi.spyOn(smallSpan, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 100, top: 100, width: 80, height: 20 }),
    );
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 100, top: 80, width: 1200, height: 500 }),
    );
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(smallSpan);

    act(() => {
      root.render(
        <ContainerPickerOverlay
          active={true}
          onSelect={onSelect}
          onCancel={onCancel}
        />,
      );
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 120, clientY: 110 }),
      );
      flushRaf();
    });

    expect(container.textContent).toContain('section#hero');
    expect(container.textContent).toContain('1200px');

    act(() => {
      smallSpan.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0].element).toBe(section);
  });

  it('cancels on Escape key press', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    act(() => {
      root.render(
        <ContainerPickerOverlay
          active={true}
          onSelect={onSelect}
          onCancel={onCancel}
        />,
      );
    });

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows padding/column badges, updates on scroll/resize, clears on overlay hover, and cancels when clicking without hovered target', () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();

    const grid = document.createElement('div');
    grid.id = 'grid-wrap';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '100px 100px 100px';
    grid.style.paddingLeft = '24px';
    grid.style.paddingRight = '24px';
    grid.style.gap = '16px';
    document.body.appendChild(grid);

    vi.spyOn(grid, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 50, top: 60, width: 600, height: 300 }),
    );
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(grid);

    act(() => {
      root.render(
        <ContainerPickerOverlay
          active={true}
          onSelect={onSelect}
          onCancel={onCancel}
        />,
      );
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 100, clientY: 100 }),
      );
      flushRaf();
    });
    expect(container.textContent).toContain('div#grid-wrap');
    expect(container.textContent).toContain('3 cols');
    expect(container.textContent).toContain('(pad 24px)');

    // Moving mouse again over same target hits early-return cache; scroll updates rect
    vi.spyOn(grid, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 50, top: 20, width: 640, height: 300 }),
    );
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 102, clientY: 102 }),
      );
      flushRaf();
      window.dispatchEvent(new Event('scroll'));
    });
    expect(container.textContent).toContain('640px');

    // Hovering overlay element clears hovered info, then clicking page calls onCancel
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(container);
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 10, clientY: 10 }),
      );
      flushRaf();
    });
    expect(container.textContent).not.toContain('div#grid-wrap');

    const outsideDiv = document.createElement('div');
    document.body.appendChild(outsideDiv);
    act(() => {
      outsideDiv.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
