import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/lib/theme-provider';

function ThemeConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button
        type="button"
        data-testid="set-dark"
        onClick={() => setTheme('dark')}
      />
      <button
        type="button"
        data-testid="set-light"
        onClick={() => setTheme('light')}
      />
    </div>
  );
}

describe('ThemeProvider', () => {
  let host: HTMLElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = ReactDOM.createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('applies resolved system theme to the container and updates when setTheme is called', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    act(() => {
      root.render(
        <ThemeProvider defaultTheme="system" container={host}>
          <ThemeConsumer />
        </ThemeProvider>,
      );
    });

    expect(host.classList.contains('dark')).toBe(true);
    expect(host.classList.contains('light')).toBe(false);

    const lightBtn = host.querySelector(
      '[data-testid="set-light"]',
    ) as HTMLButtonElement;
    act(() => {
      lightBtn.click();
    });

    expect(host.classList.contains('light')).toBe(true);
    expect(host.classList.contains('dark')).toBe(false);
  });
});
