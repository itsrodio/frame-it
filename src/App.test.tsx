import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { LAYOUT_GUIDES_STORAGE_KEY } from '@/components/overlay/layout-guides/constants';

describe('App', () => {
  let portalContainer: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    window.localStorage.clear();
    portalContainer = document.createElement('div');
    portalContainer.id = 'frameit-root';
    document.body.appendChild(portalContainer);
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

  it('renders dock and layout guides overlay and responds to global hotkeys (Shift+G, Shift+1/2/3, Shift+I, Shift+C)', () => {
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

    // Shift+3 switches to Grid and enables guides + saves custom site settings
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'Digit3',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(toggleGuidesBtn.getAttribute('aria-pressed')).toBe('true');

    const saved = JSON.parse(
      window.localStorage.getItem(LAYOUT_GUIDES_STORAGE_KEY) ?? '{}',
    );
    expect(saved.type).toBe('grid');

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

    // Shift+C switches to Pick Container mode and turns off Inspect mode
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyC',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(inspectBtn.getAttribute('aria-pressed')).toBe('false');
    expect(portalContainer.textContent).toContain(
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
});
