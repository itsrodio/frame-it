import type {
  BaseGuideSettings,
  GridGuideSettings,
  LinearGuideSettings,
} from '@/types/layout-guides';

/**
 * Strips the leading `#`, converts the HEX string to uppercase,
 * and returns a valid 6-digit CSS HEX with a fallback.
 */
export function normalizeHexColor(
  hex: string,
  fallback = '#FF0000',
): {
  cleanHex: string;
  validCssHex: string;
} {
  const cleanHex = hex.replace(/^#/, '').toUpperCase();
  const validCssHex = /^[0-9A-F]{6}$/i.test(cleanHex)
    ? `#${cleanHex}`
    : fallback;
  return { cleanHex, validCssHex };
}

/**
 * Builds the color & opacity props for `ColorOpacityField`, `LinearGuideFields`, and `GridGuideFields`.
 */
export function buildColorOpacityProps(
  settings: BaseGuideSettings,
  onUpdate: (patch: Partial<BaseGuideSettings>) => void,
) {
  const { cleanHex, validCssHex } = normalizeHexColor(settings.color);

  const onHexChange = (raw: string) => {
    const sanitized = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    onUpdate({ color: `#${sanitized}` });
  };

  const onOpacityChange = (raw: string) => {
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    onUpdate({ opacity: Math.max(0, Math.min(100, num)) });
  };

  return {
    cleanHex,
    validCssHex,
    opacity: settings.opacity,
    onHexChange,
    onOpacityChange,
  };
}

/**
 * Converts a HEX color and opacity (0–100) into an 8-digit CSS HEX (#RRGGBBAA).
 */
export function formatGuideColor(hex: string, opacity: number): string {
  const { validCssHex } = normalizeHexColor(hex);
  const clampedOpacity = Math.max(0, Math.min(100, opacity));
  const alpha = Math.round((clampedOpacity / 100) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${validCssHex}${alpha}`;
}

export function isLinearModified(
  current: LinearGuideSettings,
  defaults: LinearGuideSettings,
): boolean {
  return (
    current.count !== defaults.count ||
    current.color.toUpperCase() !== defaults.color.toUpperCase() ||
    current.opacity !== defaults.opacity ||
    current.alignment !== defaults.alignment ||
    current.itemSize !== defaults.itemSize ||
    current.maxSize !== defaults.maxSize ||
    current.margin !== defaults.margin ||
    current.gutter !== defaults.gutter ||
    current.offset !== defaults.offset ||
    current.followScroll !== defaults.followScroll
  );
}

export function isGridModified(
  current: GridGuideSettings,
  defaults: GridGuideSettings,
): boolean {
  return (
    current.size !== defaults.size ||
    current.color.toUpperCase() !== defaults.color.toUpperCase() ||
    current.opacity !== defaults.opacity ||
    current.offsetX !== defaults.offsetX ||
    current.offsetY !== defaults.offsetY ||
    current.followScroll !== defaults.followScroll
  );
}
