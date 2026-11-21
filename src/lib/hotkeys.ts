import type {
  ExtensionHotkeys,
  HotkeyAction,
  HotkeyBinding,
} from '@/types/settings';

export const HOTKEY_ACTIONS: HotkeyAction[] = [
  'toggleGuides',
  'toggleInspect',
  'autoDetect',
  'pickContainer',
  'switchColumns',
  'switchRows',
  'switchGrid',
  'toggleDesignOverlay',
  'toggleDesignOverlayLock',
];

export const DEFAULT_HOTKEYS: ExtensionHotkeys = {
  enabled: true,
  toggleGuides: {
    code: 'KeyG',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
  toggleInspect: {
    code: 'KeyI',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
  autoDetect: {
    code: 'KeyA',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
  pickContainer: {
    code: 'KeyC',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
  switchColumns: {
    code: 'Digit1',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
  switchRows: {
    code: 'Digit2',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
  switchGrid: {
    code: 'Digit3',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
  toggleDesignOverlay: {
    code: 'KeyO',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
  toggleDesignOverlayLock: {
    code: 'KeyL',
    shift: true,
    ctrlOrMeta: false,
    alt: false,
  },
};

const MODIFIER_CODES = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
]);

const SPECIAL_KEY_LABELS: Record<string, string> = {
  Semicolon: ';',
  Equal: '=',
  Comma: ',',
  Minus: '-',
  Period: '.',
  Slash: '/',
  Backquote: '`',
  BracketLeft: '[',
  Backslash: '\\',
  BracketRight: ']',
  Quote: "'",
  Space: 'Space',
};

export function formatKeyCode(code: string): string {
  if (code.startsWith('Key') && code.length === 4) {
    return code.slice(3);
  }
  if (code.startsWith('Digit') && code.length === 6) {
    return code.slice(5);
  }
  if (code.startsWith('Numpad') && code.length === 7) {
    return `Num${code.slice(6)}`;
  }
  return SPECIAL_KEY_LABELS[code] ?? code;
}

export function formatHotkey(binding: HotkeyBinding): string {
  const parts: string[] = [];
  if (binding.ctrlOrMeta) parts.push('Ctrl');
  if (binding.alt) parts.push('Alt');
  if (binding.shift) parts.push('Shift');
  parts.push(formatKeyCode(binding.code));
  return parts.join('+');
}

export function isHotkeyEqual(a: HotkeyBinding, b: HotkeyBinding): boolean {
  return (
    a.code === b.code &&
    a.shift === b.shift &&
    a.ctrlOrMeta === b.ctrlOrMeta &&
    a.alt === b.alt
  );
}

export function matchesHotkey(
  e: KeyboardEvent,
  binding: HotkeyBinding,
): boolean {
  const hasCtrlOrMeta = e.ctrlKey || e.metaKey;
  return (
    e.code === binding.code &&
    e.shiftKey === binding.shift &&
    hasCtrlOrMeta === binding.ctrlOrMeta &&
    e.altKey === binding.alt
  );
}

/**
 * Converts a KeyboardEvent into a HotkeyBinding when recording a shortcut.
 * Returns null if only a modifier key was pressed.
 */
export function eventToHotkeyBinding(e: KeyboardEvent): HotkeyBinding | null {
  if (!e.code || MODIFIER_CODES.has(e.code)) {
    return null;
  }
  return {
    code: e.code,
    shift: e.shiftKey,
    ctrlOrMeta: e.ctrlKey || e.metaKey,
    alt: e.altKey,
  };
}
