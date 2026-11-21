import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InspectDetailsCard } from '@/components/overlay/inspect/inspect-details-card';
import { InspectMeasureOverlay } from '@/components/overlay/inspect/inspect-measure-overlay';
import { InspectTool } from '@/components/overlay/inspect/inspect-tool';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PortalContext } from '@/lib/portal-context';
import { DEFAULT_EXTENSION_SETTINGS } from '@/lib/settings-storage';

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

  it('navigates DOM tree with arrow keys / Enter when an element is locked and copies styles from InspectDetailsCard', async () => {
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
    await act(async () => {
      textHexBtn.click();
    });
    expect(writeText).toHaveBeenCalledWith('#111827');
    expect(textHexBtn.textContent).toContain('Copied');

    // Click Copy button (default format is Tailwind)
    const copyCssBtn = card.querySelector(
      '[data-testid="inspect-copy-css"]',
    ) as HTMLButtonElement;
    await act(async () => {
      copyCssBtn.click();
    });
    expect(writeText).toHaveBeenLastCalledWith(
      expect.stringContaining('text-[16px]/[24px]'),
    );
    expect(copyCssBtn.textContent).toContain('Copied');

    // ArrowRight dispatched from inside overlay UI must NOT hijack DOM navigation
    act(() => {
      copyCssBtn.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
    });
    expect(card.textContent).toContain('div#child-1');

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
      await act(async () => {
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

  it('supports Alt-to-inspect, Escape clearing selection first, Shift+Enter/ArrowDown navigation, gap overlays, and scroll/resize updates', () => {
    const flexParent = document.createElement('div');
    flexParent.id = 'flex-wrap';
    flexParent.style.display = 'flex';
    flexParent.style.margin = '12px';

    const hiddenChild = document.createElement('span');
    hiddenChild.style.display = 'none';
    const visibleChild = document.createElement('div');
    visibleChild.id = 'item-1';
    const siblingTwo = document.createElement('div');
    siblingTwo.id = 'item-2';

    flexParent.append(hiddenChild, visibleChild, siblingTwo);
    document.body.appendChild(flexParent);

    vi.spyOn(flexParent, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 20, top: 20, width: 500, height: 100 }),
    );
    vi.spyOn(visibleChild, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 20, top: 20, width: 100, height: 60 }),
    );
    vi.spyOn(siblingTwo, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 144, top: 20, width: 100, height: 60 }),
    );
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(flexParent);

    const onCancel = vi.fn();
    act(() => {
      root.render(<InspectMeasureOverlay active={false} onCancel={onCancel} />);
    });

    // Holding Alt enables temporary hover inspect even when active=false
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt' }));
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 50, clientY: 50, altKey: true }),
      );
    });
    expect(
      container.querySelectorAll('[data-testid="inspect-gap-overlay"]'),
    ).toHaveLength(1);
    expect(container.textContent).toContain('24');

    // Releasing Alt / window blur clears hover
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' }));
    });
    expect(container.innerHTML).toBe('');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt' }));
      window.dispatchEvent(new Event('blur'));
    });
    expect(container.innerHTML).toBe('');

    // Activate mode, lock flexParent, navigate down to visibleChild (skipping hiddenChild), Shift+Enter back to parent
    act(() => {
      root.render(<InspectMeasureOverlay active={true} onCancel={onCancel} />);
    });
    act(() => {
      flexParent.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('div#flex-wrap');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    });
    expect(container.textContent).toContain('div#item-1');

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }),
      );
    });
    expect(container.textContent).toContain('div#flex-wrap');

    // Scroll & resize events trigger layout update; hovering overlay clears hover
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(container);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 10, clientY: 10 }),
      );
    });

    // First Escape clears selection, second Escape calls onCancel
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(
      container.querySelector('[data-testid="inspect-details-card"]'),
    ).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('covers InspectDetailsCard Figma SVG export (with and without img), direct <svg> copy, timer reset, and InspectTool reset fallback', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const cardEl = document.createElement('div');
    cardEl.id = 'figma-card';
    cardEl.style.margin = '12px';
    cardEl.style.borderRadius = '8px';
    cardEl.style.gap = '8px';
    const img = document.createElement('img');
    img.setAttribute('src', 'data:image/png;base64,iVBORw0KGgo=');
    cardEl.appendChild(img);
    document.body.appendChild(cardEl);

    vi.spyOn(img, 'getBoundingClientRect').mockReturnValue(
      mockRect({ left: 10, top: 10, width: 32, height: 32 }),
    );

    const cardRect = mockRect({ left: 10, top: 10, width: 200, height: 120 });

    await act(async () => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <InspectDetailsCard
              element={cardEl}
              rect={cardRect}
              inspectSettings={{
                ...DEFAULT_EXTENSION_SETTINGS.inspect,
                codeFormat: 'css',
                unitFormat: 'rem',
              }}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    // Click Copy Figma SVG button (with <img> -> calls preloadImagesForFigma)
    const figmaBtn = container.querySelector(
      '[data-testid="inspect-copy-figma"]',
    ) as HTMLButtonElement;
    await act(async () => {
      figmaBtn.click();
    });
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('data:image/png;base64,iVBORw0KGgo='),
    );

    // Advance timer 1400ms to reset copiedId
    act(() => {
      vi.advanceTimersByTime(1400);
    });

    // Direct <svg> element copy uses buildFigmaSvg instead of buildCodeSnippet
    const svgEl = document.createElement('svg') as unknown as HTMLElement;
    document.body.appendChild(svgEl);
    await act(async () => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <InspectDetailsCard
              element={svgEl}
              rect={mockRect({ left: 0, top: 0, width: 24, height: 24 })}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    const copyCssBtn = container.querySelector(
      '[data-testid="inspect-copy-css"]',
    ) as HTMLButtonElement;
    await act(async () => {
      copyCssBtn.click();
    });
    expect(writeText).toHaveBeenLastCalledWith(
      expect.stringContaining('<svg xmlns="http://www.w3.org/2000/svg"'),
    );

    // Clicking Figma SVG button on element without <img>
    await act(async () => {
      (
        container.querySelector(
          '[data-testid="inspect-copy-figma"]',
        ) as HTMLButtonElement
      ).click();
    });

    // InspectTool without onResetInspectSettings falls back to onUpdateInspectSettings(defaultInspectSettings)
    const onUpdateInspectSettings = vi.fn();
    await act(async () => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <InspectTool
              active={true}
              inspectSettings={{
                ...DEFAULT_EXTENSION_SETTINGS.inspect,
                showPadding: false,
                showMargin: false,
              }}
              onToggle={vi.fn()}
              onUpdateInspectSettings={onUpdateInspectSettings}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    const trigger = container.querySelector(
      '[data-testid="inspect-popover-trigger"]',
    ) as HTMLButtonElement;
    act(() => {
      trigger.click();
    });

    act(() => {
      (
        container.querySelector(
          '[data-testid="dock-inspect-padding"]',
        ) as HTMLButtonElement
      ).click();
      (
        container.querySelector(
          '[data-testid="dock-inspect-margin"]',
        ) as HTMLButtonElement
      ).click();
      (
        container.querySelector(
          '[data-testid="inspect-popover-reset"]',
        ) as HTMLButtonElement
      ).click();
    });
    expect(onUpdateInspectSettings).toHaveBeenCalledWith(
      DEFAULT_EXTENSION_SETTINGS.inspect,
    );

    act(() => {
      (
        container.querySelector(
          'button[aria-label="Close"]',
        ) as HTMLButtonElement
      ).click();
    });

    vi.useRealTimers();
  });
});
