import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOTKEYS,
  eventToHotkeyBinding,
  formatHotkey,
  formatKeyCode,
  isHotkeyEqual,
  matchesHotkey,
} from '@/lib/hotkeys';

describe('hotkeys utils', () => {
  it('formats key codes and hotkey bindings into human-readable shortcut strings', () => {
    expect(formatKeyCode('KeyG')).toBe('G');
    expect(formatKeyCode('Digit1')).toBe('1');
    expect(formatKeyCode('Numpad5')).toBe('Num5');
    expect(formatKeyCode('Semicolon')).toBe(';');
    expect(formatKeyCode('F12')).toBe('F12');

    expect(formatHotkey(DEFAULT_HOTKEYS.toggleGuides)).toBe('Shift+G');
    expect(
      formatHotkey({
        code: 'KeyK',
        shift: true,
        ctrlOrMeta: true,
        alt: true,
      }),
    ).toBe('Ctrl+Alt+Shift+K');
  });

  it('compares hotkey bindings with isHotkeyEqual and matches KeyboardEvents with matchesHotkey', () => {
    const binding = {
      code: 'KeyI',
      shift: true,
      ctrlOrMeta: false,
      alt: false,
    };

    expect(isHotkeyEqual(binding, DEFAULT_HOTKEYS.toggleInspect)).toBe(true);
    expect(isHotkeyEqual(binding, DEFAULT_HOTKEYS.toggleGuides)).toBe(false);

    const matchingEvent = new KeyboardEvent('keydown', {
      code: 'KeyI',
      shiftKey: true,
    });
    const wrongModifierEvent = new KeyboardEvent('keydown', {
      code: 'KeyI',
      shiftKey: true,
      ctrlKey: true,
    });

    expect(matchesHotkey(matchingEvent, binding)).toBe(true);
    expect(matchesHotkey(wrongModifierEvent, binding)).toBe(false);
  });

  it('converts KeyboardEvents to HotkeyBinding via eventToHotkeyBinding and ignores standalone modifier keys', () => {
    expect(
      eventToHotkeyBinding(new KeyboardEvent('keydown', { code: 'ShiftLeft' })),
    ).toBeNull();
    expect(
      eventToHotkeyBinding(
        new KeyboardEvent('keydown', { code: 'ControlRight' }),
      ),
    ).toBeNull();
    expect(
      eventToHotkeyBinding(new KeyboardEvent('keydown', { code: '' })),
    ).toBeNull();

    expect(
      eventToHotkeyBinding(
        new KeyboardEvent('keydown', {
          code: 'KeyP',
          shiftKey: true,
          altKey: true,
        }),
      ),
    ).toEqual({
      code: 'KeyP',
      shift: true,
      ctrlOrMeta: false,
      alt: true,
    });
  });
});
