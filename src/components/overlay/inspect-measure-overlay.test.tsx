import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InspectMeasureOverlay } from '@/components/overlay/inspect-measure-overlay';

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

describe('InspectMeasureOverlay', () => {
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

  it('renders nothing when inactive and Alt is not pressed', () => {
    act(() => {
      root.render(<InspectMeasureOverlay active={false} />);
    });

    expect(container.innerHTML).toBe('');
  });

  it('measures distances between a hovered child and its parent container in active mode', () => {
    const parent = document.createElement('div');
    parent.id = 'card';
    const child = document.createElement('button');
    child.id = 'cta';
    parent.appendChild(child);
    document.body.appendChild(parent);

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 100, top: 100, width: 400, height: 300 }),
    );
    vi.spyOn(child, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 124, top: 132, width: 120, height: 40 }),
    );
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(child);

    act(() => {
      root.render(<InspectMeasureOverlay active={true} />);
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 150,
          altKey: true,
        }),
      );
    });

    expect(container.textContent).toContain('button#cta');
    expect(container.textContent).toContain('120 × 40');
    // Top distance: 132 - 100 = 32, Left distance: 124 - 100 = 24
    expect(container.textContent).toContain('32');
    expect(container.textContent).toContain('24');
  });

  it('locks an element on click and measures distance to a second hovered sibling', () => {
    const boxA = document.createElement('div');
    boxA.id = 'box-a';
    const boxB = document.createElement('div');
    boxB.id = 'box-b';
    document.body.appendChild(boxA);
    document.body.appendChild(boxB);

    vi.spyOn(boxA, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 100, top: 100, width: 200, height: 100 }),
    );
    vi.spyOn(boxB, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 348, top: 100, width: 200, height: 100 }),
    );

    act(() => {
      root.render(<InspectMeasureOverlay active={true} />);
    });

    // Click boxA to lock it
    act(() => {
      boxA.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Hover boxB (separated by 48px horizontally: 348 - 300 = 48)
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(boxB);
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 400, clientY: 150 }),
      );
    });

    expect(container.textContent).toContain('div#box-a');
    expect(container.textContent).toContain('div#box-b');
    expect(container.textContent).toContain('48');
  });

  it('calls onSnapToElement on Shift+Click and onCancel on Escape', () => {
    const onSnapToElement = vi.fn();
    const onCancel = vi.fn();
    const target = document.createElement('section');
    document.body.appendChild(target);

    act(() => {
      root.render(
        <InspectMeasureOverlay
          active={true}
          onSnapToElement={onSnapToElement}
          onCancel={onCancel}
        />,
      );
    });

    act(() => {
      target.dispatchEvent(
        new MouseEvent('click', { bubbles: true, shiftKey: true }),
      );
    });
    expect(onSnapToElement).toHaveBeenCalledWith(target);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
