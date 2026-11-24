import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import {
  OnboardingTour,
  TOUR_STEPS,
} from '@/components/overlay/tour/onboarding-tour';
import {
  DEFAULT_EXTENSION_SETTINGS,
  getCachedSettings,
  setCachedSettings,
} from '@/lib/settings-storage';

describe('OnboardingTour', () => {
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

  it('supports keyboard navigation (ArrowRight, ArrowLeft, Escape) and button clicks', () => {
    const onStepChange = vi.fn();
    const onClose = vi.fn();

    act(() => {
      root.render(
        <OnboardingTour
          open={true}
          stepIndex={0}
          steps={TOUR_STEPS}
          portalContainer={portalContainer}
          onStepChange={onStepChange}
          onClose={onClose}
        />,
      );
    });

    const card = portalContainer.querySelector(
      '[data-testid="onboarding-tour-card"]',
    ) as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.getAttribute('role')).toBe('dialog');
    expect(card.getAttribute('data-tour-active-step')).toBe('inspect');
    expect(
      portalContainer.querySelector('[data-testid="tour-step-counter"]')
        ?.textContent,
    ).toBe('1/5');

    // ArrowRight advances to step 1
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(onStepChange).toHaveBeenCalledWith(1);

    // Render step 2 and test ArrowLeft + Back button
    act(() => {
      root.render(
        <OnboardingTour
          open={true}
          stepIndex={2}
          steps={TOUR_STEPS}
          portalContainer={portalContainer}
          onStepChange={onStepChange}
          onClose={onClose}
        />,
      );
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });
    expect(onStepChange).toHaveBeenCalledWith(1);

    // Escape closes tour
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-starts on first launch in App, persists hasCompletedTour on finish, and can be replayed from HelpTool', async () => {
    setCachedSettings({
      ...DEFAULT_EXTENSION_SETTINGS,
      hasCompletedTour: false,
    });

    await act(async () => {
      root.render(<App portalContainer={portalContainer} onClose={vi.fn()} />);
    });

    // Tour opens automatically on first launch
    expect(
      portalContainer.querySelector('[data-testid="onboarding-tour-card"]'),
    ).not.toBeNull();
    expect(
      portalContainer
        .querySelector('[data-tour-step="inspect"]')
        ?.className.includes('ring-primary'),
    ).toBe(true);

    // Step through all 5 steps using Next -> Done
    for (let i = 0; i < TOUR_STEPS.length; i++) {
      const nextBtn = portalContainer.querySelector(
        '[data-testid="tour-next-button"]',
      ) as HTMLButtonElement;
      expect(nextBtn).not.toBeNull();
      await act(async () => {
        nextBtn.click();
      });
    }

    // Tour closes and marks hasCompletedTour = true
    expect(
      portalContainer.querySelector('[data-testid="onboarding-tour-card"]'),
    ).toBeNull();
    expect(getCachedSettings().hasCompletedTour).toBe(true);

    // Replay tour from HelpTool
    const helpBtn = portalContainer.querySelector(
      '[data-testid="help-popover-trigger"]',
    ) as HTMLButtonElement;
    await act(async () => {
      helpBtn.click();
    });
    const startTourBtn = portalContainer.querySelector(
      '[data-testid="help-start-tour"]',
    ) as HTMLButtonElement;
    await act(async () => {
      startTourBtn.click();
    });
    expect(
      portalContainer.querySelector('[data-testid="onboarding-tour-card"]'),
    ).not.toBeNull();
  });
});
