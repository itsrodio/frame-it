import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InspectMeasureOverlay } from '@/components/overlay/inspect/inspect-measure-overlay';

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

  it('navigates DOM tree with arrow keys / Enter when an element is locked and copies styles from InspectDetailsCard', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const parent = document.createElement('section');
    parent.id = 'parent-sec';
    parent.style.backgroundColor = 'rgb(255, 255, 255)';

    const firstChild = document.createElement('div');
    firstChild.id = 'child-1';
    firstChild.style.color = 'rgb(17, 24, 39)';
    firstChild.style.fontFamily = 'Inter, sans-serif';
    firstChild.style.fontSize = '16px';
    firstChild.style.lineHeight = '24px';
    firstChild.style.fontWeight = '500';

    const secondChild = document.createElement('div');
    secondChild.id = 'child-2';

    parent.appendChild(firstChild);
    parent.appendChild(secondChild);
    document.body.appendChild(parent);

    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 40, top: 40, width: 600, height: 300 }),
    );
    vi.spyOn(firstChild, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 60, top: 60, width: 200, height: 80 }),
    );
    vi.spyOn(secondChild, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 280, top: 60, width: 200, height: 80 }),
    );

    act(() => {
      root.render(<InspectMeasureOverlay active={true} />);
    });

    // Lock firstChild by clicking it
    act(() => {
      firstChild.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const card = container.querySelector(
      '[data-testid="inspect-details-card"]',
    ) as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.textContent).toContain('div#child-1');
    expect(card.textContent).toContain('Inter');
    expect(card.textContent).toContain('#111827');
    expect(card.textContent).toContain('rgb(17, 24, 39)');
    expect(card.textContent).toContain('AAA');

    // Click HEX color chip to copy and verify "Copied" feedback
    const textHexBtn = card.querySelector(
      '[data-testid="inspect-copy-text-hex"]',
    ) as HTMLButtonElement;
    act(() => {
      textHexBtn.click();
    });
    expect(writeText).toHaveBeenCalledWith('#111827');
    expect(textHexBtn.textContent).toContain('Copied');

    // Click Copy button (default format is Tailwind)
    const copyCssBtn = card.querySelector(
      '[data-testid="inspect-copy-css"]',
    ) as HTMLButtonElement;
    act(() => {
      copyCssBtn.click();
    });
    expect(writeText).toHaveBeenLastCalledWith(
      expect.stringContaining('text-[16px]/[24px]'),
    );
    expect(copyCssBtn.textContent).toContain('Copied');

    // Press ArrowRight -> selects sibling div#child-2
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
    });
    expect(card.textContent).toContain('div#child-2');

    // Press ArrowLeft -> back to div#child-1
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
      );
    });
    expect(card.textContent).toContain('div#child-1');

    // Press ArrowUp -> selects parent section#parent-sec
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(card.textContent).toContain('section#parent-sec');

    // Press ArrowDown (or Enter) -> drills into first visible child div#child-1
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
    });
    expect(card.textContent).toContain('div#child-1');

    // Test clicking size, font-size, font-weight, and RGB copy buttons
    for (const testId of [
      'inspect-copy-size',
      'inspect-copy-font-size',
      'inspect-copy-font-weight',
      'inspect-copy-text-rgb',
    ]) {
      const btn = card.querySelector(
        `[data-testid="${testId}"]`,
      ) as HTMLButtonElement;
      act(() => {
        btn.click();
      });
    }
    expect(writeText).toHaveBeenCalledWith('rgb(17, 24, 39)');

    // Drag card by its top primary drag bar
    const dragHandle = card.querySelector(
      '[data-testid="inspect-card-drag-handle"]',
    ) as HTMLElement;
    expect(dragHandle).not.toBeNull();
    act(() => {
      dragHandle.dispatchEvent(
        new MouseEvent('mousedown', {
          button: 0,
          clientX: 100,
          clientY: 100,
          bubbles: true,
        }),
      );
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 180,
          clientY: 160,
          bubbles: true,
        }),
      );
      window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    // Toggle card pin placement (resets manual drag position)
    const pinBtn = card.querySelector(
      '[data-testid="inspect-toggle-pin"]',
    ) as HTMLButtonElement;
    act(() => {
      pinBtn.click();
    });

    // Click breadcrumb ancestor (parent-sec) in header to jump directly to parent
    const parentBreadcrumb = card.querySelector(
      '[data-testid="inspect-breadcrumb-0"]',
    ) as HTMLButtonElement;
    act(() => {
      parentBreadcrumb.click();
    });
    expect(card.textContent).toContain('section#parent-sec');

    // Unpin element via close button in card header
    const unpinBtn = card.querySelector(
      'button[aria-label="Unpin element"]',
    ) as HTMLButtonElement;
    act(() => {
      unpinBtn.click();
    });
    expect(
      container.querySelector('[data-testid="inspect-details-card"]'),
    ).toBeNull();
  });
});
