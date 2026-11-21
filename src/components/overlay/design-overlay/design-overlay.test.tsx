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
    const scaleOneBtn = container.querySelector(
      '[data-testid="design-overlay-scale-1"]',
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

    expect(scaleHalfBtn.getAttribute('aria-pressed')).toBe('true');

    act(() => {
      scaleOneBtn.click();
    });
    expect(onPatch).toHaveBeenLastCalledWith({ scale: 1 });

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

  it('handles DesignOverlayLayer canvas fallback on img error, followScroll=false, and non-left clicks', async () => {
    const drawImage = vi.fn();
    const clearRect = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
      clearRect,
    } as unknown as CanvasRenderingContext2D);

    const closeBitmap = vi.fn();
    Object.defineProperty(window, 'createImageBitmap', {
      value: vi.fn().mockResolvedValue({
        width: 100,
        height: 80,
        close: closeBitmap,
      }),
      configurable: true,
    });

    const onMove = vi.fn();
    const state: DesignOverlayState = {
      ...buildDefaultDesignOverlayState(false),
      enabled: true,
      imageUrl:
        'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E',
      fileName: 'icon.svg',
      naturalWidth: 100,
      naturalHeight: 80,
      x: 15,
      y: 25,
      scale: 1,
      locked: false,
      followScroll: false,
    };

    act(() => {
      root.render(
        <DesignOverlayLayer
          state={state}
          scroll={{ x: 50, y: 200 }}
          isInteractiveAllowed={true}
          onMove={onMove}
        />,
      );
    });

    const layer = document.body.querySelector(
      '[data-testid="design-overlay-layer"]',
    ) as HTMLDivElement;
    // followScroll: false ignores scroll offset
    expect(layer.style.transform).toContain('translate3d(15px, 25px, 0)');

    // Non-left mouse button should not initiate drag
    act(() => {
      layer.dispatchEvent(
        new MouseEvent('mousedown', { button: 2, bubbles: true }),
      );
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 200, clientY: 200 }),
      );
    });
    expect(onMove).not.toHaveBeenCalled();

    // Trigger img onError to switch to canvas fallback
    const img = layer.querySelector('img') as HTMLImageElement;
    await act(async () => {
      img.dispatchEvent(new Event('error'));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(layer.querySelector('canvas')).not.toBeNull();
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(closeBitmap).toHaveBeenCalledTimes(1);

    // Base64 data URL canvas fallback
    await act(async () => {
      root.render(
        <DesignOverlayLayer
          state={{
            ...state,
            imageUrl: 'data:image/png;base64,SGVsbG8=',
          }}
          scroll={{ x: 0, y: 0 }}
          isInteractiveAllowed={true}
          onMove={onMove}
        />,
      );
    });
    const img2 = layer.querySelector('img') as HTMLImageElement;
    await act(async () => {
      img2.dispatchEvent(new Event('error'));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(drawImage).toHaveBeenCalledTimes(2);
  });

  it('handles DesignOverlayTool toggle without image, drag-and-drop, file input, errors, scale/opacity/XY inputs, and pick target', async () => {
    const onToggle = vi.fn();
    const onPatch = vi.fn();
    const onLoadFile = vi
      .fn()
      .mockRejectedValueOnce(new Error('Unsupported'))
      .mockResolvedValue(undefined);
    const onTogglePickTarget = vi.fn();
    const onCenterHorizontal = vi.fn();

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
              onAutoFit={vi.fn()}
              onTogglePickTarget={onTogglePickTarget}
              onCenterHorizontal={onCenterHorizontal}
              onFitToViewportWidth={vi.fn()}
              onResetPosition={vi.fn()}
              onClear={vi.fn()}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    // Clicking dock toggle when no image is loaded opens the popover instead of toggling
    const dockToggle = container.querySelector(
      'button[aria-label="Toggle design overlay"]',
    ) as HTMLButtonElement;
    act(() => {
      dockToggle.click();
    });
    expect(onToggle).not.toHaveBeenCalled();

    const dropzone = container.querySelector(
      '[data-testid="design-overlay-dropzone"]',
    ) as HTMLButtonElement;
    expect(dropzone).not.toBeNull();

    // Clicking dropzone and upload button triggers hidden file input click
    const fileInput = container.querySelector(
      '[data-testid="design-overlay-file-input"]',
    ) as HTMLInputElement;
    const fileInputClickSpy = vi.spyOn(fileInput, 'click');
    act(() => {
      dropzone.click();
    });
    expect(fileInputClickSpy).toHaveBeenCalledTimes(1);

    const uploadBtn = container.querySelector(
      '[data-testid="design-overlay-upload-btn"]',
    ) as HTMLButtonElement;
    act(() => {
      uploadBtn.click();
    });
    expect(fileInputClickSpy).toHaveBeenCalledTimes(2);

    // Drop an invalid file -> shows error alert
    const badFile = new File(['bad'], 'notes.txt', { type: 'text/plain' });
    const popoverContent = dropzone.closest(
      '[data-slot="popover-content"]',
    ) as HTMLElement;
    await act(async () => {
      popoverContent.dispatchEvent(
        new Event('dragover', { bubbles: true, cancelable: true }),
      );
      popoverContent.dispatchEvent(new Event('dragleave', { bubbles: false }));
      const dropEvent = new Event('drop', {
        bubbles: true,
        cancelable: true,
      }) as unknown as DragEvent;
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [badFile] },
      });
      popoverContent.dispatchEvent(dropEvent);
      await Promise.resolve();
    });
    expect(
      container.querySelector('[data-testid="design-overlay-error"]'),
    ).not.toBeNull();

    // File input change with valid file clears error and calls onLoadFile
    const goodFile = new File(['ok'], 'mockup.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', {
      value: [goodFile],
      configurable: true,
    });
    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      await Promise.resolve();
    });
    expect(onLoadFile).toHaveBeenLastCalledWith(goodFile, 'mockup.png');
    expect(
      container.querySelector('[data-testid="design-overlay-error"]'),
    ).toBeNull();

    // Render with loaded image
    const loadedState: DesignOverlayState = {
      ...emptyState,
      imageUrl: 'data:image/png;base64,AAAA',
      fileName: 'hero.png',
      naturalWidth: 1440,
      naturalHeight: 900,
      scale: 1,
      opacity: 50,
    };

    await act(async () => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <DesignOverlayTool
              state={loadedState}
              quotaExceeded={false}
              isPickingTarget={true}
              onToggle={onToggle}
              onPatch={onPatch}
              onLoadFile={onLoadFile}
              onAutoFit={vi.fn()}
              onTogglePickTarget={onTogglePickTarget}
              onCenterHorizontal={onCenterHorizontal}
              onFitToViewportWidth={vi.fn()}
              onResetPosition={vi.fn()}
              onClear={vi.fn()}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    // Dock toggle with image calls onToggle
    act(() => {
      dockToggle.click();
    });
    expect(onToggle).toHaveBeenCalledWith(false);

    // Center X, X/Y inputs, scale %, opacity input
    act(() => {
      (
        container.querySelector(
          '[data-testid="design-overlay-center-x"]',
        ) as HTMLButtonElement
      ).click();
    });
    expect(onCenterHorizontal).toHaveBeenCalledTimes(1);

    const xInput = container.querySelector(
      '#design-overlay-x',
    ) as HTMLInputElement;
    const yInput = container.querySelector(
      '#design-overlay-y',
    ) as HTMLInputElement;
    const scalePctInput = container.querySelector(
      '#design-overlay-scale-pct',
    ) as HTMLInputElement;
    const opacityInput = container.querySelector(
      '#design-overlay-opacity',
    ) as HTMLInputElement;

    act(() => {
      xInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(onPatch).toHaveBeenLastCalledWith({ x: 1 });

    act(() => {
      yInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    });
    expect(onPatch).toHaveBeenLastCalledWith({ y: -1 });

    act(() => {
      scalePctInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(onPatch).toHaveBeenLastCalledWith({ scale: 1.01 });

    act(() => {
      opacityInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(onPatch).toHaveBeenLastCalledWith({ opacity: 51 });

    // Close popover via header close button
    act(() => {
      (
        container.querySelector(
          'button[aria-label="Close"]',
        ) as HTMLButtonElement
      ).click();
    });
  });
});
