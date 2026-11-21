import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import content from '@/entrypoints/content';

describe('content entrypoint', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    delete window.__frameItInjected;
    document.body.innerHTML = '';
  });

  it('mounts shadow root UI once and toggles it via TOGGLE_OVERLAY message', async () => {
    const mountSpy = vi.fn();
    const removeSpy = vi.fn();

    vi.spyOn(
      await import('wxt/utils/content-script-ui/shadow-root'),
      'createShadowRootUi',
    ).mockResolvedValue({
      mount: mountSpy,
      remove: removeSpy,
    } as unknown as Awaited<ReturnType<typeof createShadowRootUi>>);

    const ctx = {} as ContentScriptContext;
    await content.main(ctx);

    expect(window.__frameItInjected).toBe(true);
    expect(mountSpy).toHaveBeenCalledTimes(1);

    // Calling main a second time should no-op due to __frameItInjected guard
    await content.main(ctx);
    expect(mountSpy).toHaveBeenCalledTimes(1);

    // First TOGGLE_OVERLAY closes the mounted UI
    await fakeBrowser.runtime.onMessage.trigger(
      { type: 'TOGGLE_OVERLAY' },
      {},
      vi.fn(),
    );
    expect(removeSpy).toHaveBeenCalledTimes(1);

    // Second TOGGLE_OVERLAY mounts it back
    await fakeBrowser.runtime.onMessage.trigger(
      { type: 'TOGGLE_OVERLAY' },
      {},
      vi.fn(),
    );
    expect(mountSpy).toHaveBeenCalledTimes(2);
  });

  it('executes createShadowRootUi onMount (dark/light theme) and onRemove callbacks and ignores unknown messages', async () => {
    const createUiSpy = vi
      .spyOn(
        await import('wxt/utils/content-script-ui/shadow-root'),
        'createShadowRootUi',
      )
      .mockResolvedValue({
        mount: vi.fn(),
        remove: vi.fn(),
      } as unknown as Awaited<ReturnType<typeof createShadowRootUi>>);

    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const ctx = {} as ContentScriptContext;
    await content.main(ctx);

    const uiConfig = createUiSpy.mock.calls[0]?.[1];
    expect(uiConfig).toBeDefined();

    const hostContainer = document.createElement('div');
    document.body.appendChild(hostContainer);

    let mountedRoot:
      | ReturnType<NonNullable<typeof uiConfig>['onMount']>
      | undefined;
    await act(async () => {
      mountedRoot = uiConfig?.onMount?.(
        hostContainer,
        hostContainer as unknown as ShadowRoot,
        hostContainer,
      );
    });
    const wrapper = hostContainer.querySelector('#frameit-root') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.classList.contains('dark')).toBe(true);

    // Unrelated runtime messages should be ignored
    await fakeBrowser.runtime.onMessage.trigger(
      { type: 'OTHER_MESSAGE' },
      {},
      vi.fn(),
    );

    act(() => {
      uiConfig?.onRemove?.(mountedRoot);
    });

    // Also test light theme branch
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

    const lightContainer = document.createElement('div');
    let lightRoot:
      | ReturnType<NonNullable<typeof uiConfig>['onMount']>
      | undefined;
    await act(async () => {
      lightRoot = uiConfig?.onMount?.(
        lightContainer,
        lightContainer as unknown as ShadowRoot,
        lightContainer,
      );
    });
    const lightWrapper = lightContainer.querySelector(
      '#frameit-root',
    ) as HTMLElement;
    expect(lightWrapper.classList.contains('light')).toBe(true);
    act(() => {
      uiConfig?.onRemove?.(lightRoot);
    });
  });
});
