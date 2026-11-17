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
});
