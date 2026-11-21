import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OptionsApp } from '@/entrypoints/options/OptionsApp';
import { getCachedSettings } from '@/lib/settings-storage';

function setNativeInputValue(el: HTMLInputElement, val: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  setter?.call(el, val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('OptionsApp', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);

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
    container.remove();
  });

  it('renders settings sections, switches theme, toggles launch behaviors, records/resets hotkeys, edits default guides across tabs, and resets all', async () => {
    await act(async () => {
      root.render(<OptionsApp />);
    });

    expect(container.textContent).toContain('FrameIt Settings');
    expect(container.textContent).toContain('General & Appearance');
    expect(container.textContent).toContain('Launch & Behavior');
    expect(container.textContent).toContain('Keyboard Shortcuts');
    expect(container.textContent).toContain('Default Layout Guides');

    // Open Language Select dropdown and switch language to Russian (ru), then back to English (en)
    const languageTrigger = container.querySelector(
      '#options-language-select',
    ) as HTMLButtonElement;
    expect(languageTrigger).not.toBeNull();
    await act(async () => {
      languageTrigger.click();
    });

    const selectPopup = document.body.querySelector(
      '[data-slot="select-content"]',
    );
    expect(selectPopup).not.toBeNull();

    const ruOption = Array.from(
      document.body.querySelectorAll('[data-slot="select-item"]'),
    ).find((el) => el.textContent?.includes('Русский')) as
      | HTMLElement
      | undefined;
    expect(ruOption).toBeDefined();
    await act(async () => {
      ruOption?.click();
    });
    expect(getCachedSettings().language).toBe('ru');
    expect(container.textContent).toContain('Настройки FrameIt');

    // Switch language back to English via Select dropdown
    await act(async () => {
      languageTrigger.click();
    });
    const enOption = Array.from(
      document.body.querySelectorAll('[data-slot="select-item"]'),
    ).find((el) => el.textContent?.includes('English')) as
      | HTMLElement
      | undefined;
    await act(async () => {
      enOption?.click();
    });
    expect(getCachedSettings().language).toBe('en');

    // Open Default Guide Type Select dropdown and change to Grid
    const defaultGuideTypeTrigger = container.querySelector(
      '#options-default-guide-type',
    ) as HTMLButtonElement;
    expect(defaultGuideTypeTrigger).not.toBeNull();
    await act(async () => {
      defaultGuideTypeTrigger.click();
    });
    const gridTypeOption = Array.from(
      document.body.querySelectorAll('[data-slot="select-item"]'),
    ).find((el) => el.textContent === 'Grid') as HTMLElement | undefined;
    expect(gridTypeOption).toBeDefined();
    await act(async () => {
      gridTypeOption?.click();
    });
    expect(getCachedSettings().behavior.defaultGuideType).toBe('grid');

    // Switch theme to Dark
    const darkThemeBtn = container.querySelector(
      '[data-testid="theme-dark"]',
    ) as HTMLButtonElement;
    await act(async () => {
      darkThemeBtn.click();
    });
    expect(getCachedSettings().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Inspector & Export section controls
    for (const testId of [
      'inspect-code-format-tailwind',
      'inspect-color-format-oklch',
      'inspect-unit-format-rem',
      'inspect-placement-pinned',
      'toggle-inspect-padding',
      'toggle-inspect-margin',
      'toggle-inspect-gap',
    ]) {
      const btn = container.querySelector(
        `[data-testid="${testId}"]`,
      ) as HTMLButtonElement;
      await act(async () => {
        btn.click();
      });
    }
    expect(getCachedSettings().inspect.codeFormat).toBe('tailwind');
    expect(getCachedSettings().inspect.colorFormat).toBe('oklch');
    expect(getCachedSettings().inspect.unitFormat).toBe('rem');
    expect(getCachedSettings().inspect.cardPlacement).toBe('pinned');
    expect(getCachedSettings().inspect.showPadding).toBe(false);
    expect(getCachedSettings().inspect.showMargin).toBe(false);
    expect(getCachedSettings().inspect.showGap).toBe(false);

    // Toggle behavior switches
    for (const testId of [
      'toggle-auto-detect-on-launch',
      'toggle-guides-enabled-by-default',
      'toggle-remember-site-settings',
      'toggle-hold-to-close',
    ]) {
      const btn = container.querySelector(
        `[data-testid="${testId}"]`,
      ) as HTMLButtonElement;
      await act(async () => {
        btn.click();
      });
    }
    expect(getCachedSettings().behavior.autoDetectOnLaunch).toBe(false);
    expect(getCachedSettings().behavior.guidesEnabledByDefault).toBe(false);
    expect(getCachedSettings().behavior.rememberSiteSettings).toBe(false);
    expect(getCachedSettings().behavior.holdToClose).toBe(false);

    // Record a new hotkey for toggleGuides (Shift+X), cancel another with Escape, and reset single + all hotkeys
    const recordToggleGuidesBtn = container.querySelector(
      '[data-testid="hotkey-record-toggleGuides"]',
    ) as HTMLButtonElement;
    await act(async () => {
      recordToggleGuidesBtn.click();
    });
    expect(recordToggleGuidesBtn.textContent).toContain('Press keys...');

    // Pressing standalone Shift is ignored while recording
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'ShiftLeft', shiftKey: true }),
      );
    });
    expect(recordToggleGuidesBtn.textContent).toContain('Press keys...');

    // Pressing Shift+X records the shortcut
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyX',
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(getCachedSettings().hotkeys.toggleGuides.code).toBe('KeyX');
    expect(recordToggleGuidesBtn.textContent).toBe('Shift+X');

    // Reset single modified hotkey
    const resetSingleHotkeyBtn = container.querySelector(
      '[data-testid="reset-hotkey-toggleGuides"]',
    ) as HTMLButtonElement;
    expect(resetSingleHotkeyBtn).not.toBeNull();
    await act(async () => {
      resetSingleHotkeyBtn.click();
    });
    expect(getCachedSettings().hotkeys.toggleGuides.code).toBe('KeyG');

    // Start recording and cancel via Escape
    await act(async () => {
      recordToggleGuidesBtn.click();
    });
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }),
      );
    });
    expect(recordToggleGuidesBtn.textContent).toBe('Shift+G');

    // Toggle hotkeys master switch and reset hotkeys button
    const toggleHotkeysBtn = container.querySelector(
      '[data-testid="toggle-hotkeys-enabled"]',
    ) as HTMLButtonElement;
    await act(async () => {
      toggleHotkeysBtn.click();
    });
    expect(getCachedSettings().hotkeys.enabled).toBe(false);

    const resetHotkeysBtn = container.querySelector(
      '[data-testid="reset-hotkeys"]',
    ) as HTMLButtonElement;
    await act(async () => {
      resetHotkeysBtn.click();
    });
    expect(getCachedSettings().hotkeys.enabled).toBe(true);

    // Edit Default Layout Guides across Columns, Rows, and Grid tabs
    const countInput = container.querySelector(
      '#guide-count',
    ) as HTMLInputElement;
    await act(async () => {
      countInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(getCachedSettings().defaultGuides.columns.count).toBe(13);

    const hexInput = container.querySelector(
      '#guide-color',
    ) as HTMLInputElement;
    await act(async () => {
      setNativeInputValue(hexInput, '00AAFF');
    });
    expect(getCachedSettings().defaultGuides.columns.color).toBe('#00AAFF');

    // Switch to Rows tab and edit count
    const rowsTabBtn = container.querySelector(
      '[data-testid="default-tab-rows"]',
    ) as HTMLButtonElement;
    await act(async () => {
      rowsTabBtn.click();
    });
    const rowsCountInput = container.querySelector(
      '#guide-count',
    ) as HTMLInputElement;
    await act(async () => {
      rowsCountInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
    });
    expect(getCachedSettings().defaultGuides.rows.count).toBe(6);

    // Switch to Grid tab and edit size + opacity
    const gridTabBtn = container.querySelector(
      '[data-testid="default-tab-grid"]',
    ) as HTMLButtonElement;
    await act(async () => {
      gridTabBtn.click();
    });
    const gridSizeInput = container.querySelector(
      '#guide-size',
    ) as HTMLInputElement;
    const opacityInput = container.querySelector(
      'input[aria-label="Guide opacity"]',
    ) as HTMLInputElement;
    await act(async () => {
      gridSizeInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      );
      setNativeInputValue(opacityInput, '45');
    });
    expect(getCachedSettings().defaultGuides.grid.size).toBe(9);
    expect(getCachedSettings().defaultGuides.grid.opacity).toBe(45);

    // Reset default guides button
    const resetDefaultGuidesBtn = container.querySelector(
      '[data-testid="reset-default-guides"]',
    ) as HTMLButtonElement;
    await act(async () => {
      resetDefaultGuidesBtn.click();
    });
    expect(getCachedSettings().defaultGuides.columns.count).toBe(12);
    expect(getCachedSettings().defaultGuides.grid.size).toBe(8);

    // Reset all settings to defaults
    const resetAllBtn = container.querySelector(
      '[data-testid="reset-all-settings"]',
    ) as HTMLButtonElement;
    await act(async () => {
      resetAllBtn.click();
    });
    expect(getCachedSettings().theme).toBe('system');
    expect(getCachedSettings().behavior.holdToClose).toBe(true);
  });
});
