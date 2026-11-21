import {
  generateChromeMessages,
  parseMessagesObject,
} from '@wxt-dev/i18n/build';
import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { InspectMeasureOverlay } from '@/components/overlay/inspect/inspect-measure-overlay';
import { ContainerPickerOverlay } from '@/components/overlay/layout-guides/container-picker-overlay';
import {
  getTestLocale,
  LOCALE_RAW_MAPS,
  type SupportedLocaleCode,
  setTestLocale,
} from '@/test-setup';

const EXPECTED_LOCALES: SupportedLocaleCode[] = [
  'en',
  'es',
  'zh_CN',
  'pt_BR',
  'de',
  'fr',
  'ru',
  'ja',
  'ko',
];

describe('i18n locales & UI translations', () => {
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

  it('has identical message keys, valid placeholders, and CWS-compliant description length (<= 132 chars) across all 9 locales', () => {
    const baseCompiled = generateChromeMessages(
      parseMessagesObject(LOCALE_RAW_MAPS.en),
    );
    const baseKeys = Object.keys(baseCompiled).sort();

    expect(Object.keys(LOCALE_RAW_MAPS).sort()).toEqual(
      [...EXPECTED_LOCALES].sort(),
    );

    for (const locale of EXPECTED_LOCALES) {
      const raw = LOCALE_RAW_MAPS[locale];
      const compiled = generateChromeMessages(parseMessagesObject(raw));
      const keys = Object.keys(compiled).sort();

      // Exact same key set as English default_locale
      expect(keys, `Key mismatch in locale "${locale}"`).toEqual(baseKeys);

      // Chrome Web Store manifest description limit is 132 characters
      expect(
        raw.extDescription.length,
        `extDescription in "${locale}" exceeds 132 characters`,
      ).toBeGreaterThan(10);
      expect(
        raw.extDescription.length,
        `extDescription in "${locale}" exceeds 132 characters`,
      ).toBeLessThanOrEqual(132);

      // Every message must be a non-empty string (non-empty in @wxt-dev/i18n so it never logs "Message not found")
      for (const [key, entry] of Object.entries(compiled)) {
        expect(
          entry.message.trim().length,
          `Empty translation for "${key}" in locale "${locale}"`,
        ).toBeGreaterThan(0);
      }

      // Positional substitutions ($1) must be preserved in badge messages
      expect(compiled.picker_badgePadding?.message).toContain('$1');
      expect(compiled.picker_badgeCols?.message).toContain('$1');
    }
  });

  it('renders localized dock, popover fields, inspect banner, and container picker in Russian (ru) and Japanese (ja)', () => {
    setTestLocale('ru');
    expect(getTestLocale()).toBe('ru');

    act(() => {
      root.render(<App portalContainer={portalContainer} onClose={vi.fn()} />);
    });

    // Dock buttons in Russian
    const toggleGuidesBtn = portalContainer.querySelector(
      'button[aria-label="Переключить направляющие сетки"]',
    );
    const inspectBtn = portalContainer.querySelector(
      'button[aria-label="Инспектор и измерение расстояний"]',
    );
    const closeBtn = portalContainer.querySelector(
      'button[aria-label="Удерживайте, чтобы закрыть FrameIt"]',
    );
    expect(toggleGuidesBtn).not.toBeNull();
    expect(inspectBtn).not.toBeNull();
    expect(closeBtn).not.toBeNull();

    // Open LayoutGuidesTool popover and verify Russian labels
    const popoverTriggers = portalContainer.querySelectorAll(
      '[data-slot="popover-trigger"]',
    );
    const popoverTrigger = popoverTriggers[
      popoverTriggers.length - 1
    ] as HTMLButtonElement;
    act(() => {
      popoverTrigger.click();
    });

    expect(portalContainer.textContent).toContain('Колонки');
    expect(portalContainer.textContent).toContain('Кол-во');
    expect(portalContainer.textContent).toContain('Цвет');
    expect(portalContainer.textContent).toContain('Поля');
    expect(portalContainer.textContent).toContain('Отступ');
    expect(portalContainer.textContent).toContain('Фикс. на экране');

    // Switch to Japanese (ja) where picker.cancelBeforeKey is empty ("")
    setTestLocale('ja');

    const section = document.createElement('section');
    section.id = 'ja-hero';
    document.body.appendChild(section);
    vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 1200,
      height: 400,
      right: 1200,
      bottom: 400,
      toJSON: () => ({}),
    });
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingLeft: '24px',
      paddingRight: '24px',
      maxWidth: '1200px',
      display: 'block',
      gridTemplateColumns: 'none',
      columnGap: '0px',
    } as unknown as CSSStyleDeclaration);
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(section);
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        cb(0);
        return 1;
      });

    act(() => {
      root.render(
        <div>
          <ContainerPickerOverlay
            active={true}
            onSelect={vi.fn()}
            onCancel={vi.fn()}
          />
          <InspectMeasureOverlay active={true} />
        </div>,
      );
    });

    act(() => {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 100, clientY: 100 }),
      );
    });

    expect(portalContainer.textContent).toContain(
      'ページ上の任意のコンテナをクリックしてレイアウトガイドをスナップ',
    );
    expect(portalContainer.textContent).toContain('キャンセルは Esc キー');
    expect(portalContainer.textContent).toContain('(余白 24px)');
    expect(portalContainer.textContent).toContain('12 カラム');
    expect(portalContainer.textContent).toContain('で要素を固定');
    expect(portalContainer.textContent).toContain('距離を測定');

    rafSpy.mockRestore();
  });
});
