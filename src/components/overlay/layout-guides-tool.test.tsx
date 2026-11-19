import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_COLUMNS_SETTINGS,
  DEFAULT_GRID_SETTINGS,
  DEFAULT_LAYOUT_GUIDES_STATE,
} from '@/components/overlay/layout-guides/constants';
import { GridGuideFields } from '@/components/overlay/layout-guides/grid-guide-fields';
import { LinearGuideFields } from '@/components/overlay/layout-guides/linear-guide-fields';
import { LayoutGuidesTool } from '@/components/overlay/layout-guides-tool';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PortalContext } from '@/lib/portal-context';

function setNativeInputValue(el: HTMLInputElement, val: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(el, val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('LayoutGuidesTool & Fields', () => {
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

  it('renders LayoutGuidesTool, toggles guides, opens popover, and handles header & color/opacity actions across modes', () => {
    const onToggle = vi.fn();
    const onTypeChange = vi.fn();
    const onColumnsChange = vi.fn();
    const onRowsChange = vi.fn();
    const onGridChange = vi.fn();
    const onAutoDetect = vi.fn();
    const onTogglePickContainer = vi.fn();
    const onReset = vi.fn();

    const renderTool = (
      type: 'columns' | 'rows' | 'grid' = 'columns',
      hasCustomSiteSettings = true,
    ) => {
      act(() => {
        root.render(
          <PortalContext.Provider value={container}>
            <TooltipProvider>
              <LayoutGuidesTool
                state={{ ...DEFAULT_LAYOUT_GUIDES_STATE, type }}
                isInspectActive={false}
                isPickingContainer={false}
                trackedElementLabel={type === 'columns' ? 'div.wrapper' : null}
                hasCustomSiteSettings={hasCustomSiteSettings}
                onToggle={onToggle}
                onToggleInspect={vi.fn()}
                onTypeChange={onTypeChange}
                onColumnsChange={onColumnsChange}
                onRowsChange={onRowsChange}
                onGridChange={onGridChange}
                onAutoDetect={onAutoDetect}
                onTogglePickContainer={onTogglePickContainer}
                onClearTrackedElement={vi.fn()}
                onReset={onReset}
              />
            </TooltipProvider>
          </PortalContext.Provider>,
        );
      });
    };

    renderTool('columns', true);

    const buttons = container.querySelectorAll('button');
    const toggleBtn = buttons[0] as HTMLButtonElement;
    const popoverTrigger = buttons[1] as HTMLButtonElement;

    act(() => {
      toggleBtn.click();
    });
    expect(onToggle).toHaveBeenCalled();
    expect(onToggle.mock.calls[0]?.[0]).toBe(false);

    // Open popover
    act(() => {
      popoverTrigger.click();
    });

    // Header actions: Auto-detect, Reset, Pick Container
    const autoDetectBtn = container.querySelector(
      'button[aria-label="Auto-detect page container"]',
    ) as HTMLButtonElement;
    const resetBtn = container.querySelector(
      'button[aria-label="Reset settings"]',
    ) as HTMLButtonElement;
    expect(autoDetectBtn).not.toBeNull();
    expect(resetBtn.disabled).toBe(false);

    act(() => {
      autoDetectBtn.click();
      resetBtn.click();
    });
    expect(onAutoDetect).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);

    // Color & Opacity changes in columns mode
    const hexInput = container.querySelector(
      '#guide-color',
    ) as HTMLInputElement;
    const colorPicker = container.querySelector(
      'input[aria-label="Pick guide color"]',
    ) as HTMLInputElement;
    const opacityInput = container.querySelector(
      'input[aria-label="Guide opacity"]',
    ) as HTMLInputElement;

    act(() => {
      setNativeInputValue(hexInput, '#00ff88!!');
    });
    expect(onColumnsChange).toHaveBeenLastCalledWith({ color: '#00ff88' });

    act(() => {
      setNativeInputValue(colorPicker, '#123456');
    });
    expect(onColumnsChange).toHaveBeenLastCalledWith({ color: '#123456' });

    act(() => {
      setNativeInputValue(opacityInput, '150');
    });
    expect(onColumnsChange).toHaveBeenLastCalledWith({ opacity: 100 });

    // Switch to rows mode and test updateActiveBase routing
    renderTool('rows', false);
    act(() => {
      setNativeInputValue(
        container.querySelector('#guide-color') as HTMLInputElement,
        'abcdef',
      );
    });
    expect(onRowsChange).toHaveBeenLastCalledWith({ color: '#abcdef' });

    // Switch to grid mode and test updateActiveBase routing + Pick Container closes popover
    renderTool('grid', false);
    act(() => {
      setNativeInputValue(
        container.querySelector(
          'input[aria-label="Guide opacity"]',
        ) as HTMLInputElement,
        '35',
      );
    });
    expect(onGridChange).toHaveBeenLastCalledWith({ opacity: 35 });

    const pickBtn = container.querySelector(
      'button[aria-label="Pick container on page"]',
    ) as HTMLButtonElement;
    act(() => {
      pickBtn.click();
    });
    expect(onTogglePickContainer).toHaveBeenCalledTimes(1);

    // Re-open popover and click header Close button
    act(() => {
      popoverTrigger.click();
    });
    const closeHeaderBtn = container.querySelector(
      'button[aria-label="Close"]',
    ) as HTMLButtonElement;
    act(() => {
      closeHeaderBtn.click();
    });
  });

  it('updates LinearGuideFields count, maxSize (input, blur, presets), itemSize, margin, gutter, offset, followScroll, and unlinks tracked element', () => {
    const onChange = vi.fn();
    const onClearTrackedElement = vi.fn();

    act(() => {
      root.render(
        <PortalContext.Provider value={container}>
          <LinearGuideFields
            mode="columns"
            settings={{
              ...DEFAULT_COLUMNS_SETTINGS,
              alignment: 'center',
              itemSize: 80,
            }}
            trackedElementLabel="main#app"
            onClearTrackedElement={onClearTrackedElement}
            onChange={onChange}
            cleanHex="FF0000"
            validCssHex="#FF0000"
            opacity={10}
            onHexChange={vi.fn()}
            onOpacityChange={vi.fn()}
          />
        </PortalContext.Provider>,
      );
    });

    expect(container.textContent).toContain('main#app');

    const unlinkBtn = container.querySelector(
      'button[aria-label="Unlink from element"]',
    ) as HTMLButtonElement;
    act(() => {
      unlinkBtn.click();
    });
    expect(onClearTrackedElement).toHaveBeenCalledTimes(1);

    // Scrubbable fields: count, item-size, margin, gutter, offset
    const fieldExpectations: Array<[string, Record<string, number>]> = [
      ['#guide-count', { count: 11 }],
      ['#guide-item-size', { itemSize: 79 }],
      ['#guide-margin', { margin: 23 }],
      ['#guide-gutter', { gutter: 15 }],
      ['#guide-offset', { offset: -1 }],
    ];

    for (const [selector, expectedPatch] of fieldExpectations) {
      const input = container.querySelector(selector) as HTMLInputElement;
      act(() => {
        input.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
        );
      });
      expect(onChange).toHaveBeenLastCalledWith(expectedPatch);
    }

    // Max size input: valid >= 60, small < 60 clamped on blur, empty cleared on blur, Escape cancel
    const maxSizeInput = container.querySelector(
      '#guide-max-size',
    ) as HTMLInputElement;

    act(() => {
      maxSizeInput.focus();
    });
    act(() => {
      setNativeInputValue(maxSizeInput, '1280');
    });
    expect(onChange).toHaveBeenLastCalledWith({ maxSize: 1280 });

    onChange.mockClear();
    act(() => {
      setNativeInputValue(maxSizeInput, '30');
    });
    act(() => {
      maxSizeInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      maxSizeInput.blur();
    });
    expect(onChange).toHaveBeenLastCalledWith({ maxSize: 60 });

    act(() => {
      maxSizeInput.focus();
    });
    act(() => {
      setNativeInputValue(maxSizeInput, '');
    });
    act(() => {
      maxSizeInput.blur();
    });
    expect(onChange).toHaveBeenLastCalledWith({ maxSize: null });

    onChange.mockClear();
    act(() => {
      setNativeInputValue(maxSizeInput, '40');
    });
    act(() => {
      maxSizeInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });
    expect(onChange).not.toHaveBeenCalled();

    // Max width presets dropdown
    const presetsTrigger = container.querySelector(
      'button[aria-label="Max width presets"]',
    ) as HTMLButtonElement;
    act(() => {
      presetsTrigger.click();
    });

    const presetItem = Array.from(
      container.querySelectorAll('[role="menuitem"]'),
    ).find((el) => el.textContent?.includes('1440px')) as
      | HTMLElement
      | undefined;
    if (presetItem) {
      act(() => {
        presetItem.click();
      });
      expect(onChange).toHaveBeenLastCalledWith({ maxSize: 1440 });
    }

    // Follow scroll toggle
    const positionToggle = Array.from(
      container.querySelectorAll('button'),
    ).find((btn) =>
      btn.textContent?.includes('Fixed to viewport'),
    ) as HTMLButtonElement;
    act(() => {
      positionToggle.click();
    });
    expect(onChange).toHaveBeenLastCalledWith({ followScroll: true });
  });

  it('updates GridGuideFields size, offsetX, offsetY, and followScroll toggle', () => {
    const onChange = vi.fn();

    act(() => {
      root.render(
        <GridGuideFields
          settings={{ ...DEFAULT_GRID_SETTINGS, followScroll: true }}
          onChange={onChange}
          cleanHex="FF0000"
          validCssHex="#FF0000"
          opacity={20}
          onHexChange={vi.fn()}
          onOpacityChange={vi.fn()}
        />,
      );
    });

    const sizeInput = container.querySelector(
      '#guide-size',
    ) as HTMLInputElement;
    const offsetXInput = container.querySelector(
      '#guide-grid-offset-x',
    ) as HTMLInputElement;
    const offsetYInput = container.querySelector(
      '#guide-grid-offset-y',
    ) as HTMLInputElement;

    act(() => {
      sizeInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenLastCalledWith({ size: 9 });

    act(() => {
      offsetXInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenLastCalledWith({ offsetX: 1 });

    act(() => {
      offsetYInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenLastCalledWith({ offsetY: -1 });

    const scrollToggle = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Scroll with page'),
    ) as HTMLButtonElement;
    act(() => {
      scrollToggle.click();
    });
    expect(onChange).toHaveBeenLastCalledWith({ followScroll: false });
  });
});
