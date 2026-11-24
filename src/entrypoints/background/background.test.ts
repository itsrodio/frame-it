import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'wxt/browser';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import background from '@/entrypoints/background';

function createMockTab(
  overrides: Partial<Browser.tabs.Tab> = {},
): Browser.tabs.Tab {
  return {
    index: 0,
    pinned: false,
    highlighted: false,
    windowId: 1,
    active: true,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    frozen: false,
    lastAccessed: Date.now(),
    ...overrides,
  };
}

describe('background entrypoint', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  it('sends TOGGLE_OVERLAY message when action icon is clicked', async () => {
    const sendMessageSpy = vi
      .spyOn(browser.tabs, 'sendMessage')
      .mockResolvedValue(undefined);

    background.main();

    await fakeBrowser.action.onClicked.trigger(createMockTab({ id: 42 }));

    expect(sendMessageSpy).toHaveBeenCalledWith(42, {
      type: 'TOGGLE_OVERLAY',
    });
  });

  it('injects content script when sendMessage fails (script not yet injected)', async () => {
    vi.spyOn(browser.tabs, 'sendMessage').mockRejectedValue(
      new Error('Receiving end does not exist'),
    );
    const executeScriptSpy = vi
      .spyOn(browser.scripting, 'executeScript')
      .mockResolvedValue(
        [] as unknown as Awaited<
          ReturnType<typeof browser.scripting.executeScript>
        >,
      );

    background.main();

    await fakeBrowser.action.onClicked.trigger(createMockTab({ id: 99 }));

    expect(executeScriptSpy).toHaveBeenCalledWith({
      target: { tabId: 99 },
      files: ['/content-scripts/content.js'],
    });
  });

  it('does nothing when tab has no id', async () => {
    const sendMessageSpy = vi.spyOn(browser.tabs, 'sendMessage');

    background.main();

    await fakeBrowser.action.onClicked.trigger(createMockTab());

    expect(sendMessageSpy).not.toHaveBeenCalled();
  });

  it('captures visible tab PNG when CAPTURE_VISIBLE_TAB message is received', async () => {
    const captureSpy = vi
      .spyOn(browser.tabs, 'captureVisibleTab')
      .mockResolvedValue('data:image/png;base64,SCREENSHOT' as never);

    background.main();

    const sendResponse = vi.fn();
    await fakeBrowser.runtime.onMessage.trigger(
      { type: 'CAPTURE_VISIBLE_TAB' },
      { tab: createMockTab({ id: 7, windowId: 12 }) },
      sendResponse,
    );

    expect(captureSpy).toHaveBeenCalledWith(12, { format: 'png' });
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        dataUrl: 'data:image/png;base64,SCREENSHOT',
      });
    });
  });

  it('opens welcome options page on fresh install only', async () => {
    const createTabSpy = vi
      .spyOn(browser.tabs, 'create')
      .mockResolvedValue(createMockTab({ id: 101 }) as never);

    background.main();

    await fakeBrowser.runtime.onInstalled.trigger({
      reason: 'update',
      previousVersion: '0.3.0',
    });
    expect(createTabSpy).not.toHaveBeenCalled();

    await fakeBrowser.runtime.onInstalled.trigger({
      reason: 'install',
    });
    expect(createTabSpy).toHaveBeenCalledTimes(1);
    expect(createTabSpy.mock.calls[0]?.[0]?.url).toContain(
      'options.html?welcome=1',
    );
  });

  it('opens options page when OPEN_OPTIONS_PAGE message is received', async () => {
    const openOptionsSpy = vi
      .spyOn(browser.runtime, 'openOptionsPage')
      .mockResolvedValue(undefined);

    background.main();

    await fakeBrowser.runtime.onMessage.trigger(
      { type: 'OPEN_OPTIONS_PAGE' },
      { tab: createMockTab({ id: 7 }) },
      vi.fn(),
    );

    expect(openOptionsSpy).toHaveBeenCalledTimes(1);
  });
});
