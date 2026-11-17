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

  it('renders LayoutGuidesTool and toggles guides on button click', () => {
    const onToggle = vi.fn();

    act(() => {
      root.render(
        <TooltipProvider>
          <LayoutGuidesTool
            state={DEFAULT_LAYOUT_GUIDES_STATE}
            isInspectActive={false}
            isPickingContainer={false}
            trackedElementLabel={null}
            hasCustomSiteSettings={false}
            onToggle={onToggle}
            onToggleInspect={vi.fn()}
            onTypeChange={vi.fn()}
            onColumnsChange={vi.fn()}
            onRowsChange={vi.fn()}
            onGridChange={vi.fn()}
            onAutoDetect={vi.fn()}
            onTogglePickContainer={vi.fn()}
            onClearTrackedElement={vi.fn()}
            onReset={vi.fn()}
          />
        </TooltipProvider>,
      );
    });

    const toggleBtn = container.querySelector(
      'button[aria-label="Toggle layout guides"]',
    ) as HTMLButtonElement;
    expect(toggleBtn).not.toBeNull();

    act(() => {
      toggleBtn.click();
    });
    expect(onToggle).toHaveBeenCalled();
    expect(onToggle.mock.calls[0]?.[0]).toBe(false);
  });

  it('updates LinearGuideFields count, followScroll, and unlinks tracked element', () => {
    const onChange = vi.fn();
    const onClearTrackedElement = vi.fn();

    act(() => {
      root.render(
        <LinearGuideFields
          mode="columns"
          settings={DEFAULT_COLUMNS_SETTINGS}
          trackedElementLabel="main#app"
          onClearTrackedElement={onClearTrackedElement}
          onChange={onChange}
          cleanHex="FF0000"
          validCssHex="#FF0000"
          opacity={10}
          onHexChange={vi.fn()}
          onOpacityChange={vi.fn()}
        />,
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

    const countInput = container.querySelector(
      '#guide-count',
    ) as HTMLInputElement;
    act(() => {
      countInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenCalledWith({ count: 11 });
  });

  it('updates GridGuideFields size and followScroll toggle', () => {
    const onChange = vi.fn();
    const onHexChange = vi.fn();

    act(() => {
      root.render(
        <GridGuideFields
          settings={DEFAULT_GRID_SETTINGS}
          onChange={onChange}
          cleanHex="FF0000"
          validCssHex="#FF0000"
          opacity={20}
          onHexChange={onHexChange}
          onOpacityChange={vi.fn()}
        />,
      );
    });

    const sizeInput = container.querySelector(
      '#guide-size',
    ) as HTMLInputElement;
    act(() => {
      sizeInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenCalledWith({ size: 9 });
  });
});
