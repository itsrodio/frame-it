import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HelpTool } from '@/components/overlay/dock/help-tool';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DEFAULT_HOTKEYS } from '@/lib/hotkeys';
import {
  BUG_REPORT_URL,
  CHROME_WEB_STORE_URL,
  FEATURE_REQUEST_URL,
} from '@/lib/links';
import { PortalContext } from '@/lib/portal-context';

describe('HelpTool', () => {
  let portalContainer: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    portalContainer = document.createElement('div');
    document.body.appendChild(portalContainer);
    root = ReactDOM.createRoot(portalContainer);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    portalContainer.remove();
  });

  it('opens the help popover, lists shortcuts, triggers tour & options, and renders feedback links + version', () => {
    const onStartTour = vi.fn();
    const onOpenOptions = vi.fn();

    act(() => {
      root.render(
        <PortalContext.Provider value={portalContainer}>
          <TooltipProvider>
            <HelpTool
              hotkeys={DEFAULT_HOTKEYS}
              onStartTour={onStartTour}
              onOpenOptions={onOpenOptions}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    const trigger = portalContainer.querySelector(
      '[data-testid="help-popover-trigger"]',
    ) as HTMLButtonElement;
    expect(trigger).not.toBeNull();

    act(() => {
      trigger.click();
    });

    const shortcutsList = portalContainer.querySelector(
      '[data-testid="help-shortcuts-list"]',
    );
    expect(shortcutsList).not.toBeNull();
    expect(shortcutsList?.textContent).toContain('Shift+G');
    expect(shortcutsList?.textContent).toContain('Shift+I');
    expect(shortcutsList?.textContent).toContain('Shift+O');

    const bugLink = portalContainer.querySelector(
      '[data-testid="help-report-bug"]',
    ) as HTMLAnchorElement;
    const featureLink = portalContainer.querySelector(
      '[data-testid="help-feature-request"]',
    ) as HTMLAnchorElement;
    const storeLink = portalContainer.querySelector(
      '[data-testid="help-rate-store"]',
    ) as HTMLAnchorElement;

    expect(bugLink?.href).toBe(BUG_REPORT_URL);
    expect(featureLink?.href).toBe(FEATURE_REQUEST_URL);
    expect(storeLink?.href).toBe(CHROME_WEB_STORE_URL);

    const versionEl = portalContainer.querySelector(
      '[data-testid="help-version"]',
    );
    expect(versionEl?.textContent).toContain('v');

    const optionsBtn = portalContainer.querySelector(
      '[data-testid="help-open-options"]',
    ) as HTMLButtonElement;
    act(() => {
      optionsBtn.click();
    });
    expect(onOpenOptions).toHaveBeenCalledTimes(1);

    // Re-open and start tour
    act(() => {
      trigger.click();
    });
    const startTourBtn = portalContainer.querySelector(
      '[data-testid="help-start-tour"]',
    ) as HTMLButtonElement;
    act(() => {
      startTourBtn.click();
    });
    expect(onStartTour).toHaveBeenCalledTimes(1);
  });

  it('shows disabled notice when hotkeys are disabled in settings', () => {
    act(() => {
      root.render(
        <PortalContext.Provider value={portalContainer}>
          <TooltipProvider>
            <HelpTool
              hotkeys={{ ...DEFAULT_HOTKEYS, enabled: false }}
              onStartTour={vi.fn()}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    const trigger = portalContainer.querySelector(
      '[data-testid="help-popover-trigger"]',
    ) as HTMLButtonElement;
    act(() => {
      trigger.click();
    });

    expect(
      portalContainer.querySelector('[data-testid="help-shortcuts-disabled"]'),
    ).not.toBeNull();
    expect(
      portalContainer.querySelector('[data-testid="help-shortcuts-list"]'),
    ).toBeNull();
  });
});
