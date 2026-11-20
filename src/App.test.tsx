import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { LAYOUT_GUIDES_STORAGE_KEY } from '@/components/overlay/layout-guides/constants';
import {
  DEFAULT_EXTENSION_SETTINGS,
  saveExtensionSettings,
} from '@/lib/settings-storage';

describe('App', () => {
  let portalContainer: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    window.localStorage.clear();
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

  it('renders dock and layout guides overlay and responds to global hotkeys (Shift+G, Ctrl+;, Shift+1/2/3, Shift+A, Shift+I, Shift+C)', () => {
    const onClose = vi.fn();

    act(() => {
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

  it('ignores global hotkeys when focus is inside an input element', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);

    act(() => {
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

  it('supports container snapping, resize tracking, scroll tracking, field edits across modes, and reset', () => {
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

    act(() => {
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
      '[data-slot="popover-trigger"]',
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
});
