import { buildFigmaSvg } from '@/lib/inspect-figma-svg';
import {
  buildInspectedCssSnippet,
  type FormattedColor,
  type InspectedElementStyles,
} from '@/lib/inspect-styles';
import type {
  InspectCodeFormat,
  InspectColorFormat,
  InspectUnitFormat,
} from '@/types/settings';

export { buildFigmaSvg };

export function formatColorByPreference(
  color: FormattedColor,
  format: InspectColorFormat,
): string {
  if (format === 'rgb') return color.rgb;
  if (format === 'oklch') return color.oklch;
  return color.hex;
}

/**
 * Formats a pixel dimension string (e.g. `16px` or `12px 24px`)
 * according to the selected unit format (`px`, `rem`, or `both`).
 */
export function formatDimensionWithUnit(
  pxText: string,
  unitFormat: InspectUnitFormat,
  basePx = 16,
): string {
  if (unitFormat === 'px' || !pxText.includes('px')) {
    return pxText;
  }

  const toRemToken = (match: string, numStr: string) => {
    const px = Number.parseFloat(numStr);
    if (!Number.isFinite(px)) return match;
    if (px === 0) return unitFormat === 'rem' ? '0rem' : '0px';
    const rem = Math.round((px / basePx) * 1000) / 1000;
    return `${rem}rem`;
  };

  const remConverted = pxText.replace(/(-?\d+(?:\.\d+)?)px\b/g, toRemToken);
  if (unitFormat === 'rem') {
    return remConverted;
  }
  if (remConverted === pxText) {
    return pxText;
  }
  return `${pxText} (${remConverted})`;
}

const TW_SPACING_MAP: Record<number, string> = {
  0: '0',
  1: 'px',
  2: '0.5',
  4: '1',
  6: '1.5',
  8: '2',
  10: '2.5',
  12: '3',
  14: '3.5',
  16: '4',
  20: '5',
  24: '6',
  28: '7',
  32: '8',
  36: '9',
  40: '10',
  44: '11',
  48: '12',
  56: '14',
  64: '16',
  80: '20',
  96: '24',
};

function pxToTwSpacing(prefix: string, pxVal: number): string {
  const token = TW_SPACING_MAP[pxVal];
  return token !== undefined ? `${prefix}-${token}` : `${prefix}-[${pxVal}px]`;
}

function boxShorthandToTw(prefix: 'p' | 'm', shorthand: string): string[] {
  if (!shorthand || shorthand === '0px') return [];
  const nums = shorthand
    .split(/\s+/)
    .map((s) => Math.round(Number.parseFloat(s) || 0));

  if (nums.length === 1) {
    const v = nums[0] ?? 0;
    return v === 0 ? [] : [pxToTwSpacing(prefix, v)];
  }
  if (nums.length === 2) {
    const [y = 0, x = 0] = nums;
    const out: string[] = [];
    if (y !== 0) out.push(pxToTwSpacing(`${prefix}y`, y));
    if (x !== 0) out.push(pxToTwSpacing(`${prefix}x`, x));
    return out;
  }
  const [t = 0, r = 0, b = 0, l = 0] = nums;
  const out: string[] = [];
  if (t !== 0) out.push(pxToTwSpacing(`${prefix}t`, t));
  if (r !== 0) out.push(pxToTwSpacing(`${prefix}r`, r));
  if (b !== 0) out.push(pxToTwSpacing(`${prefix}b`, b));
  if (l !== 0) out.push(pxToTwSpacing(`${prefix}l`, l));
  return out;
}

const TW_RADIUS_MAP: Record<string, string> = {
  '2px': 'rounded-xs',
  '4px': 'rounded-sm',
  '6px': 'rounded-md',
  '8px': 'rounded-lg',
  '12px': 'rounded-xl',
  '16px': 'rounded-2xl',
  '24px': 'rounded-3xl',
  '9999px': 'rounded-full',
};

const TW_WEIGHT_MAP: Record<string, string> = {
  '100': 'font-thin',
  '200': 'font-extralight',
  '300': 'font-light',
  '400': 'font-normal',
  '500': 'font-medium',
  '600': 'font-semibold',
  '700': 'font-bold',
  '800': 'font-extrabold',
  '900': 'font-black',
};

/**
 * Generates Tailwind CSS utility classes from computed element styles.
 */
export function buildTailwindClasses(styles: InspectedElementStyles): string {
  const classes: string[] = [];

  const display = styles.layout.display;
  if (
    display === 'flex' ||
    display === 'inline-flex' ||
    display === 'grid' ||
    display === 'inline-grid' ||
    display === 'inline-block' ||
    display === 'hidden'
  ) {
    classes.push(display);
  }

  if (styles.layout.gap) {
    const gapParts = styles.layout.gap
      .split(/\s+/)
      .map((s) => Math.round(Number.parseFloat(s) || 0));
    if (gapParts.length === 1 && (gapParts[0] ?? 0) > 0) {
      classes.push(pxToTwSpacing('gap', gapParts[0] ?? 0));
    } else if (gapParts.length === 2) {
      if ((gapParts[0] ?? 0) > 0)
        classes.push(pxToTwSpacing('gap-y', gapParts[0] ?? 0));
      if ((gapParts[1] ?? 0) > 0)
        classes.push(pxToTwSpacing('gap-x', gapParts[1] ?? 0));
    }
  }

  classes.push(...boxShorthandToTw('p', styles.layout.padding));
  classes.push(...boxShorthandToTw('m', styles.layout.margin));

  if (styles.layout.borderRadius && styles.layout.borderRadius !== '0px') {
    const mapped = TW_RADIUS_MAP[styles.layout.borderRadius];
    classes.push(
      mapped ?? `rounded-[${styles.layout.borderRadius.replace(/\s+/g, '_')}]`,
    );
  }

  const fontSize = styles.typography.fontSize;
  const lineHeight = styles.typography.lineHeight;
  if (lineHeight && lineHeight !== 'normal') {
    classes.push(`text-[${fontSize}]/[${lineHeight}]`);
  } else {
    classes.push(`text-[${fontSize}]`);
  }

  const weightClass = TW_WEIGHT_MAP[styles.typography.fontWeight];
  if (weightClass && weightClass !== 'font-normal') {
    classes.push(weightClass);
  }

  classes.push(`text-[${styles.colors.text.hex.toLowerCase()}]`);
  if (!styles.colors.isInheritedBackground) {
    classes.push(`bg-[${styles.colors.background.hex.toLowerCase()}]`);
  }

  return classes.join(' ');
}

/**
 * Generates a React JSX snippet with Tailwind classes for the inspected element.
 */
export function buildJsxSnippet(
  el: HTMLElement,
  styles: InspectedElementStyles,
): string {
  const tag = el.tagName.toLowerCase();
  const tw = buildTailwindClasses(styles);
  const directText = (el.textContent ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);

  if (tag === 'img' && el instanceof HTMLImageElement) {
    const src = el.getAttribute('src') || el.src || '';
    const alt = el.getAttribute('alt') || '';
    return `<img className="${tw}" src="${src}" alt="${alt}" width={${styles.width}} height={${styles.height}} />`;
  }

  const content = directText || '{/* children */}';
  return `<${tag} className="${tw}">\n  ${content}\n</${tag}>`;
}

export function buildCodeSnippet(
  el: HTMLElement,
  styles: InspectedElementStyles,
  format: InspectCodeFormat,
): string {
  if (format === 'tailwind') {
    return buildTailwindClasses(styles);
  }
  if (format === 'jsx') {
    return buildJsxSnippet(el, styles);
  }
  return buildInspectedCssSnippet(styles);
}
