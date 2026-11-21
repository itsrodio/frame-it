import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { LAYOUT_GUIDES_STORAGE_KEY } from '@/components/overlay/layout-guides/constants';
import {
  DEFAULT_EXTENSION_SETTINGS,
  getCachedSettings,
  saveExtensionSettings,
} from '@/lib/settings-storage';

describe('App', () => {
  let portalContainer: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      configurable: true,
    });
    Object.defineProperty(window, 'scrollX', {
      value: 0,
      configurable: true,
    });
    const overlayHost = document.createElement('frameit-overlay');
    portalContainer = document.createElement('div');
    portalContainer.id = 'frameit-root';
    overlayHost.appendChild(portalContainer);
    document.body.appendChild(overlayHost);
    root = ReactDOM.createRoot(portalContainer);

    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  it('renders dock and layout guides overlay and responds to global hotkeys (Shift+G, Ctrl+;, Shift+1/2/3, Shift+A, Shift+I, Shift+C)', async () => {
    const onClose = vi.fn();

    await act(async () => {
      root.render(<App portalContainer={portalContainer} onClose={onClose} />);
    });

    const toggleGuidesBtn = portalContainer.querySelector(
      'button[aria-label="Toggle layout guides"]',
    ) as HTMLButtonElement;
    expect(toggleGuidesBtn).not.toBeNull();
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('true');

    // Shift+G toggles guides off
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyG',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('false');

    // Ctrl+; toggles guides back on
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'Semicolon',
          ctrlKey: true,
          bubbles: true,
        }),
      );
    });
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('true');

    // Shift+2 switches to Rows, Shift+1 switches to Columns, Shift+3 switches to Grid
    for (const [code, expectedType] of [
      ['Digit2', 'rows'],
      ['Digit1', 'columns'],
      ['Digit3', 'grid'],
    ] as const) {
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', {
            code,
            shiftKey: true,
            bubbles: true,
          }),
        );
      });
      const saved = JSON.parse(
        window.localStorage.getItem(LAYOUT_GUIDES_STORAGE_KEY) ?? '{}',
      );
      expect(saved.type).toBe(expectedType);
    }

    // Shift+A triggers auto-detect
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyA',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });

    // Shift+I toggles Inspect mode
    const inspectBtn = portalContainer.querySelector(
      'button[aria-label="Inspect & measure distances"]',
    ) as HTMLButtonElement;
    expect(inspectBtn.getAttribute('aria-pressed')).toBe('false');

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyI',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(inspectBtn.getAttribute('aria-pressed')).toBe('true');

    // Escape cancels Inspect mode via InspectMeasureOverlay onCancel
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(inspectBtn.getAttribute('aria-pressed')).toBe('false');

    // Shift+C switches to Pick Container mode and Escape cancels it
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyC',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(portalContainer.textContent).toContain(
      'Click any container on the page to snap layout guides',
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(portalContainer.textContent).not.toContain(
      'Click any container on the page to snap layout guides',
    );
  });

  it('ignores global hotkeys when focus is inside an input element', async () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    await act(async () => {
      root.render(<App portalContainer={portalContainer} onClose={vi.fn()} />);
    });

    const toggleGuidesBtn = portalContainer.querySelector(
      'button[aria-label="Toggle layout guides"]',
    ) as HTMLButtonElement;
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('true');

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyG',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });

    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('supports container snapping, resize tracking, scroll tracking, field edits across modes, and reset', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1400,
      configurable: true,
    });
    const pageContainer = document.createElement('main');
    pageContainer.id = 'page-main';
    document.body.appendChild(pageContainer);

    vi.spyOn(pageContainer, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 0,
      left: 100,
      top: 0,
      width: 1200,
      height: 800,
      right: 1300,
      bottom: 800,
      toJSON: () => ({}),
    });

    await act(async () => {
      root.render(<App portalContainer={portalContainer} onClose={vi.fn()} />);
    });

    // Click Toggle layout guides button directly (handleToggle)
    const toggleGuidesBtn = portalContainer.querySelector(
      'button[aria-label="Toggle layout guides"]',
    ) as HTMLButtonElement;
    act(() => {
      toggleGuidesBtn.click();
    });
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('false');

    // Shift+A auto-detects pageContainer and re-enables guides
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyA',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('true');

    // Enable Inspect mode via dock button and Shift+Click pageContainer to snap guides to it
    const inspectBtn = portalContainer.querySelector(
      'button[aria-label="Inspect & measure distances"]',
    ) as HTMLButtonElement;
    act(() => {
      inspectBtn.click();
    });
    expect(inspectBtn.getAttribute('aria-pressed')).toBe('true');

    act(() => {
      pageContainer.dispatchEvent(
        new MouseEvent('click', { bubbles: true, shiftKey: true }),
      );
    });

    // Open LayoutGuidesTool popover
    const popoverTrigger = portalContainer.querySelector(
      '[data-testid="guides-popover-trigger"]',
    ) as HTMLButtonElement;
    act(() => {
      popoverTrigger.click();
    });

    // Tracked element badge should be visible in columns popover
    expect(portalContainer.textContent).toContain('main#page-main');

    // Trigger window resize while trackedElement is attached, then after removal
    const rafQueue: FrameRequestCallback[] = [];
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        rafQueue.push(cb);
        return rafQueue.length;
      });
    const flushRaf = () => {
      while (rafQueue.length > 0) {
        const cb = rafQueue.shift();
        cb?.(0);
      }
    };

    act(() => {
      window.dispatchEvent(new Event('resize'));
      flushRaf();
    });
    expect(portalContainer.textContent).toContain('main#page-main');

    pageContainer.remove();
    act(() => {
      window.dispatchEvent(new Event('resize'));
      flushRaf();
    });
    expect(portalContainer.textContent).not.toContain('main#page-main');

    // Re-attach and pick container via ContainerPickerOverlay
    document.body.appendChild(pageContainer);
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(pageContainer);
    const pickBtn = portalContainer.querySelector(
      'button[aria-label="Pick container on page"]',
    ) as HTMLButtonElement;
    act(() => {
      pickBtn.click();
      flushRaf();
    });
    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 200, clientY: 200 }),
      );
      flushRaf();
    });
    act(() => {
      pageContainer.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      flushRaf();
    });

    // Re-open popover, verify tracked element badge, and unlink it via button
    act(() => {
      popoverTrigger.click();
      flushRaf();
    });
    expect(portalContainer.textContent).toContain('main#page-main');
    const unlinkBtn = portalContainer.querySelector(
      'button[aria-label="Unlink from element"]',
    ) as HTMLButtonElement;
    act(() => {
      unlinkBtn.click();
    });
    expect(portalContainer.textContent).not.toContain('main#page-main');

    // Edit columns margin (handleColumnsChange) and enable followScroll to test scroll tracking
    const marginInput = portalContainer.querySelector(
      '#guide-margin',
    ) as HTMLInputElement;
    act(() => {
      marginInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });

    const scrollToggle = Array.from(
      portalContainer.querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Fixed to viewport')) as
      | HTMLButtonElement
      | undefined;
    if (scrollToggle) {
      act(() => {
        scrollToggle.click();
      });
    }

    act(() => {
      Object.defineProperty(window, 'scrollY', {
        value: 120,
        configurable: true,
      });
      window.dispatchEvent(new Event('scroll'));
      flushRaf();
    });

    // Switch to Rows (Shift+2) and update rows count
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'Digit2',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    const rowsCountInput = portalContainer.querySelector(
      '#guide-count',
    ) as HTMLInputElement;
    act(() => {
      rowsCountInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });

    // Switch to Grid (Shift+3) and update grid size
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'Digit3',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    const gridSizeInput = portalContainer.querySelector(
      '#guide-size',
    ) as HTMLInputElement;
    act(() => {
      gridSizeInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });

    // Reset site settings via Reset button in popover header
    const resetBtn = portalContainer.querySelector(
      'button[aria-label="Reset settings"]',
    ) as HTMLButtonElement;
    act(() => {
      resetBtn.click();
    });
    expect(window.localStorage.getItem(LAYOUT_GUIDES_STORAGE_KEY)).toBeNull();
    rafSpy.mockRestore();
  });

  it('applies live ExtensionSettings updates (language, custom hotkeys, holdToClose=false)', async () => {
    const onClose = vi.fn();

    await act(async () => {
      root.render(<App portalContainer={portalContainer} onClose={onClose} />);
    });

    await act(async () => {
      await saveExtensionSettings({
        ...DEFAULT_EXTENSION_SETTINGS,
        language: 'ru',
        behavior: {
          ...DEFAULT_EXTENSION_SETTINGS.behavior,
          holdToClose: false,
          rememberSiteSettings: false,
        },
        hotkeys: {
          ...DEFAULT_EXTENSION_SETTINGS.hotkeys,
          toggleGuides: {
            code: 'KeyM',
            shift: true,
            ctrlOrMeta: false,
            alt: false,
          },
        },
      });
    });

    const toggleGuidesBtn = portalContainer.querySelector(
      'button[aria-label="Переключить направляющие сетки"]',
    ) as HTMLButtonElement;
    expect(toggleGuidesBtn).not.toBeNull();
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('true');

    // Custom hotkey Shift+M toggles guides
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyM',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('false');

    // Single click on Close button works when holdToClose is false
    const closeBtn = portalContainer.querySelector(
      'button[aria-label="Закрыть FrameIt"]',
    ) as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();
    act(() => {
      closeBtn.click();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens InspectTool dropdown popover in Dock, keeps Option defaults intact, and resets back to Option defaults', async () => {
    await saveExtensionSettings({
      ...DEFAULT_EXTENSION_SETTINGS,
      inspect: {
        ...DEFAULT_EXTENSION_SETTINGS.inspect,
        codeFormat: 'jsx',
        colorFormat: 'rgb',
      },
    });

    await act(async () => {
      root.render(<App portalContainer={portalContainer} onClose={vi.fn()} />);
    });

    const inspectPopoverTrigger = portalContainer.querySelector(
      '[data-testid="inspect-popover-trigger"]',
    ) as HTMLButtonElement;
    expect(inspectPopoverTrigger).not.toBeNull();

    await act(async () => {
      inspectPopoverTrigger.click();
    });

    const twBtn = portalContainer.querySelector(
      '[data-testid="dock-inspect-code-tailwind"]',
    ) as HTMLButtonElement;
    const oklchBtn = portalContainer.querySelector(
      '[data-testid="dock-inspect-color-oklch"]',
    ) as HTMLButtonElement;
    const remBtn = portalContainer.querySelector(
      '[data-testid="dock-inspect-unit-rem"]',
    ) as HTMLButtonElement;
    const gapToggle = portalContainer.querySelector(
      '[data-testid="dock-inspect-gap"]',
    ) as HTMLButtonElement;
    const placementToggle = portalContainer.querySelector(
      '[data-testid="dock-inspect-placement"]',
    ) as HTMLButtonElement;
    const resetBtn = portalContainer.querySelector(
      '[data-testid="inspect-popover-reset"]',
    ) as HTMLButtonElement;

    expect(resetBtn.disabled).toBe(true);

    await act(async () => {
      twBtn.click();
      oklchBtn.click();
      remBtn.click();
      gapToggle.click();
      placementToggle.click();
    });

    expect(resetBtn.disabled).toBe(false);

    // Defaults saved in Options must remain untouched
    expect(getCachedSettings().inspect.codeFormat).toBe('jsx');
    expect(getCachedSettings().inspect.colorFormat).toBe('rgb');

    await act(async () => {
      resetBtn.click();
    });

    expect(resetBtn.disabled).toBe(true);
  });

  it('pastes design overlay image globally, respects default lock, toggles via Shift+O/Shift+L, nudges with arrows, and persists across reload', async () => {
    const { saveSiteDesignOverlay, loadSiteDesignOverlay } = await import(
      '@/lib/design-overlay-storage'
    );

    // Pre-populate saved design overlay in browser.storage.local (simulating reload persistence)
    await saveSiteDesignOverlay({
      enabled: true,
      imageUrl: 'data:image/png;base64,AAAA',
      fileName: 'figma-frame.png',
      naturalWidth: 1440,
      naturalHeight: 900,
      x: 100,
      y: 200,
      scale: 1,
      opacity: 50,
      blendMode: 'normal',
      locked: true,
      followScroll: true,
    });

    await act(async () => {
      root.render(<App portalContainer={portalContainer} onClose={vi.fn()} />);
    });

    const layer = document.documentElement.querySelector(
      '[data-testid="design-overlay-layer"]',
    ) as HTMLDivElement;
    expect(layer).not.toBeNull();
    expect(layer.style.pointerEvents).toBe('none');

    // Arrow key does nothing while locked
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(layer.style.transform).toContain('translate3d(100px, 200px, 0)');

    // Shift+L unlocks overlay
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyL',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(layer.style.pointerEvents).toBe('auto');

    // ArrowRight moves 1px, Shift+ArrowDown moves 10px
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }),
      );
    });
    expect(layer.style.transform).toContain('translate3d(101px, 210px, 0)');

    const persisted = await loadSiteDesignOverlay();
    expect(persisted.x).toBe(101);
    expect(persisted.y).toBe(210);

    // Shift+O toggles overlay visibility off and back on
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyO',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(
      document.documentElement.querySelector(
        '[data-testid="design-overlay-layer"]',
      ),
    ).toBeNull();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyO',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(
      document.documentElement.querySelector(
        '[data-testid="design-overlay-layer"]',
      ),
    ).not.toBeNull();
  });

  it('handles global clipboard paste for PNG images and ignores paste inside editable targets', async () => {
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL() {
        this.result = 'data:image/png;base64,iVBORw0KGgo=';
        this.onload?.(new ProgressEvent('load') as ProgressEvent<FileReader>);
      }
    }
    class MockImage {
      naturalWidth = 1440;
      naturalHeight = 900;
      onload: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.spyOn(window, 'FileReader').mockImplementation(
      MockFileReader as unknown as typeof FileReader,
    );
    vi.spyOn(window, 'Image').mockImplementation(
      MockImage as unknown as typeof Image,
    );

    await act(async () => {
      root.render(<App portalContainer={portalContainer} onClose={vi.fn()} />);
    });

    const pngFile = new File(['png-bytes'], 'figma-copy.png', {
      type: 'image/png',
    });
    const clipboardData = {
      items: [
        {
          kind: 'file',
          type: 'image/png',
          getAsFile: () => pngFile,
        },
      ],
      files: [pngFile],
    };

    // Paste inside an input element must be ignored
    const input = document.createElement('input');
    document.body.appendChild(input);
    const inputPaste = new Event('paste', {
      bubbles: true,
      cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperty(inputPaste, 'clipboardData', {
      value: clipboardData,
    });
    await act(async () => {
      input.dispatchEvent(inputPaste);
    });
    expect(
      document.body.querySelector('[data-testid="design-overlay-layer"]'),
    ).toBeNull();

    // Global paste on window loads the design overlay mockup (locked by default)
    const windowPaste = new Event('paste', {
      bubbles: true,
      cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperty(windowPaste, 'clipboardData', {
      value: clipboardData,
    });
    await act(async () => {
      window.dispatchEvent(windowPaste);
      await Promise.resolve();
    });

    const pastedLayer = document.body.querySelector(
      '[data-testid="design-overlay-layer"]',
    ) as HTMLDivElement;
    expect(pastedLayer).not.toBeNull();
    expect(pastedLayer.style.pointerEvents).toBe('none');
  });
});
