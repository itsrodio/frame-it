import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DesignOverlayLayer } from '@/components/overlay/design-overlay/design-overlay-layer';
import { DesignOverlayTool } from '@/components/overlay/design-overlay/design-overlay-tool';
import { TooltipProvider } from '@/components/ui/tooltip';
import { buildDefaultDesignOverlayState } from '@/lib/design-overlay-storage';
import { PortalContext } from '@/lib/portal-context';
import type { DesignOverlayState } from '@/types/design-overlay';

describe('DesignOverlayLayer & DesignOverlayTool', () => {
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
    for (const el of document.querySelectorAll(
      '[data-frameit-design-overlay="true"]',
    )) {
      el.remove();
    }
    container.remove();
  });

  it('mounts DesignOverlayLayer outside Shadow DOM, applies difference blend, click-through lock, and supports dragging when unlocked', () => {
    const onMove = vi.fn();
    const state: DesignOverlayState = {
      ...buildDefaultDesignOverlayState(true),
      enabled: true,
      imageUrl: 'data:image/png;base64,AAAA',
      fileName: 'hero.png',
      naturalWidth: 1440,
      naturalHeight: 900,
      x: 20,
      y: 40,
      scale: 0.5,
      opacity: 65,
      blendMode: 'difference',
      locked: true,
      followScroll: true,
    };

    act(() => {
      root.render(
        <DesignOverlayLayer
          state={state}
          scroll={{ x: 0, y: 10 }}
          isInteractiveAllowed={true}
          onMove={onMove}
        />,
      );
    });

    const layer = document.body.querySelector(
      '[data-testid="design-overlay-layer"]',
    ) as HTMLDivElement;
    expect(layer).not.toBeNull();
    expect(container.contains(layer)).toBe(false);
    expect(layer.parentElement).toBe(document.body);
    expect(layer.style.mixBlendMode).toBe('difference');
    expect(layer.style.pointerEvents).toBe('none');
    expect(layer.style.transform).toContain('translate3d(20px, 30px, 0)');
    expect(layer.style.transform).toContain('scale(0.5)');
    expect(
      container.querySelector('[data-testid="design-overlay-unlocked-frame"]'),
    ).toBeNull();

    // Unlock and test mouse drag
    act(() => {
      root.render(
        <DesignOverlayLayer
          state={{ ...state, locked: false }}
          scroll={{ x: 0, y: 10 }}
          isInteractiveAllowed={true}
          onMove={onMove}
        />,
      );
    });

    expect(layer.style.pointerEvents).toBe('auto');
    expect(
      container.querySelector('[data-testid="design-overlay-unlocked-frame"]'),
    ).not.toBeNull();

    act(() => {
      layer.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          clientX: 100,
          clientY: 100,
        }),
      );
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 125, clientY: 115 }),
      );
    });
    expect(onMove).toHaveBeenLastCalledWith(45, 55);

    // Holding Shift locks movement to the dominant axis (horizontal when |dx| >= |dy|)
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 140,
          clientY: 112,
          shiftKey: true,
        }),
      );
    });
    expect(onMove).toHaveBeenLastCalledWith(60, 40);

    // Holding Shift locks movement to vertical axis when |dy| > |dx|
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: 108,
          clientY: 150,
          shiftKey: true,
        }),
      );
    });
    expect(onMove).toHaveBeenLastCalledWith(20, 90);

    // Pressing/releasing Shift mid-drag updates the position immediately
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'Shift', shiftKey: false }),
      );
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
    expect(onMove).toHaveBeenLastCalledWith(28, 90);
  });

  it('renders DesignOverlayTool empty dropzone and full controls when an image is loaded', async () => {
    const onToggle = vi.fn();
    const onPatch = vi.fn();
    const onLoadFile = vi.fn().mockResolvedValue(undefined);
    const onAutoFit = vi.fn();
    const onTogglePickTarget = vi.fn();
    const onCenterHorizontal = vi.fn();
    const onFitToViewportWidth = vi.fn();
    const onResetPosition = vi.fn();
    const onClear = vi.fn();

    const emptyState = buildDefaultDesignOverlayState(true);

    act(() => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <DesignOverlayTool
              state={emptyState}
              quotaExceeded={false}
              isPickingTarget={false}
              onToggle={onToggle}
              onPatch={onPatch}
              onLoadFile={onLoadFile}
              onAutoFit={onAutoFit}
              onTogglePickTarget={onTogglePickTarget}
              onCenterHorizontal={onCenterHorizontal}
              onFitToViewportWidth={onFitToViewportWidth}
              onResetPosition={onResetPosition}
              onClear={onClear}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    const trigger = container.querySelector(
      '[data-testid="design-overlay-popover-trigger"]',
    ) as HTMLButtonElement;
    act(() => {
      trigger.click();
    });

    expect(
      container.querySelector('[data-testid="design-overlay-dropzone"]'),
    ).not.toBeNull();

    const loadedState: DesignOverlayState = {
      ...emptyState,
      imageUrl: 'data:image/png;base64,AAAA',
      fileName: 'landing.png',
      naturalWidth: 2880,
      naturalHeight: 1600,
      scale: 0.5,
    };

    await act(async () => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <DesignOverlayTool
              state={loadedState}
              quotaExceeded={true}
              isPickingTarget={false}
              onToggle={onToggle}
              onPatch={onPatch}
              onLoadFile={onLoadFile}
              onAutoFit={onAutoFit}
              onTogglePickTarget={onTogglePickTarget}
              onCenterHorizontal={onCenterHorizontal}
              onFitToViewportWidth={onFitToViewportWidth}
              onResetPosition={onResetPosition}
              onClear={onClear}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    expect(container.textContent).toContain('landing.png');
    expect(container.textContent).toContain('2880×1600');
    expect(container.textContent).toContain('→ 1440×800');
    expect(
      container.querySelector('[data-testid="design-overlay-quota-warning"]'),
    ).not.toBeNull();

    const autoFitBtn = container.querySelector(
      '[data-testid="design-overlay-auto-fit"]',
    ) as HTMLButtonElement;
    const pickTargetBtn = container.querySelector(
      '[data-testid="design-overlay-pick-target"]',
    ) as HTMLButtonElement;
    const scaleHalfBtn = container.querySelector(
      '[data-testid="design-overlay-scale-0.5"]',
    ) as HTMLButtonElement;
    const fitWidthBtn = container.querySelector(
      '[data-testid="design-overlay-fit-width"]',
    ) as HTMLButtonElement;
    const blendDiffBtn = container.querySelector(
      '[data-testid="design-overlay-blend-difference"]',
    ) as HTMLButtonElement;
    const lockBtn = container.querySelector(
      '[data-testid="design-overlay-lock-toggle"]',
    ) as HTMLButtonElement;
    const scrollBtn = container.querySelector(
      '[data-testid="design-overlay-scroll-toggle"]',
    ) as HTMLButtonElement;
    const resetPosBtn = container.querySelector(
      '[data-testid="design-overlay-reset-pos"]',
    ) as HTMLButtonElement;
    const clearBtn = container.querySelector(
      '[data-testid="design-overlay-clear-btn"]',
    ) as HTMLButtonElement;

    act(() => {
      autoFitBtn.click();
    });
    expect(onAutoFit).toHaveBeenCalledTimes(1);

    act(() => {
      scaleHalfBtn.click();
    });
    expect(onPatch).toHaveBeenLastCalledWith({ scale: 0.5 });

    act(() => {
      fitWidthBtn.click();
    });
    expect(onFitToViewportWidth).toHaveBeenCalledTimes(1);

    act(() => {
      blendDiffBtn.click();
    });
    expect(onPatch).toHaveBeenLastCalledWith({ blendMode: 'difference' });

    act(() => {
      lockBtn.click();
    });
    expect(onPatch).toHaveBeenLastCalledWith({ locked: false });

    act(() => {
      scrollBtn.click();
    });
    expect(onPatch).toHaveBeenLastCalledWith({ followScroll: false });

    act(() => {
      resetPosBtn.click();
    });
    expect(onResetPosition).toHaveBeenCalledTimes(1);

    act(() => {
      pickTargetBtn.click();
    });
    expect(onTogglePickTarget).toHaveBeenCalledTimes(1);

    act(() => {
      clearBtn.click();
    });
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
