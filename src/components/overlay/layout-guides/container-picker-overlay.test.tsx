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

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'frameit-root';
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
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
});
