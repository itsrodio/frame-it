import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDesignOverlay } from '@/hooks/use-design-overlay';
import { useDesignOverlayInteraction } from '@/hooks/use-design-overlay-interaction';
import * as designOverlayStorage from '@/lib/design-overlay-storage';
import type { DesignOverlayState } from '@/types/design-overlay';
import type { DetectedContainerInfo } from '@/types/layout-guides';

function DesignOverlayHarness({
  lockedByDefault,
  onUnlock,
  apiRef,
}: {
  lockedByDefault: boolean;
  onUnlock?: () => void;
  apiRef: { current: ReturnType<typeof useDesignOverlay> | null };
}) {
  apiRef.current = useDesignOverlay({ lockedByDefault, onUnlock });
  return null;
}

function InteractionHarness({
  portalContainer,
  canNudge,
  onPasteImage,
  onNudge,
}: {
  portalContainer: HTMLElement;
  canNudge: boolean;
  onPasteImage: (file: File | Blob, fileName: string) => void;
  onNudge: (dx: number, dy: number) => void;
}) {
  useDesignOverlayInteraction({
    portalContainer,
    canNudge,
    onPasteImage,
    onNudge,
  });
  return null;
}

describe('useDesignOverlay & useDesignOverlayInteraction', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
    Object.defineProperty(window, 'innerWidth', {
      value: 1440,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 900,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollX', {
      value: 0,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      configurable: true,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  it('manages image loading, replacement, patching, locking, alignment, snapping, and clearing', async () => {
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/png;base64,AAAA';
        this.onload?.(new ProgressEvent('load') as ProgressEvent<FileReader>);
      }
    }
    class MockImage {
      naturalWidth = 2880;
      naturalHeight = 1800;
      onload: (() => void) | null = null;
      set src(_val: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.spyOn(window, 'FileReader').mockImplementation(
      MockFileReader as unknown as typeof FileReader,
    );
    vi.spyOn(window, 'Image').mockImplementation(
      MockImage as unknown as typeof Image,
    );

    const onUnlock = vi.fn();
    const apiRef: { current: ReturnType<typeof useDesignOverlay> | null } = {
      current: null,
    };

    await act(async () => {
      root.render(
        <DesignOverlayHarness
          lockedByDefault={false}
          onUnlock={onUnlock}
          apiRef={apiRef}
        />,
      );
    });

    const getApi = () => {
      if (!apiRef.current) throw new Error('Hook not mounted');
      return apiRef.current;
    };

    // toggleLock and autoFit are no-ops before an image is loaded
    await act(async () => {
      getApi().toggleLock();
      getApi().autoFit();
      getApi().toggleShortcut();
      await Promise.resolve();
    });
    expect(getApi().state.imageUrl).toBeNull();
    expect(onUnlock).not.toHaveBeenCalled();

    // Load initial image (lockedByDefault=false triggers onUnlock)
    const file1 = new File(['bytes'], 'hero.png', { type: 'image/png' });
    await act(async () => {
      await getApi().loadImage(file1, 'hero.png');
    });
    expect(getApi().state.imageUrl).toBe('data:image/png;base64,AAAA');
    expect(getApi().state.scale).toBe(0.5);
    expect(getApi().state.locked).toBe(false);
    expect(onUnlock).toHaveBeenCalledTimes(1);

    // Move & nudge
    await act(async () => {
      getApi().move(50, 80);
    });
    expect(getApi().state.x).toBe(50);
    expect(getApi().state.y).toBe(80);

    await act(async () => {
      getApi().nudge(-10, 20);
    });
    expect(getApi().state.x).toBe(40);
    expect(getApi().state.y).toBe(100);

    // Replace image preserves existing x, y, scale, locked
    const file2 = new File(['bytes2'], 'hero-v2.png', { type: 'image/png' });
    await act(async () => {
      await getApi().loadImage(file2, 'hero-v2.png');
    });
    expect(getApi().state.fileName).toBe('hero-v2.png');
    expect(getApi().state.x).toBe(40);
    expect(getApi().state.y).toBe(100);

    // Center horizontal, fitToViewportWidth, autoFit, resetPosition
    await act(async () => {
      getApi().patch({ scale: 0.25 });
      getApi().centerHorizontal();
    });
    expect(getApi().state.x).toBe(360); // (1440 - 2880*0.25)/2 = 360

    await act(async () => {
      getApi().fitToViewportWidth();
    });
    expect(getApi().state.scale).toBe(0.5);
    expect(getApi().state.x).toBe(0);

    await act(async () => {
      getApi().move(123, 456);
      getApi().autoFit();
    });
    expect(getApi().state.x).toBe(0);
    expect(getApi().state.y).toBe(0);

    await act(async () => {
      getApi().move(77, 88);
      getApi().resetPosition();
    });
    expect(getApi().state.x).toBe(0);
    expect(getApi().state.y).toBe(0);

    // snapToElement
    const targetEl = document.createElement('section');
    const info: DetectedContainerInfo = {
      element: targetEl,
      tagName: 'section',
      label: 'section#hero',
      rect: {
        x: 120,
        y: 200,
        left: 120,
        top: 200,
        width: 1440,
        height: 600,
        right: 1560,
        bottom: 800,
        toJSON: () => ({}),
      },
      maxWidth: 1440,
      paddingInline: 0,
      columnCount: null,
      columnGap: null,
      alignment: 'center',
      offset: 0,
    };
    await act(async () => {
      getApi().snapToElement(info);
    });
    expect(getApi().state.x).toBe(120);
    expect(getApi().state.y).toBe(200);
    expect(getApi().state.scale).toBe(0.5);

    // toggleEnabled & toggleShortcut & toggleLock
    await act(async () => {
      getApi().toggleEnabled(false);
    });
    expect(getApi().state.enabled).toBe(false);

    await act(async () => {
      getApi().toggleShortcut();
    });
    expect(getApi().state.enabled).toBe(true);

    await act(async () => {
      getApi().patch({ locked: true });
    });
    expect(getApi().state.locked).toBe(true);

    onUnlock.mockClear();
    await act(async () => {
      getApi().toggleLock();
    });
    expect(getApi().state.locked).toBe(false);
    expect(onUnlock).toHaveBeenCalledTimes(1);

    // Clear resets state and clears storage
    const clearSpy = vi.spyOn(designOverlayStorage, 'clearSiteDesignOverlay');
    await act(async () => {
      getApi().clear();
    });
    expect(getApi().state.imageUrl).toBeNull();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('prevents stale async storage load from overwriting user edits made before load finishes', async () => {
    let resolveLoad!: (val: DesignOverlayState) => void;
    vi.spyOn(designOverlayStorage, 'loadSiteDesignOverlay').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const apiRef: { current: ReturnType<typeof useDesignOverlay> | null } = {
      current: null,
    };

    act(() => {
      root.render(
        <DesignOverlayHarness lockedByDefault={true} apiRef={apiRef} />,
      );
    });

    act(() => {
      apiRef.current?.patch({ x: 99, opacity: 80 });
    });

    await act(async () => {
      resolveLoad({
        ...designOverlayStorage.buildDefaultDesignOverlayState(true),
        x: 10,
        opacity: 20,
      });
      await Promise.resolve();
    });

    expect(apiRef.current?.state.x).toBe(99);
    expect(apiRef.current?.state.opacity).toBe(80);
  });

  it('handles paste and arrow-key nudging while respecting shadow active elements, widgets, and modifier keys', () => {
    const host = document.createElement('frameit-overlay');
    const shadow = host.attachShadow({ mode: 'open' });
    const portalContainer = document.createElement('div');
    shadow.appendChild(portalContainer);
    document.body.appendChild(host);

    const onPasteImage = vi.fn();
    const onNudge = vi.fn();

    act(() => {
      root.render(
        <InteractionHarness
          portalContainer={portalContainer}
          canNudge={true}
          onPasteImage={onPasteImage}
          onNudge={onNudge}
        />,
      );
    });

    // All 4 arrow keys + Shift
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }),
      );
    });
    expect(onNudge).toHaveBeenNthCalledWith(1, -1, 0);
    expect(onNudge).toHaveBeenNthCalledWith(2, 1, 0);
    expect(onNudge).toHaveBeenNthCalledWith(3, 0, -1);
    expect(onNudge).toHaveBeenNthCalledWith(4, 0, 10);

    // Modifier keys (ctrl/meta/alt) are ignored
    onNudge.mockClear();
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', altKey: true }),
      );
    });
    expect(onNudge).not.toHaveBeenCalled();

    // Interactive widget (slider/listbox/menu) inside shadow DOM suppresses arrow nudges
    const slider = document.createElement('div');
    slider.setAttribute('role', 'slider');
    slider.tabIndex = 0;
    portalContainer.appendChild(slider);
    slider.focus();
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
    expect(onNudge).not.toHaveBeenCalled();

    // Editable input inside shadow DOM suppresses paste
    const shadowInput = document.createElement('input');
    portalContainer.appendChild(shadowInput);
    shadowInput.focus();
    const pngFile = new File(['x'], 'shot.png', { type: 'image/png' });
    const pasteEv = new Event('paste', {
      bubbles: true,
      cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperty(pasteEv, 'clipboardData', {
      value: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => pngFile }],
        files: [pngFile],
      },
    });
    act(() => {
      window.dispatchEvent(pasteEv);
    });
    expect(onPasteImage).not.toHaveBeenCalled();

    // Non-image paste is ignored
    shadowInput.blur();
    const textPaste = new Event('paste', {
      bubbles: true,
      cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperty(textPaste, 'clipboardData', {
      value: {
        items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }],
        files: [],
      },
    });
    act(() => {
      window.dispatchEvent(textPaste);
    });
    expect(onPasteImage).not.toHaveBeenCalled();
  });
});
